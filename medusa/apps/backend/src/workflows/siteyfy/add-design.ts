import {createStep,createWorkflow,StepResponse,WorkflowResponse} from "@medusajs/framework/workflows-sdk"
import {ContainerRegistrationKeys,MedusaError,Modules} from "@medusajs/framework/utils"
import {setProductProductOptionsWorkflow,createProductVariantsWorkflow} from "@medusajs/medusa/core-flows"
import {randomUUID} from "node:crypto"
export type DesignInput={product_id:string;title:string;sku:string;image:string;price:number}
const addDesign=createStep("add-design",async(input:DesignInput,{container})=>{
 const service=container.resolve(Modules.PRODUCT),product=await service.retrieveProduct(input.product_id,{relations:["options","options.values"]})
 if(product.metadata?.brand!=="DoCloroo")throw new MedusaError(MedusaError.Types.NOT_ALLOWED,"This connection manages DoCloroo only")
 if((await service.listProductVariants({sku:input.sku})).length)throw new MedusaError(MedusaError.Types.CONFLICT,"SKU already exists")
 const option=product.options.find(o=>o.title==="التصميم")
 if(!option)throw new MedusaError(MedusaError.Types.INVALID_DATA,"Expected design option missing")
 const global=await service.retrieveProductOption(option.id,{relations:["values"]}),value=global.values.find(v=>v.value===input.title)
 if(!option.values.some(v=>v.value===input.title))await setProductProductOptionsWorkflow(container).run({input:{product_id:product.id,update:[{product_option_id:option.id,add:[value?.id||{value:input.title}]}]}})
 const {result:[variant]}=await createProductVariantsWorkflow(container).run({input:{product_variants:[{product_id:product.id,title:input.title,sku:input.sku,prices:[{currency_code:"egp",amount:input.price}],options:{"التصميم":input.title},manage_inventory:true,allow_backorder:false,metadata:{active:true,design_key:`design-${randomUUID()}`,image:input.image}}]}})
 return new StepResponse({id:variant.id})
})
export const siteyfyAddDesignWorkflow=createWorkflow("siteyfy-add-design",(input:DesignInput)=>new WorkflowResponse(addDesign(input)))
