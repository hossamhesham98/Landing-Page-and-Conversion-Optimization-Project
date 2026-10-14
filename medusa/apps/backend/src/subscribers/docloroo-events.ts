import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { randomUUID } from "node:crypto"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import {doclorooOrderEmailWorkflow} from "../workflows/docloroo/order-email"
export default async function prepareEvent({ event, container }: SubscriberArgs<{ id: string; status?: string }>) {
 const names: Record<string,string> = { "order.placed":"order_created", "order.canceled":"order_cancelled", "docloroo.order_cancelled":"order_cancelled", "docloroo.order_status_changed":"order_status_changed", "order.shipment_created":"order_status_changed", "order.fulfillment_delivered":"order_status_changed", "customer.created":"customer_registered" }
 if(event.name==="customer.created") {
  const customer=await container.resolve(Modules.CUSTOMER).retrieveCustomer(event.data.id)
  if(!customer.has_account)return
  await container.resolve(Modules.EVENT_BUS).emit({ name:"docloroo.integration_event",data:{ event_id:randomUUID(),type:"customer_registered",customer_id:customer.id,delivery:"disabled",occurred_at:new Date().toISOString() } })
  return
 }
 const { data:[order] }=await container.resolve(ContainerRegistrationKeys.QUERY).graph({entity:"order",fields:["id","metadata","customer_id","email"],filters:{id:event.data.id}})
 if(!order?.metadata?.docloroo)return
 await doclorooOrderEmailWorkflow(container).run({input:{order_id:order.id,update:event.name!=="order.placed"}})
 const dc=order.metadata.docloroo as any
 // Legacy campaign/AI delivery remains disabled. Transactional email above uses the real provider.
 await container.resolve(Modules.EVENT_BUS).emit({ name:"docloroo.integration_event",data:{event_id:randomUUID(),type:names[event.name],order_id:order.id,customer_id:order.customer_id,has_email:!!order.email,status:event.data.status,utm_source:order.metadata.utm_source,utm_campaign:order.metadata.utm_campaign,email_delivery:dc.email_delivery||"not_sent",delivery:"disabled",occurred_at:new Date().toISOString()} })
}
export const config: SubscriberConfig = { event:["order.placed","order.canceled","docloroo.order_status_changed","order.shipment_created","order.fulfillment_delivered","customer.created"] }
