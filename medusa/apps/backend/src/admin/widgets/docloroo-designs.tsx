import { defineWidgetConfig } from "@medusajs/admin-sdk"
import type { DetailWidgetProps, AdminProduct } from "@medusajs/framework/types"
import { Container, Heading, Text, Button } from "@medusajs/ui"
import { useState } from "react"
import { sdk } from "../lib/sdk"
const Widget = ({ data }: DetailWidgetProps<AdminProduct>) => {
 const [message,setMessage]=useState(""),[busy,setBusy]=useState(false)
 const [active,setActive]=useState<Record<string,boolean>>({})
 async function toggle(variant:any){setBusy(true);const next=!(active[variant.id]??variant.metadata?.active!==false);try{await sdk.client.fetch(`/admin/products/${data.id}/variants/${variant.id}`,{method:"POST",body:{metadata:{...variant.metadata,active:next}}});setActive({...active,[variant.id]:next});setMessage("تم حفظ حالة التصميم")}catch(error){setMessage((error as Error).message)}finally{setBusy(false)}}
 if(data.metadata?.brand!=="DoCloroo")return null
 return <Container dir="rtl" className="p-6"><Heading level="h2">تصميمات DoCloroo</Heading><Text>كل تصميم Variant له SKU ومخزون وسعر مستقل. اربط الصور بالتصميم من Medusa، وأضف المخزون الحقيقي ثم انشر المنتج.</Text>{data.variants?.map(v=><div className="my-3 flex items-center gap-3" key={v.id}><Text>{v.title}</Text><Button disabled={busy} onClick={()=>toggle(v)}>{(active[v.id]??v.metadata?.active!==false)?"إيقاف التصميم":"تفعيل التصميم"}</Button></div>)}<Text>{message}</Text></Container>
}
export const config = defineWidgetConfig({ zone: "product.details.after" })
export default Widget
