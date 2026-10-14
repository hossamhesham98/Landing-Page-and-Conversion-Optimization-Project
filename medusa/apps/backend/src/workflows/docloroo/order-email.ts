import {createStep,createWorkflow,StepResponse,WorkflowResponse} from "@medusajs/framework/workflows-sdk"
import {Modules,ContainerRegistrationKeys,NotificationStatus,MedusaError} from "@medusajs/framework/utils"
import {retrieveOrder,trackingToken,orderStatus,statusLabels} from "../../lib/docloroo"

const deliverOrderEmail=createStep("deliver-order-email",async(input:{order_id:string;update?:boolean},{container})=>{
  const result=await container.resolve(Modules.LOCKING).execute(input.order_id,async()=>{
    const order=await retrieveOrder(container,input.order_id)
    if(!order.metadata?.docloroo)return {sent:false}
    const dc=order.metadata.docloroo as Record<string,any>,notifications=container.resolve(Modules.NOTIFICATION)
    const current=orderStatus(order),template=input.update?"docloroo-order-update":"docloroo-order-confirmation",key=`${template}:${order.id}:${input.update?current:"created"}`
    const {data:[recipient]}=await container.resolve(ContainerRegistrationKeys.QUERY).graph({entity:"order",fields:["id","email"],filters:{id:order.id}})
    if(!recipient?.email)return {sent:false}
    const existing=await notifications.listNotifications({resource_id:order.id},{take:100})
    const accepted=existing.some(n=>n.template===template&&n.status===NotificationStatus.SUCCESS&&(!input.update||n.data?.status===current))
    // Medusa 2.21.2 generates a fresh notification ID when retrying an existing
    // FAILURE key, then tries to update that absent ID. Keep failed attempts
    // intact and use a unique native key per bounded logical delivery attempt.
    const attempts=existing.filter(n=>n.template===template&&(!input.update||n.data?.status===current)).length
    if(!accepted&&attempts>=5)return {sent:false}
    const base=process.env.DOCLOROO_PUBLIC_URL
    if(!base||!/^https:\/\//.test(base)&&!/^http:\/\/(127\.0\.0\.1|localhost):3000$/.test(base))throw new MedusaError(MedusaError.Types.INVALID_DATA,"Trusted storefront URL required for order emails")
    let sent=accepted
    if(!accepted){
      try{
        const notification=await notifications.createNotifications({to:recipient.email,channel:"email",template,resource_id:order.id,resource_type:"order",receiver_id:order.customer_id,trigger_type:input.update?"docloroo.order_status_changed":"order.placed",idempotency_key:attempts?`${key}:attempt:${attempts+1}`:key,
          data:{display_id:order.display_id,status:current,status_label:statusLabels[current],tracking_url:`${base}/order/track/${order.id}.${trackingToken(order)}`}})
        sent=notification?.status===NotificationStatus.SUCCESS
      }catch{
        // Native Notification persists FAILURE even when SMTP rejects. Persist
        // the bounded retry state too; never report delivery acceptance here.
        sent=false
      }
    }
    const latest=await retrieveOrder(container,order.id),latestDc=latest.metadata?.docloroo as Record<string,any>
    const attempt={delivery:sent?"accepted":"failed",at:new Date().toISOString(),attempts:Number(input.update?dc.email_updates?.[current]?.attempts||0:dc.email_attempts||0)+(accepted?0:1)}
    await container.resolve(Modules.ORDER).updateOrders(order.id,{metadata:{...latest.metadata,docloroo:{...latestDc,...(input.update?{email_updates:{...latestDc.email_updates,[current]:attempt}}:{email_delivery:attempt.delivery,email_last_attempt_at:attempt.at,email_attempts:attempt.attempts})}}})
    return {sent}
  },{timeout:30})
  return new StepResponse(result)
})
export const doclorooOrderEmailWorkflow=createWorkflow("docloroo-order-email",(input:{order_id:string;update?:boolean})=>new WorkflowResponse(deliverOrderEmail(input)))
