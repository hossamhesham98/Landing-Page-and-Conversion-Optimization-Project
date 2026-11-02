type MessageData = Record<string, unknown>
type Item = {title?: unknown; design?: unknown; quantity?: unknown; unit_price?: unknown; total?: unknown; thumbnail?: unknown}

function escapeHtml(value: unknown) {
 return String(value ?? "").replace(/[&<>"']/g, character => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"})[character]!)
}
function cleanHeader(value: unknown) { return String(value ?? "").replace(/[\r\n]+/g, " ").slice(0, 120) }
function money(value: unknown) {
 return typeof value === "number" && Number.isFinite(value) ? `${value.toLocaleString("en-US", {minimumFractionDigits:2,maximumFractionDigits:2})} جنيه` : null
}
function storeUrl() {
 const url = new URL(process.env.DOCLOROO_PUBLIC_URL || "https://docloroo.com")
 if (url.protocol !== "https:" && !(process.env.NODE_ENV === "development" && ["localhost","127.0.0.1"].includes(url.hostname))) throw new Error("Trusted storefront URL required")
 return url.origin
}
function trackingUrl(value: unknown) {
 const url = new URL(String(value))
 if (url.origin !== storeUrl() || !url.pathname.startsWith("/order/track/")) throw new Error("Invalid order tracking URL")
 return url.href
}
function productImage(value:unknown) {
 try {
  const url=new URL(String(value)),store=new URL(storeUrl())
  if(url.protocol!=="https:"||url.username||url.password)return null
  if(url.origin!==store.origin&&url.origin!==`https://api.${store.hostname}`)return null
  return url.href
 }catch{return null}
}
function deliverySummary(value:unknown) {
 if(!value||typeof value!=="object")return {html:"",text:""}
 const address=value as MessageData
 const rows:[string,unknown][]=[["الاسم",address.name],["البريد الإلكتروني",address.email],["رقم الموبايل",address.phone],["المحافظة",address.region],["المنطقة",address.area],["الشارع",address.street],["تفاصيل العنوان",address.details],["الرمز البريدي",address.postal_code]]
 const filled=rows.filter(([,value])=>value!==undefined&&value!==null&&String(value).trim()!=="")
 if(!filled.length)return {html:"",text:""}
 return {html:`<h2 style="font-size:18px;margin:24px 0 10px">بيانات التوصيل</h2><table width="100%" cellpadding="0" cellspacing="0" border="0" dir="rtl" style="width:100%;font-size:14px;line-height:1.8">${filled.map(([label,value])=>`<tr><td valign="top" style="padding:9px 0;border-bottom:1px solid #eeeeee">${escapeHtml(label)}</td><td align="right" style="padding:9px 8px;border-bottom:1px solid #eeeeee;word-break:break-word"><span${["البريد الإلكتروني","رقم الموبايل"].includes(label)?' dir="ltr"':""}>${escapeHtml(value)}</span></td></tr>`).join("")}</table>`,text:"بيانات التوصيل:\n"+filled.map(([label,value])=>`${label}: ${String(value)}`).join("\n")}
}
function frame(title: string, introduction: string, body: string) {
 const base = storeUrl()
 return `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(title)}</title></head><body dir="rtl" style="margin:0;padding:0;background-color:#f6f6f8;color:#252525;font-family:Tahoma,Arial,sans-serif"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#f6f6f8"><tr><td align="center" style="padding:24px 12px"><!--[if mso]><table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0"><tr><td><![endif]--><table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" bgcolor="#ffffff" style="width:100%;max-width:600px;background-color:#ffffff;border:1px solid #e6e6e9"><tr><td align="right" style="padding:24px;border-bottom:3px solid #F13677"><a href="${escapeHtml(base)}" style="color:#252525;text-decoration:none"><img src="${escapeHtml(base)}/assets/docloroo-logo.png" width="168" height="56" alt="DoCloroo" style="display:block;width:168px;height:56px;border:0"></a><p style="margin:12px 0 0;font-size:13px;color:#5b5b63">حسابك وطلباتك لدى DoCloroo</p></td></tr><tr><td dir="rtl" align="right" style="padding:28px 24px;font-size:16px;line-height:1.8"><h1 style="font-size:23px;line-height:1.5;margin:0 0 16px;color:#252525">${escapeHtml(title)}</h1><p style="margin:0 0 20px">${escapeHtml(introduction)}</p>${body}</td></tr><tr><td dir="rtl" align="right" style="padding:20px 24px;border-top:1px solid #e6e6e9;font-size:13px;line-height:1.8;color:#5b5b63"><p style="margin:0 0 8px">للمساعدة، يمكنك الرد على هذه الرسالة أو مراسلتنا على <a href="mailto:info@docloroo.com" style="color:#9c2350">info@docloroo.com</a>.</p><p style="margin:0">DoCloroo · <a href="${escapeHtml(base)}" style="color:#9c2350">${escapeHtml(new URL(base).hostname)}</a></p></td></tr></table><!--[if mso]></td></tr></table><![endif]--></td></tr></table></body></html>`
}
function trackingButton(url: string) {
 return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0"><tr><td align="center" bgcolor="#F13677" style="padding:13px 24px;background-color:#F13677"><a href="${escapeHtml(url)}" style="font-family:Tahoma,Arial,sans-serif;font-size:16px;font-weight:bold;color:#ffffff;text-decoration:none">متابعة الطلب</a></td></tr></table><p style="font-size:13px;line-height:1.8;margin:0;color:#5b5b63">الرابط يفتح صفحة متابعة طلبك على ${escapeHtml(new URL(url).hostname)}. احتفظ به لنفسك؛ يمنح الوصول إلى حالة الطلب.</p>`
}
function orderSummary(value: unknown, administrator = false) {
 if (!value || typeof value !== "object") return {html:"",text:""}
 const order = value as MessageData
 const items = Array.isArray(order.items) ? order.items as Item[] : []
 const rows: [string, unknown][] = [["المنتجات قبل الخصم",order.original_total],["الخصم",order.discount_total],["المنتجات بعد الخصم",order.products_total],["الشحن",order.shipping_total],["الإجمالي عند الاستلام",order.total]]
 const itemHtml = items.map(item => `<tr><td style="padding:10px 0;border-bottom:1px solid #ededf0">${escapeHtml(item.title)}<br><span style="font-size:13px;color:#5b5b63">${escapeHtml(item.design)} × ${escapeHtml(item.quantity)}</span></td><td dir="ltr" align="left" style="padding:10px 0;border-bottom:1px solid #ededf0">${escapeHtml(money(item.total) || "")}</td></tr>`).join("")
 const totals = rows.filter(([,value]) => money(value) !== null)
 if (administrator) {
  const quantity = items.reduce((sum,item) => sum + Number(item.quantity),0)
  const products = items.map(item => {
   const image=productImage(item.thumbnail),title=`<strong>${escapeHtml(item.title)}</strong><br>${escapeHtml(item.design)}`
   const heading=image?`<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" dir="rtl"><tr><td width="84" valign="middle" style="padding-left:12px"><img src="${escapeHtml(image)}" width="72" height="72" alt="${escapeHtml(`${item.title ?? ""} — ${item.design ?? ""}`)}" style="display:block;width:72px;height:72px;object-fit:contain;border:1px solid #eeeeee"></td><td align="right" valign="middle">${title}</td></tr></table>`:title
   return `<table width="100%" cellpadding="0" cellspacing="0" border="0" dir="rtl" style="width:100%;margin:12px 0;border:1px solid #e6e6e9;font-size:13px;line-height:1.8"><tr><td colspan="3" align="right" style="padding:12px;border-bottom:1px solid #e6e6e9">${heading}</td></tr><tr><td width="24%" valign="top" style="padding:10px">الكمية<br><strong>${escapeHtml(item.quantity)}</strong></td><td width="38%" valign="top" style="padding:10px">سعر القطعة<br><strong dir="ltr">${escapeHtml(money(item.unit_price) || "—")}</strong></td><td width="38%" valign="top" style="padding:10px">إجمالي السطر بعد الخصم<br><strong dir="ltr">${escapeHtml(money(item.total) || "—")}</strong></td></tr></table>`
  }).join("")
  const quantityText = Number.isFinite(quantity) ? `إجمالي عدد القطع: ${quantity}` : ""
  return {html:`<h2 style="font-size:18px;margin:24px 0 10px">تفاصيل المنتجات</h2>${products}<p style="font-weight:bold">${escapeHtml(quantityText)}</p><h2 style="font-size:18px;margin:24px 0 10px">ملخص المبالغ</h2><table width="100%" cellpadding="0" cellspacing="0" border="0" dir="rtl" style="width:100%;font-size:14px;line-height:1.8">${totals.map(([label,value]) => `<tr><td style="padding:9px 0;border-bottom:1px solid #eeeeee">${escapeHtml(label)}</td><td dir="ltr" align="left" style="padding:9px 0;border-bottom:1px solid #eeeeee;font-weight:bold">${escapeHtml(money(value))}</td></tr>`).join("")}</table>`,text:[...items.map(item => `${item.title ?? ""} / ${item.design ?? ""}\nالكمية: ${item.quantity ?? ""} — سعر القطعة: ${money(item.unit_price) || "—"} — إجمالي السطر بعد الخصم: ${money(item.total) || "—"}`),quantityText,...totals.map(([label,value]) => `${label}: ${money(value)}`)].join("\n")}
 }
 return {
  html:`<h2 style="font-size:18px;margin:24px 0 10px">ملخص طلبك</h2><table width="100%" cellpadding="0" cellspacing="0" border="0" dir="rtl" style="width:100%;font-size:14px;line-height:1.8">${itemHtml}${totals.map(([label,value]) => `<tr><td style="padding:9px 0">${escapeHtml(label)}</td><td dir="ltr" align="left" style="padding:9px 0;font-weight:bold">${escapeHtml(money(value))}</td></tr>`).join("")}</table>`,
  text:[...items.map(item => `${item.title ?? ""} / ${item.design ?? ""} × ${item.quantity ?? ""}: ${money(item.total) || ""}`),...totals.map(([label,value]) => `${label}: ${money(value)}`)].join("\n")
 }
}
export function renderTransactionalEmail(template: string, data: MessageData, otp?: string) {
 const footer = "\nللمساعدة، يمكنك الرد على هذه الرسالة أو مراسلة info@docloroo.com.\nDoCloroo — " + storeUrl()
 if (template === "docloroo-admin-order" || template === "docloroo-admin-stock") {
  // Administrator links require an authenticated dashboard session. Never send
  // customer bearer tracking tokens in an operational alert.
  const path = String(data.admin_path || "")
  if (!/^\/(orders|products)\/[a-zA-Z0-9_-]+$/.test(path)) throw new Error("Invalid administrator resource path")
  const host = new URL(storeUrl()).hostname
  const url = `https://admin.${host}${path}`
  const isOrder = template === "docloroo-admin-order"
  const subject = `[DoCloroo Admin] ${cleanHeader(data.label)}${isOrder ? ` — #${cleanHeader(data.display_id)}` : ` — ${cleanHeader(data.design)}`}`
  const rows:[string,unknown][] = isOrder ? [["رقم الطلب",data.display_id],["الحالة",data.status_label],["اسم العميل",data.customer_name],["إيميل العميل",data.customer_email],["الموبايل",data.customer_phone],["العنوان",data.address],["الدفع",data.payment_status],["وقت التنبيه",data.occurred_at]] : [["المنتج",data.product],["التصميم",data.design],["SKU",data.sku],["المتاح بعد حجز الطلبات",data.available],["حد تنبيه النقص",data.threshold],["وقت التنبيه",data.occurred_at]]
  const summary = isOrder ? orderSummary(data.order,true) : {html:"",text:""}
  const introduction = "إشعار إداري من متجر DoCloroo. راجع التفاصيل والإجراء المطلوب داخل SITEYFY."
  const details = rows.map(([label,value]) => `${label}: ${String(value ?? "—")}`).join("\n")
  const htmlRows = rows.map(([label,value]) => `<tr><td style="padding:8px;border-bottom:1px solid #eeeeee">${escapeHtml(label)}</td><td style="padding:8px;border-bottom:1px solid #eeeeee">${escapeHtml(value ?? "—")}</td></tr>`).join("")
  const buttonLabel = isOrder ? "فتح الطلب في SITEYFY" : "فتح المنتج في SITEYFY"
  const button = `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0"><tr><td align="center" bgcolor="#7025b7" style="padding:14px 24px;background-color:#7025b7;border-radius:6px"><a href="${escapeHtml(url)}" style="display:inline-block;font-family:Tahoma,Arial,sans-serif;font-size:16px;font-weight:bold;color:#ffffff;text-decoration:none">${buttonLabel}</a></td></tr></table>`
  return {subject,text:`${introduction}\n${details}\n${summary.text}\n${buttonLabel} (يتطلب تسجيل الدخول):\n${url}${footer}`,html:frame(subject,introduction,`<table width="100%" cellpadding="0" cellspacing="0" dir="rtl">${htmlRows}</table>${summary.html}${button}<p style="font-size:13px;color:#5b5b63">رابط الإدارة يتطلب تسجيل الدخول. هذا الإشعار لا يؤكد تحصيل أي مبلغ.</p>`)}
 }
 if (template === "docloroo-otp") {
  if (!otp || !/^\d{6}$/.test(otp)) throw new Error("A valid OTP is required")
  const subject = "كود الدخول إلى DoCloroo"
  const introduction = "وصلتك هذه الرسالة لأنك طلبت تسجيل الدخول إلى حسابك على DoCloroo."
  return {subject,text:`${introduction}\nكود الدخول: ${otp}\nصالح لمدة 10 دقائق من وقت طلبه. لا تشارك الكود مع أي شخص.\nإذا لم تطلب هذا الكود، يمكنك تجاهل الرسالة.${footer}`,html:frame(subject,introduction,`<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#fff1f6"><tr><td dir="ltr" align="center" style="padding:20px;font-family:Consolas,'Courier New',monospace;font-size:36px;letter-spacing:7px;color:#252525">${otp}</td></tr></table><p style="margin:20px 0 8px">صالح لمدة <strong>10 دقائق من وقت طلبه</strong>. لا تشارك الكود مع أي شخص.</p><p style="font-size:14px;color:#5b5b63;margin:0">إذا لم تطلب هذا الكود، يمكنك تجاهل الرسالة.</p>`)}
 }
 if (template === "docloroo-order-confirmation" || template === "docloroo-order-update") {
  const id = cleanHeader(data.display_id),url = trackingUrl(data.tracking_url),confirmation = template === "docloroo-order-confirmation"
  const subject = confirmation ? `تم استلام طلب DoCloroo رقم ${id}` : `تحديث طلب DoCloroo رقم ${id}`
  const introduction = confirmation ? `تم استلام طلبك رقم ${id}. طريقة الدفع: الدفع عند الاستلام.` : `حالة طلبك رقم ${id}: ${cleanHeader(data.status_label)}.`
  const summary = confirmation ? orderSummary(data.order,true) : {html:"",text:""}
  const delivery = confirmation ? deliverySummary(data.delivery) : {html:"",text:""}
  return {subject,text:`${introduction}\n${summary.text ? summary.text + "\n" : ""}${delivery.text ? delivery.text + "\n" : ""}تابع طلبك من الرابط الخاص بك:\n${url}\nلا تشارك هذا الرابط؛ يمنح الوصول إلى حالة طلبك.${footer}`,html:frame(subject,introduction,summary.html + delivery.html + trackingButton(url))}
 }
 throw new Error("Unsupported DoCloroo email template")
}
