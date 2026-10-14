import type {MedusaRequest,MedusaResponse} from "@medusajs/framework/http"
import {z} from "@medusajs/framework/zod"
import {ContainerRegistrationKeys} from "@medusajs/framework/utils"
import {getSettings} from "../../../../lib/docloroo"
import {developmentTestEnabled,checkoutVerified} from "../../../../lib/docloroo-launch"
import {siteyfySaveBaselineWorkflow} from "../../../../workflows/siteyfy/save-baseline"
export async function GET(req:MedusaRequest,res:MedusaResponse){
 const {store,settings}=await getSettings(req.scope),query=req.scope.resolve(ContainerRegistrationKeys.QUERY)
 let offset=0,testOrders=0,realOrders=0,total=0,newOrders=0
 do{
  const {data}=await query.graph({entity:"order",fields:["id","status","total","metadata"],pagination:{skip:offset,take:100}})
  for(const order of data){if(!order.metadata?.docloroo)continue;const dc=order.metadata.docloroo as any;if(dc.development_test){testOrders++;continue}realOrders++;if(order.status!=="canceled")total+=Number(order.total||0);if(order.status==="pending"&&(!dc.status||dc.status==="new"))newOrders++}
  if(data.length<100)break
  offset+=100
 }while(true)
 const {data:products}=await query.graph({entity:"product",fields:["id","metadata","variants.id","variants.title","variants.inventory_items.inventory_item_id","variants.inventory_items.inventory.location_levels.*"],pagination:{take:100}})
 const inventory=products.filter(p=>p.metadata?.brand==="DoCloroo").flatMap(p=>(p.variants||[]).filter(Boolean).map(v=>({id:v!.id,title:v!.title,levels:(v!.inventory_items||[]).filter(Boolean).flatMap(i=>i!.inventory?.location_levels||[])})))
 res.json({store:{id:store.id,name:store.name},settings,baseline:store.metadata?.siteyfy_sales_baseline||null,metrics:{real_orders:realOrders,test_orders:testOrders,non_cancelled_order_value:total,new_orders:newOrders,inventory},environment:{development_test:developmentTestEnabled(),checkout_verified:checkoutVerified(),production_approved:process.env.DOCLOROO_PRODUCTION_LAUNCH_APPROVED==="true",mail_configured:process.env.DOCLOROO_MAIL_ENABLED==="true"&&!!process.env.SMTP_HOST&&!!process.env.SMTP_FROM,mail_sink:process.env.DOCLOROO_MAIL_SINK==="true",payment:"Cash on delivery"}})
}
export async function POST(req:MedusaRequest,res:MedusaResponse){
 const input=z.object({count:z.number().int().nonnegative(),through_date:z.iso.datetime({offset:true}).refine(x=>Date.parse(x)<=Date.now(),"Cutoff must not be in the future"),source_reference:z.string().trim().min(3).max(300)}).strict().parse(req.body)
 const {result}=await siteyfySaveBaselineWorkflow(req.scope).run({input})
 res.json(result)
}
