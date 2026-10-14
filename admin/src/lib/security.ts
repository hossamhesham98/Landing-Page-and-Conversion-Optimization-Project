/** Simple standalone helpers imported by runtime code and Node tests. */
export const ADMIN_ROOTS = new Set(["products", "orders", "customers", "promotions", "inventory-items", "stock-locations", "uploads", "siteyfy", "docloroo", "shipping-options", "payments"])
export function allowedAdminPath(parts: string[]): boolean {
 return parts.length > 0 && parts.length <= 8 && ADMIN_ROOTS.has(parts[0]) && parts.every((p) => /^[a-zA-Z0-9_-]{1,128}$/.test(p))
}
export function sameOrigin(origin: string|null, host: string|null): boolean {
 if (!origin || !host) return false
 try { return new URL(origin).host.toLowerCase() === host.toLowerCase() } catch { return false }
}
export function readResponseCode(code: number): string {
 if(code===401||code===403)return "Your administrator session has expired or access was denied."
 if(code===404)return "This API resource is not installed in your Medusa backend."
 if(code===409)return "This record was updated elsewhere. Refresh before saving."
 if(code>=500)return "The Medusa service returned an error. Check backend logs."
 return `Request failed (HTTP ${code}).`
}
