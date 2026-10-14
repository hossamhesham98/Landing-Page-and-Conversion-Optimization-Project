// SITEYFY Phase 1 - server fetched, published-only, safe text configuration.
// The default preserves DoCloroo V7 when Medusa or the CMS is not configured.
export type SectionId="about"|"reviews"|"markers"|"howto"|"faq"|"closing"
export type PageCopy={title:string;intro:string;button?:string;blocks:{id:string;title:string;body:string;enabled:boolean;type?:"text"|"image"|"video";media?:string}[];seo?:{title:string;description:string}}
export type CmsBlock={id:string;type:"text"|"image"|"video";title:string;body:string;media?:string;enabled:boolean;after:SectionId}
export type SiteyfyPage={
  blocks?:CmsBlock[];
  pages?:Partial<Record<"checkout"|"success"|"tracking"|"login"|"account"|"privacy"|"terms",PageCopy>>;
  global?:{topbar:string;footer:string;font:"Cairo"|"Tajawal"|"Segoe UI";seo_title:string;seo_description:string};
  theme?:{accent:string;badge:string};
  media?:{markers_image?:string;about_video?:string;about_poster?:string};
  hero:{eyebrow:string;title:string;description:string;primary_button:string;secondary_button:string};
  editorial?:{
    about_title:string;about_body:string;markers_title:string;markers_body:string;
    howto_intro:string;closing_title:string;closing_body:string;
  };
  faq:{question:string;answer:string}[];
  sections:{id:SectionId;enabled:boolean}[];
}
const order:SectionId[]=["about","reviews","markers","howto","faq","closing"]
export function safeMediaUrl(value:string):boolean {
  if(/^\/assets\/[a-zA-Z0-9_./-]+$/.test(value)&&!value.includes(".."))return true
  try{const u=new URL(value);return !u.username&&!u.password&&(u.protocol==="https:"||(u.protocol==="http:"&&["localhost","127.0.0.1"].includes(u.hostname)))}catch{return false}
}
export const fallbackPage:SiteyfyPage={
  hero:{eyebrow:"لوّنها زي ما تحب!",title:"بطانية تلوين DoCloroo",description:"اختار رسمتك المفضلة، وابدأ التلوين بطريقتك. تقدر تغسل الألوان وتكرر التجربة قبل تثبيتها بالكي وفق تعليمات المنتج.",primary_button:"اشترِ الآن ←",secondary_button:"+ أضف للسلة"},
  editorial:{
    about_title:"مش مجرد بطانية... دي مساحة للإبداع!",
    about_body:"بطانية تلوين DoCloroo بمقاس 130 × 150 سم، فيها رسومات أبيض وأسود وتفاصيل متنوعة. اختار من 3 تصميمات، ومع كل بطانية علبة ألوان علشان تبدأ التلوين.",
    markers_title:"كل بطانية ومعاها علبة ألوان!",
    markers_body:"مش محتاج تختار الألوان كإضافة منفصلة؛ كل بطانية في طلبك معها علبة ألوان مستقلة، والسعر الموضح للمنتج شامل الاتنين.",
    howto_intro:"هنعرض تعليمات الغسيل والكي النهائية بالتفصيل بعد تأكيدها من المنتج.",
    closing_title:"ابدأ تجربة التلوين مع DoCloroo",
    closing_body:"بطانية 130 × 150 سم والأقلام مرفقة. اختار التصميمات والكمية، وهتشوف الإجمالي والخصم المعتمد من المتجر قبل الشراء.",
  },
  faq:[
    {question:"مقاس بطانية DoCloroo كام؟",answer:"مقاس البطانية 130 × 150 سم."},
    {question:"هل الأقلام بتيجي مع البطانية؟",answer:"أيوه، الأقلام مرفقة مع البطانية."},
    {question:"هل ممكن أختار أكثر من رسمة في نفس الطلب؟",answer:"أيوه، تقدر تختار تصميمات مختلفة، والخصم بيتحسب على إجمالي عدد البطاطين في السلة."},
    {question:"إمتى ينفع أغسل الألوان وأبدأ من جديد؟",answer:"يمكن غسل الألوان وإعادة التلوين قبل التثبيت بالكي، وفق تعليمات المنتج."},
    {question:"إيه طريقة الدفع؟",answer:"الدفع عند الاستلام فقط حاليًا."},
  ],
  sections:order.map(id=>({id,enabled:true})),
}
export type Proof={sold_count:number|null;reviews:{name:string;stars:number;comment:string;image?:string}[]}
export const emptyProof:Proof={sold_count:null,reviews:[]}
function safePage(value:unknown):SiteyfyPage {
  if(!value||typeof value!=="object")return fallbackPage
  const raw=value as Partial<SiteyfyPage>
  const colors=["#F5E6AD","#F4CAA4","#F4AD9B","#F39192","#F27589","#F25880","#F13677"]
  if(raw.theme&&(!colors.includes(raw.theme.accent)||!colors.includes(raw.theme.badge)))return fallbackPage
  if(raw.media&&Object.values(raw.media).some(v=>typeof v!=="string"||!safeMediaUrl(v)))return fallbackPage
  if(!raw.hero||!Array.isArray(raw.sections)||!Array.isArray(raw.faq))return fallbackPage
  const titleKeys=["eyebrow","title","description","primary_button","secondary_button"] as const
  if(titleKeys.some(key=>typeof raw.hero?.[key]!=="string"||!(raw.hero[key] as string).trim()||(raw.hero[key] as string).length>600))return fallbackPage
  if(raw.editorial){
    const keys=["about_title","about_body","markers_title","markers_body","howto_intro","closing_title","closing_body"] as const
    if(keys.some(k=>typeof raw.editorial?.[k]!=="string"||!raw.editorial[k].trim()||raw.editorial[k].length>800))return fallbackPage
  }
  if(raw.faq.length>16||raw.faq.some(x=>typeof x.question!=="string"||typeof x.answer!=="string"||x.question.length>160||x.answer.length>800))return fallbackPage
  if(raw.sections.length!==order.length||new Set(raw.sections.map(x=>x.id)).size!==order.length||raw.sections.some(x=>!order.includes(x.id)||typeof x.enabled!=="boolean"))return fallbackPage
  return raw as SiteyfyPage
}
export async function loadPublishedHome(previewToken?:string):Promise<{page:SiteyfyPage;proof:Proof;connected:boolean}> {
  const base=process.env.MEDUSA_INTERNAL_URL ?? ""
  if(!base)return {page:fallbackPage,proof:emptyProof,connected:false}
  if(!process.env.MEDUSA_PUBLISHABLE_KEY){
    console.warn("SITEYFY: MEDUSA_PUBLISHABLE_KEY missing. Configure Medusa publishable store key in server-only .env.local; CMS uses safe defaults.")
    return {page:fallbackPage,proof:emptyProof,connected:false}
  }
  try {
    const result=await fetch(`${base.replace(/\/$/,"")}/store/siteyfy/${previewToken?"preview":"home"}`,{
      headers:{"x-publishable-api-key":process.env.MEDUSA_PUBLISHABLE_KEY,...(previewToken?{"x-siteyfy-preview":previewToken}:{})},
      cache:"no-store",signal:AbortSignal.timeout(2500),
    })
    if(!result.ok){
      if(result.status===400||result.status===401) throw new Error(`Medusa rejected Store API credentials (HTTP ${result.status}). Verify publishable key and Sales Channel.`)
      if(result.status===404) throw new Error("SITEYFY CMS API not deployed in the running Medusa container (HTTP 404). Rebuild Medusa only.")
      throw new Error(`SITEYFY CMS returned HTTP ${result.status}`)
    }
    const body=await result.json() as {page?:unknown;proof?:Partial<Proof>}
    const soldCount=body.proof?.sold_count
    const reviews=body.proof?.reviews
    return {page:safePage(body.page),proof:{sold_count:typeof soldCount==="number"&&Number.isSafeInteger(soldCount)&&soldCount>0?soldCount:null,
      reviews:Array.isArray(reviews)?reviews.filter(r=>typeof r.name==="string"&&typeof r.stars==="number"&&r.stars>=1&&r.stars<=5&&typeof r.comment==="string").slice(0,100):[]},connected:true}
  } catch(e) {
    console.error("SITEYFY content unavailable; displaying approved fallback content", e instanceof Error?e.message:"unknown error")
    return {page:fallbackPage,proof:emptyProof,connected:false}
  }
}
