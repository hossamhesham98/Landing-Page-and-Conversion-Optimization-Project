import type {ExecArgs} from "@medusajs/framework/types"
import {MedusaError,Modules,RuleType,ContainerRegistrationKeys} from "@medusajs/framework/utils"
import {createPromotionRulesWorkflow} from "@medusajs/medusa/core-flows"
import {getSettings} from "../lib/docloroo"
export default async function prepareTierRules({container}:ExecArgs){
  const {settings}=await getSettings(container)
  for(const tier of settings.tiers){
    const [promotion]=await container.resolve(Modules.PROMOTION).listPromotions({code:tier.code},{relations:["rules"]})
    if(!promotion)throw new MedusaError(MedusaError.Types.NOT_FOUND,"Expected existing quantity promotion missing")
    if(!promotion.rules?.some(r=>r.attribute==="docloroo_tier_code"))await createPromotionRulesWorkflow(container).run({input:{rule_type:RuleType.RULES,data:{id:promotion.id,rules:[{attribute:"docloroo_tier_code",operator:"eq",values:[tier.code]}]}}})
  }
  container.resolve(ContainerRegistrationKeys.LOGGER).info("Native promotion eligibility rules configured; existing percentages preserved.")
}
