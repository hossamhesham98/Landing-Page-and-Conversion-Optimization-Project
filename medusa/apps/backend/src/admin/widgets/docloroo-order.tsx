import { defineWidgetConfig } from "@medusajs/admin-sdk"
import type { DetailWidgetProps, AdminOrder } from "@medusajs/framework/types"
import { Container, Heading, Text, Button } from "@medusajs/ui"
import { useState } from "react"
import { sdk } from "../lib/sdk"
const Widget = ({ data }: DetailWidgetProps<AdminOrder>) => {
 const dc=(data.metadata?.docloroo||{}) as any
 const [status,setStatus]=useState(dc.status||"new"),[message,setMessage]=useState(""),[busy,setBusy]=useState(false)
 async function save(){setBusy(true);try{await sdk.client.fetch(`/admin/docloroo/orders/${data.id}/status`,{method:"POST",body:{status}});setMessage("تم تسجيل الحالة والإجراء")}catch(error){setMessage((error as Error).message)}finally{setBusy(false)}}
 if(!data.metadata?.docloroo)return null
 return <Container dir="rtl" className="p-6"><Heading level="h2">متابعة DoCloroo</Heading><Text>مصدر الطلب: {String(data.metadata.utm_source||"direct")} · الحملة: {String(data.metadata.utm_campaign||"—")}</Text><Text>الدفع عند الاستلام. تكلفة الشحن غير مؤكدة ما لم تُضف للطلب بعد مراجعتها.</Text><select value={status} onChange={e=>setStatus(e.target.value)} className="my-3"><option value="new">جديد</option><option value="confirming">تحت التأكيد</option><option value="confirmed">مؤكد</option></select><Button disabled={busy} onClick={save}>تحديث حالة التأكيد</Button><Text>الشحن والتسليم والإلغاء النهائي تُدار بإجراءات Medusa الأساسية.</Text>{dc.cancellation_requested_at&&<Text>طلب إلغاء مسجل: {dc.cancellation_requested_at}</Text>}<Text>{message}</Text><ul>{(dc.audit||[]).map((entry:any,index:number)=><li key={index}>{entry.action} · {entry.at}</li>)}</ul></Container>
}
export const config = defineWidgetConfig({ zone: "order.details.after" })
export default Widget
