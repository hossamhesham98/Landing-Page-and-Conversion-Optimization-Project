import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { z } from "@medusajs/framework/zod"
import {doclorooNativeCodWorkflow} from "../../../../../../workflows/docloroo/cod-native"
import {publicOrder,retrieveOrder,trackingToken} from "../../../../../../lib/docloroo"
import {checkoutVerified} from "../../../../../../lib/docloroo-launch"
import {normalizeEgyptPhone} from "../../../../../../lib/egypt-phone"
// This gate remains closed until real stock approval and positive integration QA.
const schema = z.object({
  name: z.string().trim().min(2).max(100),
  phone: z.string().transform(x=>normalizeEgyptPhone(x)||"").refine(x=>!!x,"رقم الموبايل غير صالح؛ استخدم 010 أو 011 أو 012 أو 015"),
  region: z.string().trim().min(1).max(150),
  address: z.string().trim().min(8).max(1000).optional(),
  delivery:z.object({area:z.string().trim().min(1).max(150),street:z.string().trim().min(1).max(200),building:z.string().trim().min(1).max(50),floor:z.string().trim().max(50).optional(),apartment:z.string().trim().max(50).optional(),landmark:z.string().trim().max(300).optional()}).strict().optional(),
  email: z.email().max(254).transform(x=>x.trim().toLowerCase()),
  notes:z.string().trim().max(1000).optional(),
}).strict().refine(x=>!!x.delivery||!!x.address,"عنوان التوصيل مطلوب")
export async function POST(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const input=schema.parse(req.body)
  if(!checkoutVerified())return res.status(503).json({
    code: "DOCLOROO_CHECKOUT_NOT_LIVE",
    message: "الشراء مغلق لحين اعتماد التصميمات والمخزون واجتياز اختبار COD الحقيقي. لم يتم إنشاء طلب.",
  })
  const {result}=await doclorooNativeCodWorkflow(req.scope).run({input:{...input,cart_id:req.params.id,customer_id:req.auth_context?.actor_id}})
  const order=await retrieveOrder(req.scope,result.id)
  res.setHeader("Cache-Control","no-store")
  res.json({order:publicOrder(order),tracking_token:trackingToken(order)})
}
