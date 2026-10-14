import type { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys, Modules, ProductStatus } from "@medusajs/framework/utils"
import { createApiKeysWorkflow, createProductsWorkflow, createRegionsWorkflow, createSalesChannelsWorkflow, createStoresWorkflow, updateStoresWorkflow, createStockLocationsWorkflow, createPromotionsWorkflow, linkSalesChannelsToApiKeyWorkflow, linkSalesChannelsToStockLocationWorkflow } from "@medusajs/medusa/core-flows"
import { DEFAULT_SETTINGS } from "../lib/docloroo"

export default async function seedDocloroo({ container }: ExecArgs) {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const storeService = container.resolve(Modules.STORE)
  let [channel] = await container.resolve(Modules.SALES_CHANNEL).listSalesChannels({ name: "DoCloroo" })
  if (!channel) ({ result: [channel] } = await createSalesChannelsWorkflow(container).run({ input: { salesChannelsData: [{ name: "DoCloroo" }] } }))
  let [region] = await container.resolve(Modules.REGION).listRegions({ name: "DoCloroo Egypt" })
  if (!region) ({ result: [region] } = await createRegionsWorkflow(container).run({ input: { regions: [{ name: "DoCloroo Egypt", currency_code: "egp", countries: ["eg"], automatic_taxes: false, payment_providers: ["pp_system_default"] }] } }))
  let [store] = await storeService.listStores({}, { relations: ["supported_currencies"] })
  if (!store) ({ result: [store] } = await createStoresWorkflow(container).run({ input: { stores: [{ name: "DoCloroo", supported_currencies: [{ currency_code: "egp", is_default: true }], default_sales_channel_id: channel.id, metadata: { docloroo: DEFAULT_SETTINGS } }] } }))
  else await updateStoresWorkflow(container).run({ input: { selector: { id: store.id }, update: { name: "DoCloroo", default_sales_channel_id: channel.id,
    supported_currencies: [...(store.supported_currencies || []).filter(c => c.currency_code !== "egp").map(c => ({ currency_code: c.currency_code, is_default: false })), { currency_code: "egp", is_default: true }],
    metadata: { ...store.metadata, docloroo: store.metadata?.docloroo || DEFAULT_SETTINGS },
  } } })
  let [location] = await container.resolve(Modules.STOCK_LOCATION).listStockLocations({ name: "DoCloroo" })
  if (!location) {
    ({ result: [location] } = await createStockLocationsWorkflow(container).run({ input: { locations: [{ name: "DoCloroo", address: { country_code: "eg", address_1: "" } }] } }))
    await linkSalesChannelsToStockLocationWorkflow(container).run({ input: { id: location.id, add: [channel.id] } })
  }
  const { data: [existing] } = await query.graph({ entity: "product", fields: ["id"], filters: { handle: "docloroo-coloring-blanket" } })
  if (!existing) await createProductsWorkflow(container).run({ input: { products: [{
    title: "بطانية تلوين DoCloroo", handle: "docloroo-coloring-blanket", status: ProductStatus.DRAFT,
    description: "بطانية تلوين مقاس 130 × 150 سم مع الأقلام المرفقة. يمكن غسل الألوان وإعادة التلوين قبل تثبيتها بالكي حسب تعليمات المنتج.",
    thumbnail: `${process.env.DOCLOROO_PUBLIC_URL}/assets/fun-doodles.webp`, images: [{ url: `${process.env.DOCLOROO_PUBLIC_URL}/assets/fun-doodles.webp` }],
    options: [{ title: "التصميم", values: ["رسومات جرافيتي"] }], sales_channels: [{ id: channel.id }],
    variants: [{ title: "رسومات جرافيتي", sku: "DOCLOROO-GRAFFITI-130-150", manage_inventory: true, allow_backorder: false, options: { "التصميم": "رسومات جرافيتي" }, prices: [{ currency_code: "egp", amount: 899 }], metadata: { images: [`${process.env.DOCLOROO_PUBLIC_URL}/assets/fun-doodles.webp`], active: true } }],
    metadata: { brand: "DoCloroo", kind: "coloring_blanket", size: "130 × 150 سم", markers_included: true, inventory_pending: true },
  }] } })
  const { data: [product] } = await query.graph({ entity: "product", fields: ["id"], filters: { handle: "docloroo-coloring-blanket" } })
  for (const [code, value] of [["DOCLOROO-TWO", 10], ["DOCLOROO-THREE", 20]] as const) {
    const [existingPromotion] = await container.resolve(Modules.PROMOTION).listPromotions({ code })
    if (!existingPromotion) await createPromotionsWorkflow(container).run({ input: { promotionsData: [{ code, type: "standard", status: "active", is_automatic: false, application_method: { type: "percentage", target_type: "items", allocation: "across", value, target_rules: [{ attribute: "items.product.id", operator: "eq", values: [product.id] }] } }] } })
  }
  let [key] = await container.resolve(Modules.API_KEY).listApiKeys({ title: "DoCloroo Storefront", type: "publishable" })
  if (!key) {
    ({ result: [key] } = await createApiKeysWorkflow(container).run({ input: { api_keys: [{ title: "DoCloroo Storefront", type: "publishable", created_by: "" }] } }))
    await linkSalesChannelsToApiKeyWorkflow(container).run({ input: { id: key.id, add: [channel.id] } })
  }
  container.resolve(ContainerRegistrationKeys.LOGGER).info("DoCloroo setup prepared. Product remains draft until designs and real inventory are entered. No admin credentials or secrets displayed.")
}
