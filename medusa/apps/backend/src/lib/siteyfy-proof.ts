import type {MedusaContainer} from "@medusajs/framework/types"
import {ContainerRegistrationKeys} from "@medusajs/framework/utils"
import type SiteyfyModuleService from "../modules/siteyfy/service"
import {productSales} from "./product-sales"
import {getSettings} from "./docloroo"
export async function loadProof(container:MedusaContainer){
 const {store,settings}=await getSettings(container)
 const approved=await container.resolve<SiteyfyModuleService>("siteyfy").listReviews({store_id:store.id,status:"approved"},{take:100,order:{created_at:"DESC"}})
 const reviews=[...approved.map(r=>({name:r.display_name,stars:r.rating,comment:r.comment,image:r.image||undefined})),...(settings.social_proof?.reviews||[]).filter(r=>r.approved).map(r=>({name:r.display_name,stars:r.rating,comment:r.text,image:undefined}))]
 const {data:products}=await container.resolve(ContainerRegistrationKeys.QUERY).graph({entity:"product",fields:["id","metadata"],filters:{status:"published"},pagination:{take:100}})
 const product=products.find(p=>p.metadata?.brand==="DoCloroo"&&p.metadata?.kind==="coloring_blanket")
 const sales=product?await productSales(container,product.id):null
 const count=sales?.show_sold_count?sales.total:null
 return {sold_count:count!==null&&count>0?count:null,reviews}
}
