import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { z } from "@medusajs/framework/zod"
import { doclorooOrderStatusWorkflow } from "../../../../../../workflows/docloroo/order-action"
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const { status } = z.object({ status: z.enum(["new", "confirming", "confirmed"]) }).parse(req.body)
  await doclorooOrderStatusWorkflow(req.scope).run({ input: { order_id: req.params.id, admin: true, status } })
  res.json({ updated: true })
}
