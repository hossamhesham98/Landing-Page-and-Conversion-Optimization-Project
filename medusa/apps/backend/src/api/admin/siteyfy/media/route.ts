import type {MedusaRequest,MedusaResponse} from "@medusajs/framework/http"
import {getSettings} from "../../../../lib/docloroo"
import type SiteyfyModuleService from "../../../../modules/siteyfy/service"
import {z} from "@medusajs/framework/zod"
import {safeMediaUrl} from "../../../../lib/siteyfy-cms"
import {siteyfyMediaWorkflow} from "../../../../workflows/siteyfy/media"
export async function GET(req:MedusaRequest,res:MedusaResponse){const {store}=await getSettings(req.scope);const [media,count]=await req.scope.resolve<SiteyfyModuleService>("siteyfy").listAndCountMediaRecords({store_id:store.id},{take:100,order:{created_at:"DESC"}});res.json({media,count})}
export async function POST(req:MedusaRequest,res:MedusaResponse){const input=z.object({file_id:z.string().min(1).max(200),url:z.string().max(2000).refine(safeMediaUrl),mime:z.enum(["image/png","image/jpeg","image/webp","video/mp4","video/webm"]),name:z.string().max(200)}).strict().parse(req.body);const {result}=await siteyfyMediaWorkflow(req.scope).run({input});res.json({media:result})}
