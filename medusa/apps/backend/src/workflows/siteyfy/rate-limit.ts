import {createHmac} from "node:crypto"
import {createStep,createWorkflow,StepResponse,WorkflowResponse} from "@medusajs/framework/workflows-sdk"
import {MedusaError,Modules} from "@medusajs/framework/utils"
const rateLimit=createStep("rate-limit",async(input:{ip:string;scope:"review"|"review-image"},{container})=>{
 const key=createHmac("sha256",process.env.DOCLOROO_TRACKING_SECRET!).update(`${input.scope}:${input.ip}`).digest("hex"),cache=container.resolve(Modules.CACHE)
 await container.resolve(Modules.LOCKING).execute(key,async()=>{const count=await cache.get<number>(key)||0;if(count>=10)throw new MedusaError(MedusaError.Types.NOT_ALLOWED,"انتظر قبل إرسال طلب آخر");await cache.set(key,count+1,3600)})
 return new StepResponse()
})
export const siteyfyRateLimitWorkflow=createWorkflow("siteyfy-rate-limit",(input:{ip:string;scope:"review"|"review-image"})=>new WorkflowResponse(rateLimit(input)))
