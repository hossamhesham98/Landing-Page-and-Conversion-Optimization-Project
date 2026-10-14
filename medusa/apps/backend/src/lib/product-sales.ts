import type {MedusaContainer} from "@medusajs/framework/types"
import {ContainerRegistrationKeys,Modules} from "@medusajs/framework/utils"
export type ProductSales={historical_quantity:number;show_sold_count:boolean;through_date:string;source_reference:string;updated_at?:string;updated_by?:string}
export async function productSales(container:MedusaContainer,id:string,previewCutoff?:string){
 const product=await container.resolve(Modules.PRODUCT).retrieveProduct(id)
 const saved=product.metadata?.siteyfy_sales as ProductSales|undefined
 const cutoff=previewCutoff||saved?.through_date
 let eligible=0,skip=0
 do{
  const {data}=await container.resolve(ContainerRegistrationKeys.QUERY).graph({entity:"order",fields:["id","status","metadata","items.product_id","items.quantity","items.detail.delivered_quantity","items.detail.return_received_quantity"],filters:cutoff?{created_at:{$gt:new Date(cutoff)}}:{},pagination:{skip,take:100}})
  for(const order of data){if(order.status==="canceled"||!order.metadata?.docloroo||(order.metadata.docloroo as any).development_test)continue;for(const item of order.items||[])if(item?.product_id===id)eligible+=Math.max(0,Math.min(Number(item.quantity),Number(item.detail?.delivered_quantity||0))-Number(item.detail?.return_received_quantity||0))}
  if(data.length<100)break
  skip+=100
 }while(true)
 return {configuration:saved||null,historical_quantity:saved?.historical_quantity??null,eligible_units:eligible,total:saved? saved.historical_quantity+eligible:null,show_sold_count:saved?.show_sold_count===true,eligibility:"Delivered units minus received returns; test and canceled orders excluded. Only orders after the historical cutoff count."}
}
