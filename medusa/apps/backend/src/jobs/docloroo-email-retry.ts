import type {MedusaContainer} from "@medusajs/framework/types"
import {ContainerRegistrationKeys} from "@medusajs/framework/utils"
import {doclorooOrderEmailWorkflow} from "../workflows/docloroo/order-email"
import {orderStatus} from "../lib/docloroo"
export default async function retryOrderEmails(container:MedusaContainer){
 let skip=0
 do{
  const {data:orders}=await container.resolve(ContainerRegistrationKeys.QUERY).graph({entity:"order",fields:["id","status","metadata","fulfillments.*"],pagination:{take:100,skip}})
  for(const order of orders){
    const dc=order.metadata?.docloroo as Record<string,any>|undefined
    if(!dc)continue
    const delay=Math.min(3600000,60000*2**Number(dc.email_attempts||0))
    if(dc.email_delivery!=="accepted"&&Number(dc.email_attempts||0)<5&&Date.now()-Date.parse(dc.email_last_attempt_at||"1970-01-01")>=delay)
      await doclorooOrderEmailWorkflow(container).run({input:{order_id:order.id}})
    const status=orderStatus(order),update=dc.email_updates?.[status]
    if(status!=="new"&&update?.delivery!=="accepted"&&Number(update?.attempts||0)<5&&Date.now()-Date.parse(update?.at||"1970-01-01")>=60000*2**Number(update?.attempts||0))
      await doclorooOrderEmailWorkflow(container).run({input:{order_id:order.id,update:true}})
  }
  if(orders.length<100)break
  skip+=100
 }while(true)
}
export const config={name:"docloroo-email-retry",schedule:"* * * * *"}
