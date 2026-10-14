import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"
import { getSettings } from "../../../../lib/docloroo"
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const { settings } = await getSettings(req.scope)
  const tiers: { min: number; max: number | null; percent: number }[] = []
  for (const tier of settings.tiers) {
    const [promotion] = await req.scope.resolve(Modules.PROMOTION).listPromotions({ code: tier.code }, { relations: ["application_method"] })
    if (promotion?.status === "active" && promotion.application_method?.type === "percentage") {
      tiers.push({ min: tier.min, max: tier.max, percent: Number(promotion.application_method.value) })
    }
  }
  // Public responses must never include pending reviews or private source references.
  const reviews=settings.social_proof.reviews.filter(review=>review.approved).map(review=>({
    display_name:review.display_name, text:review.text, rating:review.rating, date:review.date, design:review.design,
  }))
  res.setHeader("Cache-Control", "public, max-age=0, s-maxage=10")
  res.json({ settings: { ...settings, social_proof:{sold_count:settings.social_proof.sold_count,reviews}, tiers } })
}
