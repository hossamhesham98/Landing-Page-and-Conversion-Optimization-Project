export const PRICE = 899;
export const SHIPPING = 70;
export const VERIFIED_SALES_COUNT: number | null = null; // Set only from user's verified historic sales.
export const VERIFIED_REVIEWS: { name: string; stars: number; comment: string; image?: string }[] = [];
export const VARIANTS = [
  { id: "fun", name: "عالم المرح", image: "/assets/fun-doodles.webp" },
  { id: "garden", name: "حديقة الأحلام", image: "/assets/dream-garden.webp" },
  { id: "space", name: "مغامرة الفضاء", image: "/assets/space-adventure.webp" },
] as const;
export type VariantId = string;
export type Line = { id: VariantId; qty: number };
export type OrderStatus = "جديد" | "تحت التأكيد" | "مؤكد" | "تم الشحن" | "تم التسليم" | "ملغي";
export const STATUS_STEPS: OrderStatus[] = ["جديد", "تحت التأكيد", "مؤكد", "تم الشحن", "تم التسليم"];
export function formatEGP(value: number) {
  return value.toLocaleString("en-US", { minimumFractionDigits: Number.isInteger(value) ? 0 : 2, maximumFractionDigits: 2 }) + " جنيه";
}
export function validLines(input: unknown): Line[] {
  if (!Array.isArray(input)) return [];
  return input.filter((value): value is Line =>
    !!value && typeof value === "object" && VARIANTS.some(v => v.id === value.id) && Number.isInteger(value.qty) && value.qty > 0 && value.qty <= 99
  ).map(v => ({ id: v.id, qty: v.qty }));
}
export function calc(lines: Line[]) {
  const count = lines.reduce((total, line) => total + line.qty, 0);
  const subtotal = count * PRICE;
  const rate = count >= 3 ? 0.20 : count === 2 ? 0.10 : 0;
  const discount = Math.round(subtotal * rate * 100) / 100;
  const productsTotal = Math.round((subtotal - discount) * 100) / 100;
  const shipping = count ? SHIPPING : 0;
  const grandTotal = Math.round((productsTotal + shipping) * 100) / 100;
  return { count, subtotal, rate, discount, productsTotal, shipping, grandTotal };
}
export function normalizeEgyptPhone(raw:string){const value=raw.trim().replace(/[٠-٩]/g,c=>String(c.charCodeAt(0)-1632)).replace(/[۰-۹]/g,c=>String(c.charCodeAt(0)-1776));if(/^01[0125][0-9]{8}$/.test(value))return "+20"+value.slice(1);if(/^1[0125][0-9]{8}$/.test(value))return "+20"+value;return null;}
export function isValidEgyptPhone(raw:string){return normalizeEgyptPhone(raw)!==null;}
export function isValidEmail(raw: string) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(raw.trim()); }
export function variant(id: VariantId) { return VARIANTS.find(x => x.id === id) ?? VARIANTS[0]; }

