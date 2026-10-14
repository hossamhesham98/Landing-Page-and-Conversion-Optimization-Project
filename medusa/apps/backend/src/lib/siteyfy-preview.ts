import { createHmac, timingSafeEqual } from "node:crypto"
import { MedusaError } from "@medusajs/framework/utils"
function signature(payload:string) {
  const secret=process.env.DOCLOROO_TRACKING_SECRET
  if (!secret || secret.length < 32) throw new MedusaError(MedusaError.Types.INVALID_DATA,"Preview signing is not configured")
  return createHmac("sha256",secret).update(`siteyfy:docloroo:preview:${payload}`).digest("base64url")
}
export function createPreviewToken(now=Date.now()) {
  const payload=Buffer.from(JSON.stringify({store:"DoCloroo",expires:now+10*60*1000})).toString("base64url")
  return `${payload}.${signature(payload)}`
}
export function validPreviewToken(token:string,now=Date.now()) {
  if (token.length>1000) return false
  const [payload,sig,extra]=token.split(".")
  if (!payload || !sig || extra) return false
  try {
    const expected=Buffer.from(signature(payload)),actual=Buffer.from(sig)
    if (expected.length!==actual.length || !timingSafeEqual(expected,actual)) return false
    const data=JSON.parse(Buffer.from(payload,"base64url").toString())
    return data.store==="DoCloroo" && Number.isSafeInteger(data.expires) && data.expires>now && data.expires<=now+10*60*1000
  } catch { return false }
}
