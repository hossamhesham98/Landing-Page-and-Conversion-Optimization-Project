import { createHmac, timingSafeEqual } from "node:crypto"
import type { MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys, MedusaError, Modules } from "@medusajs/framework/utils"

export type DoclorooReview = { display_name:string; text:string; rating:number; date:string; design?:string; source_reference:string; approved:boolean }
export type DoclorooSettings = {
  tiers: {min:number;max:number|null;code:string}[]
  social_proof: {sold_count:number|null; reviews:DoclorooReview[]}
  shipping: {confirmed:boolean;regions:{name:string;cost:number|null;duration:string|null}[]}
}
export const DEFAULT_SETTINGS: DoclorooSettings = {
  tiers: [{ min: 2, max: 2, code: "DOCLOROO-TWO" }, { min: 3, max: null, code: "DOCLOROO-THREE" }],
  social_proof: { sold_count: null, reviews: [] },
  shipping: { confirmed: false, regions: [] },
}
export async function getSettings(container: MedusaContainer) {
  const stores = await container.resolve(Modules.STORE).listStores({name:"DoCloroo"})
  if(stores.length!==1)throw new MedusaError(MedusaError.Types.INVALID_DATA,"Exactly one DoCloroo store must be configured")
  const store = stores[0]
  return { store, settings: (store.metadata?.docloroo || DEFAULT_SETTINGS) as DoclorooSettings }
}
type TierItem = { quantity: number; product_id?: string | null; product?: { metadata?: Record<string, unknown> | null } | null }
export function tierCode(items: (TierItem | null)[], settings: DoclorooSettings) {
  const quantity = items.filter((item): item is TierItem => !!item && item.product?.metadata?.brand === "DoCloroo" && item.product?.metadata?.kind === "coloring_blanket").reduce((sum, item) => sum + item.quantity, 0)
  return settings.tiers.find(t => quantity >= t.min && (t.max === null || quantity <= t.max))?.code
}
export async function activeTierCode(items: Parameters<typeof tierCode>[0], settings: DoclorooSettings, container: MedusaContainer) {
  const code = tierCode(items, settings)
  if (!code) return undefined
  const [promotion] = await container.resolve(Modules.PROMOTION).listPromotions({ code, status: ["active"] }, { relations: ["application_method"] })
  return promotion?.application_method?.type === "percentage" && promotion.application_method.target_type === "items" ? code : undefined
}
export function trackingToken(order: { id: string; metadata?: Record<string, any> | null }) {
  const secret = process.env.DOCLOROO_TRACKING_SECRET
  if (!secret || secret.length < 32) throw new MedusaError(MedusaError.Types.UNEXPECTED_STATE, "Tracking secret not configured")
  return createHmac("sha256", secret).update(`${order.id}:${order.metadata?.docloroo?.tracking_nonce}`).digest("hex")
}
export function validTrackingToken(order: { id: string; metadata?: Record<string, any> | null }, value: unknown) {
  if (typeof value !== "string" || !/^[a-f0-9]{64}$/.test(value) || !order.metadata?.docloroo?.tracking_nonce) return false
  return timingSafeEqual(Buffer.from(value, "hex"), Buffer.from(trackingToken(order), "hex"))
}
export function orderStatus(order: any) {
  if (order.status === "canceled") return "cancelled"
  const fulfillments = (order.fulfillments || []).filter((f: any) => !f.canceled_at)
  if (fulfillments.some((f: any) => f.delivered_at)) return "delivered"
  if (fulfillments.some((f: any) => f.shipped_at)) return "shipped"
  return order.metadata?.docloroo?.status || "new"
}
export const statusLabels: Record<string, string> = { new: "جديد", confirming: "تحت التأكيد", confirmed: "مؤكد", shipped: "تم الشحن", delivered: "تم التسليم", cancelled: "ملغي" }
export function publicOrder(order: any) {
  return { id: order.id, display_id: order.display_id, created_at: order.created_at,
    status: orderStatus(order), status_label: statusLabels[orderStatus(order)],
    items: (order.items || []).map((i: any) => ({ id: i.id, title: i.product_title || i.title, design: i.variant_title, quantity: i.quantity, unit_price: Number(i.unit_price), total: Number(i.total), thumbnail: i.thumbnail })),
    original_total: Number(order.item_subtotal), discount_total: Number(order.item_discount_total), products_total: Number(order.item_total),
    shipping_total:Number(order.shipping_total),total:Number(order.total),currency_code:order.currency_code,
    shipping_confirmed: order.metadata?.docloroo?.shipping_confirmed === true,
    payment_method: "الدفع عند الاستلام", cancellation_requested_at: order.metadata?.docloroo?.cancellation_requested_at || null,
    email_delivery:order.metadata?.docloroo?.email_delivery||"not_sent",development_test:order.metadata?.docloroo?.development_test===true,
  }
}
export const orderFields = ["id", "display_id", "status", "created_at", "customer_id", "metadata", "items.*", "items.adjustments.*", "item_total", "item_subtotal", "item_discount_total", "shipping_total", "total", "currency_code", "fulfillments.*"]
export async function retrieveOrder(container: MedusaContainer, id: string) {
  const { data } = await container.resolve(ContainerRegistrationKeys.QUERY).graph({ entity: "order", fields: orderFields, filters: { id } })
  if (!data[0]) throw new MedusaError(MedusaError.Types.NOT_FOUND, "الطلب غير موجود")
  return data[0]
}
