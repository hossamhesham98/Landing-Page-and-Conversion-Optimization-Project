import { createStep, createWorkflow, StepResponse, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { ContainerRegistrationKeys, MedusaError, PromotionActions } from "@medusajs/framework/utils"
import { updateCartPromotionsWorkflow } from "@medusajs/medusa/core-flows"
import { activeTierCode, getSettings, tierCode } from "../../lib/docloroo"

const doclorooChooseTier = createStep("docloroo-choose-tier", async (input: { cart_id: string }, { container }) => {
  const { data: [cart] } = await container.resolve(ContainerRegistrationKeys.QUERY).graph({ entity: "cart", fields: ["id", "completed_at", "items.quantity", "items.product.metadata"], filters: { id: input.cart_id } })
  const { settings } = await getSettings(container)
  const code = await activeTierCode(cart.items, settings, container)
  return new StepResponse({ cart_id: cart.id, promo_codes: code ? [code] : [], action: PromotionActions.REPLACE, force_refresh_payment_collection: true })
})
export const doclorooSyncTierWorkflow = createWorkflow("docloroo-sync-tier", (input: { cart_id: string }) => {
  const tier = doclorooChooseTier(input)
  updateCartPromotionsWorkflow.runAsStep({ input: tier })
  return new WorkflowResponse(tier)
})

// Native refresh may carry the old code while quantities change. Native rules
// remove it using this server-owned context; ineligible codes cannot discount.
updateCartPromotionsWorkflow.hooks.setPromotionContext(async({cart},{container})=>{
  const {settings}=await getSettings(container)
  const {data:[expanded]}=await container.resolve(ContainerRegistrationKeys.QUERY).graph({entity:"cart",fields:["id","items.quantity","items.product.metadata"],filters:{id:cart.id}})
  return new StepResponse({docloroo_tier_code:tierCode(expanded.items,settings)||"none"})
})
