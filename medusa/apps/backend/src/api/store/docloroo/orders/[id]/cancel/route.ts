import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { z } from "@medusajs/framework/zod"
import { doclorooCancelWorkflow } from "../../../../../../workflows/docloroo/order-action"
import {retrieveOrder,publicOrder} from "../../../../../../lib/docloroo"
export async function POST(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const { token } = z.object({ token: z.string().max(64).optional() }).parse(req.body)
  const { result } = await doclorooCancelWorkflow(req.scope).run({ input: { order_id: req.params.id, token, customer_id: req.auth_context?.actor_id } })
  res.setHeader("Cache-Control","no-store")
  res.json({ order:publicOrder(await retrieveOrder(req.scope,req.params.id)),review: result.review, message: result.review ? "تم تسجيل طلب الإلغاء للمراجعة التشغيلية. لا يعني ذلك إيقاف الشحنة تلقائيًا." : "تم إلغاء الطلب." })
}
