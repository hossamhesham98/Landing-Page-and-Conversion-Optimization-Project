import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { orderFields, publicOrder } from "../../../../../../lib/docloroo"
export async function GET(req: AuthenticatedMedusaRequest,res: MedusaResponse) {
 const { data } = await req.scope.resolve(ContainerRegistrationKeys.QUERY).graph({ entity: "order", fields: orderFields, filters: { customer_id: req.auth_context.actor_id }, pagination: { take: 50, order: { created_at: "DESC" } } })
 res.setHeader("Cache-Control","no-store")
 res.json({ orders: data.filter(o=>o.metadata?.docloroo).map(publicOrder) })
}
