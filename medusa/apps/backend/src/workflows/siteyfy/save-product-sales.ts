import {createStep,createWorkflow,StepResponse,WorkflowResponse} from "@medusajs/framework/workflows-sdk"
import {acquireLockStep,releaseLockStep} from "@medusajs/medusa/core-flows"
import {Modules,MedusaError} from "@medusajs/framework/utils"
import type {ProductSales} from "../../lib/product-sales"
const saveProductSalesStep=createStep("save-product-sales-step",async(input:ProductSales & {product_id:string},{container})=>{
 const service=container.resolve(Modules.PRODUCT),product=await service.retrieveProduct(input.product_id)
 if(product.metadata?.brand!=="DoCloroo")throw new MedusaError(MedusaError.Types.NOT_ALLOWED,"Only the authorized DoCloroo catalog can be edited")
 const {product_id,...values}=input
 await service.updateProducts(product_id,{metadata:{...product.metadata,siteyfy_sales:{...values,updated_at:new Date().toISOString()},siteyfy_sales_audit:[...(Array.isArray(product.metadata?.siteyfy_sales_audit)?product.metadata.siteyfy_sales_audit:[]).slice(-19),{...values,at:new Date().toISOString()}]}})
 return new StepResponse({saved:true})
})
export const saveProductSalesWorkflow=createWorkflow("save-product-sales",(input:ProductSales & {product_id:string})=>{
 const key="siteyfy:product-sales"
 acquireLockStep({key,timeout:10,ttl:30})
 const result=saveProductSalesStep(input)
 releaseLockStep({key})
 return new WorkflowResponse(result)
})
