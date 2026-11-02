import {createHash} from "node:crypto"

export type AlertSettings = {enabled:boolean;recipient:string;low_stock_threshold:number;activated_at:string}
export function alertSettings(value:any, now=new Date().toISOString()):AlertSettings {
  return {enabled:value?.enabled!==false,recipient:value?.recipient||"hossamhesham98@gmail.com",low_stock_threshold:Number.isInteger(value?.low_stock_threshold)?value.low_stock_threshold:5,activated_at:value?.activated_at||now}
}
export function fingerprint(value:unknown) {return createHash("sha256").update(JSON.stringify(value)).digest("hex")}
export function unseenSignal(seen:string[],signal?:{key:string;label:string}) {return signal&&!seen.includes(signal.key)?signal:undefined}
export function stockState(available:number,threshold:number) {return available<=0?"out":available<=threshold?"low":"healthy"}
export function stockAlert(previous:any,current:{available:number;state:string}) {
  if(!previous)return current.state!=="healthy"
  if(current.state!==previous.state)return true
  return current.state!=="healthy"&&current.available<previous.available
}
export function orderSnapshot(order:any,status:string) {
  const dc=order.metadata?.docloroo||{}
  return {status:order.status,stage:status,cancellation_requested_at:dc.cancellation_requested_at||null,
    audit:(dc.audit||[]).filter((x:any)=>["status_changed","cancellation_requested","cancellation_requested_before_shipping"].includes(x.action)),
    email:order.email,address:order.shipping_address,items:(order.items||[]).map((x:any)=>({id:x.id,title:x.title,quantity:Number(x.quantity),price:Number(x.unit_price),total:Number(x.total)})).sort((a:any,b:any)=>a.id.localeCompare(b.id)),
    total:Number(order.total),discount:Number(order.item_discount_total),shipping:Number(order.shipping_total),
    fulfillments:(order.fulfillments||[]).map((x:any)=>({id:x.id,canceled:x.canceled_at,shipped:x.shipped_at,delivered:x.delivered_at})).sort((a:any,b:any)=>a.id.localeCompare(b.id)),
    payments:(order.payment_collections||[]).map((x:any)=>({id:x.id,status:x.status,amount:Number(x.amount),captured:Number(x.captured_amount),refunded:Number(x.refunded_amount)})).sort((a:any,b:any)=>a.id.localeCompare(b.id)),
    returns:(order.returns||[]).map((x:any)=>({id:x.id,status:x.status,received:x.received_at,canceled:x.canceled_at})).sort((a:any,b:any)=>a.id.localeCompare(b.id))}
}
