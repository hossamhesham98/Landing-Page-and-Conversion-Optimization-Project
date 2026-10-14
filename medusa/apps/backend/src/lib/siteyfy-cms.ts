import { z } from "@medusajs/framework/zod"
import { MedusaError, Modules } from "@medusajs/framework/utils"
import type { MedusaContainer } from "@medusajs/framework/types"

// Phase 1 CMS: bounded store metadata, no separate database or untrusted HTML.
// For a multi-store visual builder this must move to a dedicated Medusa module.
export const SECTION_IDS = ["about", "reviews", "markers", "howto", "faq", "closing"] as const
const sectionId = z.enum(SECTION_IDS)
export function safeMediaUrl(value: string): boolean {
  if (/^\/assets\/[a-zA-Z0-9_./-]+$/.test(value) && !value.includes("..")) return true
  try {
    const url = new URL(value)
    return !url.username && !url.password && (url.protocol === "https:" ||
      (url.protocol === "http:" && ["localhost", "127.0.0.1"].includes(url.hostname)))
  } catch { return false }
}
const mediaUrl = z.string().trim().max(2000).refine(safeMediaUrl, "Use HTTPS or a local /assets/ URL")
export const PAGE_KEYS=["checkout","success","tracking","login","account","privacy","terms"] as const
const copy=z.string().trim().max(2000)
const pageSchema=z.object({title:copy.min(1).max(150),intro:copy,button:copy.max(80).optional(),blocks:z.array(z.object({id:z.string().regex(/^[a-zA-Z0-9_-]{1,60}$/),title:copy.max(150),body:copy,enabled:z.boolean(),type:z.enum(["text","image","video"]).optional(),media:mediaUrl.optional()}).strict()).max(20).refine(x=>new Set(x.map(b=>b.id)).size===x.length,"Block IDs must be unique"),seo:z.object({title:copy.max(150),description:copy.max(300)}).strict().optional()}).strict()
export const DOCLOROO_COLORS = ["#F5E6AD", "#F4CAA4", "#F4AD9B", "#F39192", "#F27589", "#F25880", "#F13677"] as const
export const homeSchema = z.object({
  theme: z.object({accent:z.enum(DOCLOROO_COLORS),badge:z.enum(DOCLOROO_COLORS)}).strict().optional(),
  media: z.object({markers_image:mediaUrl.optional(),about_video:mediaUrl.optional(),about_poster:mediaUrl.optional()}).strict().optional(),
  pages:z.partialRecord(z.enum(PAGE_KEYS),pageSchema).optional(),
  global:z.object({topbar:copy.max(250),footer:copy.max(400),font:z.enum(["Cairo","Tajawal","Segoe UI"]),seo_title:copy.max(150),seo_description:copy.max(300)}).strict().optional(),
  blocks:z.array(z.object({id:z.string().regex(/^[a-zA-Z0-9_-]{1,60}$/),type:z.enum(["text","image","video"]),title:copy.max(150),body:copy,media:mediaUrl.optional(),enabled:z.boolean(),after:sectionId}).strict()).max(20).refine(x=>new Set(x.map(b=>b.id)).size===x.length,"Block IDs must be unique").optional(),
  hero: z.object({
    eyebrow: z.string().trim().min(1).max(90),
    title: z.string().trim().min(1).max(100),
    description: z.string().trim().min(1).max(600),
    primary_button: z.string().trim().min(1).max(50),
    secondary_button: z.string().trim().min(1).max(50),
  }).strict(),
  // Optional for backward compatibility with existing published Phase-1 CMS data.
  editorial: z.object({
    about_title: z.string().trim().min(3).max(120),
    about_body: z.string().trim().min(10).max(800),
    markers_title: z.string().trim().min(3).max(120),
    markers_body: z.string().trim().min(10).max(800),
    howto_intro: z.string().trim().min(3).max(350),
    closing_title: z.string().trim().min(3).max(120),
    closing_body: z.string().trim().min(10).max(400),
  }).strict().optional(),
  faq: z.array(z.object({question: z.string().trim().min(3).max(160), answer: z.string().trim().min(3).max(800)}).strict()).max(16),
  sections: z.array(z.object({id: sectionId, enabled: z.boolean()}).strict()).length(SECTION_IDS.length)
    .refine((sections) => new Set(sections.map(s=>s.id)).size === SECTION_IDS.length, "Each section must appear exactly once"),
}).strict()
export type SiteyfyHome = z.infer<typeof homeSchema>
export const DEFAULT_HOME: SiteyfyHome = {
  hero: {
    eyebrow: "لوّنها زي ما تحب!",
    title: "بطانية تلوين DoCloroo",
    description: "اختار رسمتك المفضلة، وابدأ التلوين بطريقتك. تقدر تغسل الألوان وتكرر التجربة قبل تثبيتها بالكي وفق تعليمات المنتج.",
    primary_button: "اشترِ الآن ←",
    secondary_button: "+ أضف للسلة",
  },
  editorial: {
    about_title:"مش مجرد بطانية... دي مساحة للإبداع!",
    about_body:"بطانية تلوين DoCloroo بمقاس 130 × 150 سم، فيها رسومات أبيض وأسود وتفاصيل متنوعة. اختار من 3 تصميمات، ومع كل بطانية علبة ألوان علشان تبدأ التلوين.",
    markers_title:"كل بطانية ومعاها علبة ألوان!",
    markers_body:"مش محتاج تختار الألوان كإضافة منفصلة؛ كل بطانية في طلبك معها علبة ألوان مستقلة، والسعر الموضح للمنتج شامل الاتنين.",
    howto_intro:"هنعرض تعليمات الغسيل والكي النهائية بالتفصيل بعد تأكيدها من المنتج.",
    closing_title:"ابدأ تجربة التلوين مع DoCloroo",
    closing_body:"بطانية 130 × 150 سم والأقلام مرفقة. اختار التصميمات والكمية، وهتشوف الإجمالي والخصم المعتمد من المتجر قبل الشراء.",
  },
  faq: [
    {question:"مقاس بطانية DoCloroo كام؟",answer:"مقاس البطانية 130 × 150 سم."},
    {question:"هل الأقلام بتيجي مع البطانية؟",answer:"أيوه، الأقلام مرفقة مع كل بطانية."},
    {question:"هل ممكن أختار أكثر من رسمة في نفس الطلب؟",answer:"أيوه، تقدر تختار تصميمات مختلفة، والخصم بيتحسب على إجمالي عدد البطاطين في السلة."},
    {question:"إمتى ينفع أغسل الألوان وأبدأ من جديد؟",answer:"يمكن غسل الألوان وإعادة التلوين قبل التثبيت بالكي، وفق تعليمات المنتج."},
    {question:"إيه طريقة الدفع؟",answer:"الدفع عند الاستلام فقط حاليًا."},
  ],
  sections: SECTION_IDS.map(id => ({id,enabled:true})),
}
export function parseHome(value: unknown): SiteyfyHome {
  const result = homeSchema.safeParse(value)
  if(!result.success)return DEFAULT_HOME
  const data=result.data
  if(data.editorial?.markers_body==="مش محتاج تختار الألوان كإضافة منفصلة؛ كل بطانية في طلبك معها علبة ألوان مستقلة، والسعر 899 جنيه شامل الاتنين.")data.editorial.markers_body=DEFAULT_HOME.editorial!.markers_body
  if(data.editorial?.closing_body==="بطانية 130 × 150 سم والأقلام مرفقة. اشترِ قطعتين بخصم 10%، أو 3 قطع وأكثر بخصم 20%.")data.editorial.closing_body=DEFAULT_HOME.editorial!.closing_body
  return data
}
export type HomeRevision = { revision:number; saved_at:string; page:SiteyfyHome }
export type StoredCms = { revision:number; draft:SiteyfyHome; published:SiteyfyHome; history:HomeRevision[] }
export function parseStoredCms(value: unknown): StoredCms {
  if (!value || typeof value!=="object") return {revision:1,draft:DEFAULT_HOME,published:DEFAULT_HOME,history:[]}
  const x = value as Record<string,unknown>
  const revision = typeof x.revision === "number" && Number.isSafeInteger(x.revision) && x.revision>0 ? x.revision : 1
  const history = Array.isArray(x.history) ? x.history.slice(-4).flatMap(item=> {
    if (!item || typeof item!=="object") return []
    const entry = item as Record<string,unknown>
    const validated = homeSchema.safeParse(entry.page)
    return validated.success && typeof entry.revision==="number" && typeof entry.saved_at==="string" ? [{revision:entry.revision,saved_at:entry.saved_at,page:validated.data}] : []
  }) : []
  return {revision,draft:parseHome(x.draft),published:parseHome(x.published),history}
}
export async function loadCms(container: MedusaContainer) {
  const storeService = container.resolve(Modules.STORE)
  const stores = await storeService.listStores({ name: "DoCloroo" })
  if (stores.length !== 1) throw new MedusaError(MedusaError.Types.INVALID_DATA, "Exactly one DoCloroo store must be configured; merchant isolation is not yet enabled")
  const [store] = stores
  return {store, cms:parseStoredCms(store.metadata?.siteyfy_cms)}
}
