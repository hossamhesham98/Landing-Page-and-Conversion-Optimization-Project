import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { z } from "@medusajs/framework/zod"
import { getSettings } from "../../../../lib/docloroo"
import { doclorooSettingsWorkflow } from "../../../../workflows/docloroo/save-settings"
const schema = z.object({
 tiers: z.array(z.object({ min: z.number().int().min(2), max: z.number().int().min(2).nullable(), code: z.string().min(1).max(100) })).max(10).superRefine((tiers, ctx) => {
  for (let i=0;i<tiers.length;i++) {
   const a=tiers[i]
   if (a.max !== null && a.max < a.min) ctx.addIssue({ code: "custom", message: "Invalid range" })
   for (let j=0;j<i;j++) { const b=tiers[j]; if (a.min <= (b.max ?? Infinity) && b.min <= (a.max ?? Infinity)) ctx.addIssue({ code: "custom", message: "Tier ranges overlap" }) }
  }
 }),
 social_proof: z.object({ sold_count: z.number().int().positive().nullable(), reviews: z.array(z.object({ display_name: z.string().min(1).max(100), text: z.string().min(1).max(2000), rating: z.number().int().min(1).max(5), date: z.iso.date(), design: z.string().max(100).optional(), source_reference: z.string().min(1).max(300), approved: z.boolean() })).max(100) }),
 shipping: z.object({ confirmed: z.boolean(), regions: z.array(z.object({ name: z.string().min(1).max(150), cost: z.number().nonnegative().nullable(), duration: z.string().max(200).nullable() })).max(100) }),
})
export async function GET(req: MedusaRequest,res: MedusaResponse) { const { settings } = await getSettings(req.scope);res.json({ settings }) }
export async function POST(req: MedusaRequest,res: MedusaResponse) { await doclorooSettingsWorkflow(req.scope).run({ input: schema.parse(req.body) });res.json({ saved: true }) }
