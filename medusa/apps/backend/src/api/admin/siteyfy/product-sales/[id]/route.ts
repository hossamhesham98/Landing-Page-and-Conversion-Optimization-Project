import type {AuthenticatedMedusaRequest,MedusaResponse} from "@medusajs/framework/http"
import {z} from "@medusajs/framework/zod"
import {productSales} from "../../../../../lib/product-sales"
import {saveProductSalesWorkflow} from "../../../../../workflows/siteyfy/save-product-sales"
export async function GET(req:AuthenticatedMedusaRequest,res:MedusaResponse){const query=z.object({through_date:z.iso.datetime({offset:true}).refine(x=>Date.parse(x)<=Date.now(),"Cutoff must not be in the future").optional()}).strict().parse(req.query);res.setHeader("Cache-Control","no-store");res.json(await productSales(req.scope,req.params.id,query.through_date))}
export async function POST(req:AuthenticatedMedusaRequest,res:MedusaResponse){
 const input=z.object({historical_quantity:z.number().int().min(0).max(1000000000),show_sold_count:z.boolean(),through_date:z.iso.datetime({offset:true}).refine(x=>Date.parse(x)<=Date.now(),"Cutoff must not be in the future"),source_reference:z.string().trim().min(3).max(300)}).strict().parse(req.body)
 await saveProductSalesWorkflow(req.scope).run({input:{...input,product_id:req.params.id,updated_by:req.auth_context.actor_id}})
 res.json(await productSales(req.scope,req.params.id))
}
