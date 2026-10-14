import type {MedusaRequest,MedusaResponse} from "@medusajs/framework/http"
import {doclorooPrepareShippingWorkflow} from "../../../../../../workflows/docloroo/prepare-shipping"
export async function POST(req:MedusaRequest,res:MedusaResponse){
  await doclorooPrepareShippingWorkflow(req.scope).run({input:{cart_id:req.params.id}})
  res.setHeader("Cache-Control","no-store")
  res.json({prepared:true})
}
