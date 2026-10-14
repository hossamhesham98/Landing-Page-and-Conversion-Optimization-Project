import { addToCartWorkflow } from "@medusajs/medusa/core-flows"
import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils"
import { StepResponse } from "@medusajs/framework/workflows-sdk"
import { assertPurchasable } from "../../lib/docloroo-launch"

// Enforce the launch gate on Medusa's native API, not just storefront buttons.
addToCartWorkflow.hooks.validate(async ({input},{container})=>{
  const ids=(input.items||[]).flatMap(item=>item.variant_id?[item.variant_id]:[])
  if(!ids.length)return new StepResponse()
  const {data:variants}=await container.resolve(ContainerRegistrationKeys.QUERY).graph({entity:"product_variant",
    fields:["id","manage_inventory","allow_backorder","metadata","product.status","product.metadata"],filters:{id:ids}})
  for(const variant of variants){
    if(variant.product?.metadata?.brand!=="DoCloroo")continue
    assertPurchasable(variant.product,variant)
  }
  return new StepResponse()
})
