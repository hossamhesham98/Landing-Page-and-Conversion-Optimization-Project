import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { createPreviewToken } from "../../../../lib/siteyfy-preview"
export async function POST(req:MedusaRequest,res:MedusaResponse) {
  res.setHeader("Cache-Control","no-store")
  res.json({token:createPreviewToken(),expires_in:600})
}
