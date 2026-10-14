import type {MedusaRequest,MedusaResponse} from "@medusajs/framework/http"
import {z} from "@medusajs/framework/zod"
import {safeMediaUrl} from "../../../../lib/siteyfy-cms"
import {siteyfyAddDesignWorkflow} from "../../../../workflows/siteyfy/add-design"
export async function POST(req:MedusaRequest,res:MedusaResponse){const input=z.object({product_id:z.string(),title:z.string().trim().min(2).max(100),sku:z.string().trim().min(1).max(100),image:z.string().max(2000).refine(safeMediaUrl),price:z.number().positive().max(1000000)}).strict().parse(req.body);const {result}=await siteyfyAddDesignWorkflow(req.scope).run({input});res.status(201).json({variant:result})}
