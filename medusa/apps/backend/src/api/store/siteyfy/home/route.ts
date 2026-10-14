import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { loadCms } from "../../../../lib/siteyfy-cms"
import { getSettings } from "../../../../lib/docloroo"
import {loadProof} from "../../../../lib/siteyfy-proof"

export async function GET(req:MedusaRequest,res:MedusaResponse) {
  const {cms}=await loadCms(req.scope)
  const proof=await loadProof(req.scope)
  res.setHeader("Cache-Control","public, max-age=0, s-maxage=10")
  res.json({page:cms.published, proof})
}
