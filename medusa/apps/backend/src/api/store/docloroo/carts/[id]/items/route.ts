import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { z } from "@medusajs/framework/zod"
import { addToCartWorkflow } from "@medusajs/medusa/core-flows"
import { doclorooSyncTierWorkflow } from "../../../../../../workflows/docloroo/sync-tier"
const schema=z.object({items:z.array(z.object({variant_id:z.string(),quantity:z.number().int().min(1).max(99)}).strict()).min(1).max(20)}).strict()
export async function POST(req:MedusaRequest,res:MedusaResponse){
  const {items}=schema.parse(req.body)
  await addToCartWorkflow(req.scope).run({input:{cart_id:req.params.id,items}})
  await doclorooSyncTierWorkflow(req.scope).run({input:{cart_id:req.params.id}})
  res.json({updated:true})
}
