import type {MedusaRequest,MedusaResponse} from "@medusajs/framework/http"
import {doclorooCancelWorkflow} from "../../../../../../workflows/docloroo/order-action"
export async function POST(req:MedusaRequest,res:MedusaResponse){
 const {result}=await doclorooCancelWorkflow(req.scope).run({input:{order_id:req.params.id,admin:true}})
 res.json(result)
}
