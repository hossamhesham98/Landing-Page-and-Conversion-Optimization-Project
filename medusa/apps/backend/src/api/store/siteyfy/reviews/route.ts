import type {MedusaRequest,MedusaResponse} from "@medusajs/framework/http"
import {z} from "@medusajs/framework/zod"
import {siteyfyRateLimitWorkflow} from "../../../../workflows/siteyfy/rate-limit"

import {siteyfyReviewWorkflow} from "../../../../workflows/siteyfy/review"
import {safeMediaUrl} from "../../../../lib/siteyfy-cms"
const schema=z.object({display_name:z.string().trim().min(2).max(70),rating:z.number().int().min(1).max(5),comment:z.string().trim().min(5).max(1500),image:z.string().max(2000).refine(safeMediaUrl).optional()}).strict()
export async function POST(req:MedusaRequest,res:MedusaResponse){
  const input=schema.parse(req.body)
  await siteyfyRateLimitWorkflow(req.scope).run({input:{ip:req.ip||"unknown",scope:"review"}})
  const {result}=await siteyfyReviewWorkflow(req.scope).run({input})
  res.status(201).json({id:result.id,status:result.status})
}
