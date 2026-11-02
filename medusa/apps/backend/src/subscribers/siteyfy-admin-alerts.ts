import type {SubscriberArgs,SubscriberConfig} from "@medusajs/framework"
import {siteyfyAdminAlertsWorkflow} from "../workflows/siteyfy/admin-alerts"
import {fingerprint} from "../lib/siteyfy-alert-policy"
export default async function adminAlerts({event,container}:SubscriberArgs<{id?:string;order_id?:string}>) {
  const orderEvent=event.name.startsWith("order.")||event.name.startsWith("docloroo.")
  const labels:Record<string,string>={"order.return_requested":"طلب إرجاع","order.return_received":"استلام إرجاع","order.claim_created":"إنشاء مطالبة","order.exchange_created":"إنشاء استبدال","order.transfer_requested":"طلب نقل ملكية الطلب"}
  const signal=labels[event.name]?{key:fingerprint([event.name,event.data]),label:labels[event.name]}:undefined
  await siteyfyAdminAlertsWorkflow(container).run({input:{...(orderEvent?{order_id:event.data.order_id||event.data.id}:{}),event:event.name,signal}})
}
export const config:SubscriberConfig={event:["order.placed","order.updated","order.canceled","order.completed","order.archived","order.fulfillment_created","order.fulfillment_canceled","order.return_requested","order.return_received","order.claim_created","order.exchange_created","order.transfer_requested","docloroo.order_cancelled","docloroo.order_status_changed","docloroo.cancellation_requested","shipment.created","delivery.created","payment.captured","payment.refunded","inventory-level.created","inventory-level.updated","inventory-level.deleted","inventory.reservation-item.created","inventory.reservation-item.updated","inventory.reservation-item.deleted","inventory.inventory-level.created","inventory.inventory-level.updated","inventory.inventory-level.deleted"]}
