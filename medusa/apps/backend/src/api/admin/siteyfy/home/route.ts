import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { z } from "@medusajs/framework/zod"
import { siteyfySaveHomeWorkflow } from "../../../../workflows/siteyfy/save-home"
import { homeSchema, loadCms } from "../../../../lib/siteyfy-cms"

export async function GET(req:MedusaRequest,res:MedusaResponse) {
  const { cms } = await loadCms(req.scope)
  res.setHeader("Cache-Control","no-store")
  res.json({cms})
}
const bodySchema=z.discriminatedUnion("action",[
  z.object({action:z.literal("save"),draft:homeSchema, revision:z.number().int().positive()}),
  z.object({action:z.literal("publish"),revision:z.number().int().positive()}),
  z.object({action:z.literal("rollback"),revision:z.number().int().positive()}),
])
export async function POST(req:MedusaRequest,res:MedusaResponse) {
  const data=bodySchema.parse(req.body)
  const {result:next}=await siteyfySaveHomeWorkflow(req.scope).run({input:data})
  res.setHeader("Cache-Control","no-store")
  res.json({cms:next})
}
