import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { z } from "@medusajs/framework/zod"
import { authorizeOrder } from "../../../../../../workflows/docloroo/order-action"
import { publicOrder } from "../../../../../../lib/docloroo"
export async function POST(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const { token } = z.object({ token: z.string().max(64).optional() }).parse(req.body)
  const order = await authorizeOrder({ order_id: req.params.id, token, customer_id: req.auth_context?.actor_id }, req.scope)
  res.json({ order: publicOrder(order) })
}
