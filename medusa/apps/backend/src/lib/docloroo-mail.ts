import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto"
import { MedusaError } from "@medusajs/framework/utils"
export function mailReady(){return process.env.DOCLOROO_MAIL_ENABLED==="true"&&!!process.env.SMTP_HOST&&!!process.env.SMTP_FROM}
export function requireMail(){if(!mailReady())throw new MedusaError(MedusaError.Types.UNEXPECTED_STATE,"إرسال البريد غير مفعّل. تسجيل الدخول متاح بعد إعداد مزوّد بريد حقيقي.")}
function key(){const secret=process.env.DOCLOROO_TRACKING_SECRET;if(!secret||secret.length<32)throw new MedusaError(MedusaError.Types.UNEXPECTED_STATE,"Mail encryption key is not configured");return createHash("sha256").update(`docloroo:otp-mail:${secret}`).digest()}
export function sealOtp(email:string,code:string,expires:number){const iv=randomBytes(12),cipher=createCipheriv("aes-256-gcm",key(),iv);cipher.setAAD(Buffer.from(email));const data=Buffer.concat([cipher.update(JSON.stringify({code,expires})),cipher.final()]);return [iv,cipher.getAuthTag(),data].map(x=>x.toString("base64url")).join(".")}
export function openOtp(email:string,sealed:string){const [iv,tag,data]=sealed.split(".").map(x=>Buffer.from(x,"base64url")),decipher=createDecipheriv("aes-256-gcm",key(),iv);decipher.setAAD(Buffer.from(email));decipher.setAuthTag(tag);const decoded=JSON.parse(Buffer.concat([decipher.update(data),decipher.final()]).toString());if(!/^\d{6}$/.test(decoded.code)||decoded.expires<Date.now())throw new MedusaError(MedusaError.Types.INVALID_DATA,"OTP notification expired");return decoded.code as string}
export function mailText(template:string,data:Record<string,unknown>,to:string){
 if(template==="docloroo-otp")return {subject:"كود الدخول إلى DoCloroo",text:`كود الدخول: ${openOtp(to,String(data.sealed))}\nصالح لمدة 10 دقائق. لا تشارك الكود مع أي شخص.`}
 if(template==="docloroo-order-confirmation")return {subject:`تم استلام طلب DoCloroo رقم ${data.display_id}`,text:`تم استلام طلبك رقم ${data.display_id}.\nالدفع عند الاستلام.\nتابع طلبك من الرابط الخاص بك:\n${data.tracking_url}\nلا تشارك هذا الرابط؛ يمنح الوصول إلى حالة طلبك.`}
 if(template==="docloroo-order-update")return {subject:`تحديث طلب DoCloroo رقم ${data.display_id}`,text:`حالة الطلب رقم ${data.display_id}: ${data.status_label}\nمتابعة الطلب: ${data.tracking_url}`}
 throw new MedusaError(MedusaError.Types.INVALID_DATA,"Unsupported DoCloroo email template")
}
