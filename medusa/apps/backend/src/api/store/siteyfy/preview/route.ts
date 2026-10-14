import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { loadCms } from "../../../../lib/siteyfy-cms"
import { validPreviewToken } from "../../../../lib/siteyfy-preview"
export async function GET(req:MedusaRequest,res:MedusaResponse) {
  if (!validPreviewToken(req.headers["x-siteyfy-preview"] as string || "")) return res.status(403).json({message:"Preview access expired or invalid"})
  const {cms}=await loadCms(req.scope)
  res.setHeader("Cache-Control","no-store")
  res.json({page:cms.draft,proof:{sold_count:null,reviews:[]},preview:true})
}
