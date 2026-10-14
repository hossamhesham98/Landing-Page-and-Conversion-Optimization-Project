import { MedusaError } from "@medusajs/framework/utils"

export function developmentTestEnabled() {
  return process.env.NODE_ENV === "development" && process.env.DOCLOROO_DEVELOPMENT_TEST === "true"
}
export function checkoutVerified(){return process.env.DOCLOROO_CHECKOUT_VERIFIED==="true"&&(developmentTestEnabled()||process.env.DOCLOROO_PRODUCTION_LAUNCH_APPROVED==="true")}
export function assertPurchasable(product: {status?:string;metadata?:Record<string,unknown>|null}, variant?: {manage_inventory?:boolean;allow_backorder?:boolean;metadata?:Record<string,unknown>|null}) {
  const metadata=product.metadata||{}
  const test=metadata.development_test===true&&developmentTestEnabled()
  if(product.status!=="published"||(!test&&(metadata.inventory_pending===true||metadata.design_approval_pending===true||metadata.development_test===true)))
    throw new MedusaError(MedusaError.Types.NOT_ALLOWED,"المنتج غير معتمد للبيع في هذه البيئة")
  if(variant&&(!variant.manage_inventory||variant.allow_backorder||variant.metadata?.active===false))
    throw new MedusaError(MedusaError.Types.NOT_ALLOWED,"التصميم غير متاح أو متابعة المخزون غير مفعّلة")
}
