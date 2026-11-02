import type {MedusaRequest,MedusaResponse} from "@medusajs/framework/http"
import {z} from "@medusajs/framework/zod"
import {Modules} from "@medusajs/framework/utils"
import {getSettings} from "../../../../lib/docloroo"
import {alertSettings} from "../../../../lib/siteyfy-alert-policy"
import {siteyfyAdminAlertsWorkflow} from "../../../../workflows/siteyfy/admin-alerts"
export async function GET(req:MedusaRequest,res:MedusaResponse) {
  const {store}=await getSettings(req.scope)
  const notifications=await req.scope.resolve(Modules.NOTIFICATION).listNotifications({template:["docloroo-admin-order","docloroo-admin-stock"]},{take:20,order:{created_at:"DESC"}})
  res.json({settings:alertSettings(store.metadata?.siteyfy_admin_notifications),stock:store.metadata?.siteyfy_admin_stock||{},notifications:notifications.map(x=>({id:x.id,to:x.to,template:x.template,status:x.status,created_at:x.created_at,label:x.data?.label,display_id:x.data?.display_id,resource_id:x.resource_id}))})
}
export async function POST(req:MedusaRequest,res:MedusaResponse) {
  const input=z.object({enabled:z.boolean(),recipient:z.email().max(254),low_stock_threshold:z.number().int().min(0).max(10000)}).strict().parse(req.body)
  const {result}=await siteyfyAdminAlertsWorkflow(req.scope).run({input:{settings:input}})
  res.json(result)
}
