export function normalizeEgyptPhone(raw: string): string | null {
  const digits = raw.trim().replace(/[٠-٩]/g, c => String(c.charCodeAt(0) - 1632)).replace(/[۰-۹]/g, c => String(c.charCodeAt(0) - 1776))
  if (/^01[0125]\d{8}$/.test(digits)) return `+20${digits.slice(1)}`
  if (/^1[0125]\d{8}$/.test(digits)) return `+20${digits}`
  if (/^\+201[0125]\d{8}$/.test(digits)) return digits
  return null
}
