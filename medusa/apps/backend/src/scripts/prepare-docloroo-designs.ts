import type {ExecArgs} from "@medusajs/framework/types"
import {ContainerRegistrationKeys,MedusaError,Modules} from "@medusajs/framework/utils"
import {updateProductsWorkflow,updateProductOptionsWorkflow,setProductProductOptionsWorkflow,createProductVariantsWorkflow,updateProductVariantsWorkflow} from "@medusajs/medusa/core-flows"
const designs=[{key:"fun",title:"عالم المرح",image:"fun-doodles.webp"},{key:"garden",title:"حديقة الأحلام",image:"dream-garden.webp"},{key:"space",title:"مغامرة الفضاء",image:"space-adventure.webp"}]
export default async function prepareDesigns({container}:ExecArgs){
  const products=container.resolve(Modules.PRODUCT),[product]=await products.listProducts({handle:"docloroo-coloring-blanket"},{relations:["variants","options","options.values"]})
  if(!product||product.status!=="draft"||product.metadata?.brand!=="DoCloroo")throw new MedusaError(MedusaError.Types.NOT_ALLOWED,"Only the existing Draft DoCloroo blanket may be prepared")
  const option=product.options.find(x=>x.title==="التصميم")
  if(!option)throw new MedusaError(MedusaError.Types.INVALID_DATA,"Expected design option was not found")
  let globalOption=await products.retrieveProductOption(option.id,{relations:["values"]})
  const values=Array.from(new Set([...globalOption.values.map(x=>x.value),...designs.map(x=>x.title)]))
  if(values.length!==globalOption.values.length){await updateProductOptionsWorkflow(container).run({input:{selector:{id:option.id},update:{values}}});globalOption=await products.retrieveProductOption(option.id,{relations:["values"]})}
  const assigned=new Set(option.values.map(x=>x.id)),add=globalOption.values.filter(x=>!assigned.has(x.id)).map(x=>x.id)
  if(add.length)await setProductProductOptionsWorkflow(container).run({input:{product_id:product.id,update:[{product_option_id:option.id,add}]}})
  for(const design of designs){
    const existing=product.variants.find(v=>v.metadata?.design_key===design.key||v.sku===`DOCLOROO-${design.key.toUpperCase()}-130-150`)
    if(existing)continue
    const legacy=design.key==="fun"?product.variants.find(v=>v.sku==="DOCLOROO-GRAFFITI-130-150"):undefined
    const data={title:design.title,sku:`DOCLOROO-${design.key.toUpperCase()}-130-150`,manage_inventory:true,allow_backorder:false,
      thumbnail:`${process.env.DOCLOROO_PUBLIC_URL}/assets/${design.image}`,options:{"التصميم":design.title},prices:[{currency_code:"egp",amount:899}],
      metadata:{...legacy?.metadata,active:true,design_key:design.key,image:`${process.env.DOCLOROO_PUBLIC_URL}/assets/${design.image}`,image_approval_pending:true}}
    if(legacy)await updateProductVariantsWorkflow(container).run({input:{product_variants:[{id:legacy.id,...data}]}})
    else await createProductVariantsWorkflow(container).run({input:{product_variants:[{product_id:product.id,...data}]}})
  }
  await updateProductsWorkflow(container).run({input:{products:[{id:product.id,status:"draft",metadata:{...product.metadata,inventory_pending:true,design_approval_pending:true,markers_included:true}}]}})
  container.resolve(ContainerRegistrationKeys.LOGGER).info("Approved design names prepared as Draft. No inventory levels or quantities were entered; no orders or migrations were run.")
}
