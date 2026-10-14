import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { doclorooSyncTierWorkflow } from "../../../../../../workflows/docloroo/sync-tier"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  await doclorooSyncTierWorkflow(req.scope).run({ input: { cart_id: req.params.id } })
  const { data: [cart] } = await req.scope.resolve(ContainerRegistrationKeys.QUERY).graph({ entity: "cart", fields: ["*", "items.*", "items.variant.*", "items.product.*", "items.adjustments.*", "promotions.*"], filters: { id: req.params.id } })
  res.json({ cart })
}
