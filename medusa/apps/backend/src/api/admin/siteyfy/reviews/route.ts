import type {AuthenticatedMedusaRequest,MedusaResponse} from "@medusajs/framework/http"
import {z} from "@medusajs/framework/zod"
import {getSettings} from "../../../../lib/docloroo"
import type SiteyfyModuleService from "../../../../modules/siteyfy/service"
import {siteyfyReviewWorkflow} from "../../../../workflows/siteyfy/review"
export async function GET(req:AuthenticatedMedusaRequest,res:MedusaResponse){const {store}=await getSettings(req.scope);const status=z.enum(["pending","approved","rejected"]).optional().parse(req.query.status);const [reviews,count]=await req.scope.resolve<SiteyfyModuleService>("siteyfy").listAndCountReviews({store_id:store.id,...(status?{status}:{})},{take:100,order:{created_at:"DESC"}});res.json({reviews,count})}
export async function POST(req:AuthenticatedMedusaRequest,res:MedusaResponse){const body=z.object({id:z.string(),status:z.enum(["approved","rejected"])}).strict().parse(req.body);const {result}=await siteyfyReviewWorkflow(req.scope).run({input:{...body,actor_id:req.auth_context.actor_id,display_name:"",rating:1,comment:""}});res.json({review:result})}
