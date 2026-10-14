import {createHmac,randomInt,randomUUID,timingSafeEqual} from "node:crypto"
import {createStep,createWorkflow,StepResponse,WorkflowResponse} from "@medusajs/framework/workflows-sdk"
import {generateJwtToken,MedusaError,Modules,NotificationStatus} from "@medusajs/framework/utils"
import {createCustomerAccountWorkflow} from "@medusajs/medusa/core-flows"
import {requireMail,sealOtp} from "../../lib/docloroo-mail"
import {otpProof} from "../../modules/docloroo-email-otp/service"
type Challenge={digest:string;attempts:number;expires:number}
function digest(value:string){return createHmac("sha256",process.env.DOCLOROO_TRACKING_SECRET!).update(`docloroo:otp:${value}`).digest("hex")}
function ready(){requireMail();if(!process.env.REDIS_URL)throw new MedusaError(MedusaError.Types.UNEXPECTED_STATE,"OTP requires Redis cache and distributed locking")}
const requestStep=createStep("request",async(input:{email:string;ip:string},{container})=>{
  ready()
  const cache=container.resolve(Modules.CACHE),locks=container.resolve(Modules.LOCKING),key=digest(input.email),ipKey=digest(input.ip)
  const result=await locks.execute([`otp:${key}`,`otp-ip:${ipKey}`],async()=>{
    if(await cache.get(`otp-cooldown:${key}`))throw new MedusaError(MedusaError.Types.NOT_ALLOWED,"انتظر دقيقة قبل طلب كود جديد")
    const emailCount=await cache.get<number>(`otp-rate:${key}`)||0,ipCount=await cache.get<number>(`otp-rate:${ipKey}`)||0
    if(emailCount>=10||ipCount>=30)throw new MedusaError(MedusaError.Types.NOT_ALLOWED,"تم تجاوز عدد طلبات التحقق. حاول لاحقًا")
    await cache.set(`otp-cooldown:${key}`,true,60)
    await cache.set(`otp-rate:${key}`,emailCount+1,3600)
    await cache.set(`otp-rate:${ipKey}`,ipCount+1,3600)
    const code=String(randomInt(0,1000000)).padStart(6,"0"),expires=Date.now()+600000
    const notification=await container.resolve(Modules.NOTIFICATION).createNotifications({to:input.email,channel:"email",template:"docloroo-otp",data:{sealed:sealOtp(input.email,code,expires)},idempotency_key:`otp-${randomUUID()}`})
    if(notification.status!==NotificationStatus.SUCCESS)throw new MedusaError(MedusaError.Types.UNEXPECTED_STATE,"لم يقبل مزوّد البريد إرسال الكود")
    await cache.set(`otp-challenge:${key}`,{digest:digest(`${input.email}:${code}`),attempts:0,expires},600)
    return {accepted:true,expires_in:600}
  },{timeout:10})
  return new StepResponse(result)
})
export const requestEmailCodeWorkflow=createWorkflow("request-email-code",(input:{email:string;ip:string})=>new WorkflowResponse(requestStep(input)))
const verifyStep=createStep("verify",async(input:{email:string;code:string},{container})=>{
  ready()
  const cache=container.resolve(Modules.CACHE),key=digest(input.email)
  const result=await container.resolve(Modules.LOCKING).execute(`otp:${key}`,async()=>{
    const challenge=await cache.get<Challenge>(`otp-challenge:${key}`)
    if(!challenge||challenge.expires<Date.now()||challenge.attempts>=5)throw new MedusaError(MedusaError.Types.UNAUTHORIZED,"الكود غير صالح أو انتهت مدته. اطلب كودًا جديدًا")
    challenge.attempts+=1
    await cache.set(`otp-challenge:${key}`,challenge,Math.max(1,Math.ceil((challenge.expires-Date.now())/1000)))
    const actual=Buffer.from(digest(`${input.email}:${input.code}`)),expected=Buffer.from(challenge.digest)
    if(actual.length!==expected.length||!timingSafeEqual(actual,expected))throw new MedusaError(MedusaError.Types.UNAUTHORIZED,"الكود غير صالح")
    // Consume the code before any account/session mutation; never compensate this.
    await cache.invalidate(`otp-challenge:${key}`)
    const expires=Date.now()+10000,auth=container.resolve(Modules.AUTH)
    const {success,authIdentity}=await auth.authenticate("email-otp",{body:{email:input.email,expires:String(expires),proof:otpProof(input.email,expires)}})
    if(!success||!authIdentity)throw new MedusaError(MedusaError.Types.UNAUTHORIZED,"تعذر التحقق من الهوية")
    const customers=container.resolve(Modules.CUSTOMER)
    let [customer]=await customers.listCustomers({email:input.email})
    if(!customer){const created=await createCustomerAccountWorkflow(container).run({input:{authIdentityId:authIdentity.id,customerData:{email:input.email,metadata:{store:"DoCloroo",docloroo_email_verified_at:new Date().toISOString()}}}});customer=created.result}
    else{
      if(authIdentity.app_metadata?.customer_id&&authIdentity.app_metadata.customer_id!==customer.id)throw new MedusaError(MedusaError.Types.NOT_ALLOWED,"Customer identity mismatch")
      // Native module promotion is allowed only after verified OTP, never from an untrusted customer API payload.
      const promotion={has_account:true,metadata:{...customer.metadata,docloroo_email_verified_at:new Date().toISOString()}}
      await customers.updateCustomers(customer.id,promotion)
      await auth.updateAuthIdentities({id:authIdentity.id,app_metadata:{...authIdentity.app_metadata,customer_id:customer.id}})
    }
    const token=generateJwtToken({actor_id:customer.id,actor_type:"customer",auth_identity_id:authIdentity.id,auth_provider:"email-otp",app_metadata:{customer_id:customer.id}}, {secret:process.env.JWT_SECRET!,expiresIn:"1h"})
    return {token}
  },{timeout:10})
  return new StepResponse(result)
})
export const verifyEmailCodeWorkflow=createWorkflow("verify-email-code",(input:{email:string;code:string})=>new WorkflowResponse(verifyStep(input)))
