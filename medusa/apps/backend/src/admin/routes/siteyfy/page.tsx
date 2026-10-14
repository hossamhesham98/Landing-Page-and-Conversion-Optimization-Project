import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Container, Heading, Button, Input, Label, Text, Textarea } from "@medusajs/ui"
import { useEffect, useState } from "react"
import { sdk } from "../../lib/sdk"

type Section = {id:string;enabled:boolean}
type FAQ = {question:string;answer:string}
type Editorial={about_title:string;about_body:string;markers_title:string;markers_body:string;howto_intro:string;closing_title:string;closing_body:string}
type Page = {hero:{eyebrow:string;title:string;description:string;primary_button:string;secondary_button:string};editorial?:Editorial;faq:FAQ[];sections:Section[]}
const editorialDefaults:Editorial={about_title:"مش مجرد بطانية... دي مساحة للإبداع!",about_body:"بطانية تلوين DoCloroo بمقاس 130 × 150 سم، فيها رسومات أبيض وأسود وتفاصيل متنوعة. اختار من 3 تصميمات، ومع كل بطانية علبة ألوان علشان تبدأ التلوين.",markers_title:"كل بطانية ومعاها علبة ألوان!",markers_body:"مش محتاج تختار الألوان كإضافة منفصلة؛ كل بطانية في طلبك معها علبة ألوان مستقلة، والسعر 899 جنيه شامل الاتنين.",howto_intro:"هنعرض تعليمات الغسيل والكي النهائية بالتفصيل بعد تأكيدها من المنتج.",closing_title:"ابدأ تجربة التلوين مع DoCloroo",closing_body:"بطانية 130 × 150 سم والأقلام مرفقة. اشترِ قطعتين بخصم 10%، أو 3 قطع وأكثر بخصم 20%."}
const editorialLabels:Record<keyof Editorial,string>={about_title:"عنوان وصف المنتج والفيديو",about_body:"فقرة وصف المنتج",markers_title:"عنوان علبة الألوان",markers_body:"وصف علبة الألوان",howto_intro:"وصف خطوات الاستخدام",closing_title:"عنوان الدعوة للشراء",closing_body:"فقرة الدعوة للشراء"}
type CMS = {revision:number;draft:Page;published:Page;history:{revision:number; saved_at:string}[]}
const labels:Record<string,string>={about:"وصف المنتج والفيديو",reviews:"آراء العملاء",markers:"علبة الألوان",howto:"طريقة الاستخدام",faq:"الأسئلة الشائعة",closing:"الدعوة للشراء"}
const Style={color:"#10132F"} as const
const SiteyfyEditor = () => {
  const [cms,setCms]=useState<CMS|null>(null)
  const [draft,setDraft]=useState<Page|null>(null)
  const [busy,setBusy]=useState(false)
  const [message,setMessage]=useState("")
  const hasUnsavedChanges=Boolean(cms&&draft&&JSON.stringify(draft)!==JSON.stringify(cms.draft))
  async function load(){try{const {cms:data}=await sdk.client.fetch<{cms:CMS}>("/admin/siteyfy/home");setCms(data);setDraft({...structuredClone(data.draft), editorial:data.draft.editorial??editorialDefaults})}catch(e){setMessage(String(e))}}
  useEffect(()=>{void load()},[])
  function hero(key:keyof Page["hero"],value:string){setDraft(old=>old?{...old,hero:{...old.hero,[key]:value}}:old)}
  function editCopy(key:keyof Editorial,value:string){setDraft(old=>old?{...old,editorial:{...(old.editorial??editorialDefaults),[key]:value}}:old)}
  function move(index:number,delta:number){setDraft(old=>{if(!old)return old;const sections=old.sections.slice();const dest=index+delta;if(dest<0||dest>=sections.length)return old;[sections[index],sections[dest]]=[sections[dest],sections[index]];return {...old,sections}})}
  async function submit(action:"save"|"publish"|"rollback") {
    if(!cms||!draft)return
    setBusy(true);setMessage("")
    try {
      const payload=action==="save"?{action,revision:cms.revision,draft}:{action,revision:cms.revision}
      const result=await sdk.client.fetch<{cms:CMS}>("/admin/siteyfy/home",{method:"POST",body:payload})
      setCms(result.cms);setDraft(structuredClone(result.cms.draft))
      setMessage(action==="save"?"تم حفظ المسودة، لسه مش منشورة":action==="publish"?"تم النشر، التغييرات تظهر في المتجر بعد التحديث":"تم استرجاع آخر نسخة منشورة")
    }catch(e){setMessage("تعذر الحفظ: "+String(e))}finally{setBusy(false)}
  }
  return <div dir="rtl" style={{padding:"22px",background:"#FFFFFF",color:"#10132F"}}>
    <Container className="mb-5 p-6" style={{background:"linear-gradient(110deg,#3B1BD1 0%,#4A25D7 35%,#8730F1 75%,#9227DE 100%)",color:"white"}}>
      <Heading style={{color:"white",fontSize:"30px"}}>SITEYFY</Heading>
      <Text style={{color:"#F1E8FF"}}>DIGITAL SOLUTIONS · DoCloroo Content Editor</Text>
    </Container>
    <Heading>محرر الصفحة الرئيسية — المرحلة الأولى</Heading>
    <Text className="my-3">المحتوى هنا محفوظ على Medusa. احفظ كمسودة وبعد المراجعة اضغط نشر. لوحة Medusa الحالية هتفضل شغالة زي ما هي.</Text>
    {!draft||!cms?<Text>{message||"جارٍ التحميل..."}</Text>:<div className="flex flex-col gap-4 max-w-3xl">
      <Text>إصدار: {cms.revision} · نسخ سابقة: {cms.history.length}</Text>
      <Heading level="h2">Hero</Heading>
      {([ ["eyebrow","السطر الصغير"], ["title","عنوان الصفحة"], ["description","وصف المنتج"], ["primary_button","زر الشراء"], ["secondary_button","زر إضافة للسلة"] ] as const).map(([key,label])=><label key={key}><Label>{label}</Label>{key==="description"?<Textarea rows={4} value={draft.hero[key]} onChange={e=>hero(key,e.target.value)}/>:<Input value={draft.hero[key]} onChange={e=>hero(key,e.target.value)}/>}</label>)}
      <Heading level="h2">نصوص الأقسام الإضافية</Heading>
      {(Object.keys(editorialLabels) as (keyof Editorial)[]).map(key=><label key={key}><Label>{editorialLabels[key]}</Label>
        <Textarea rows={key.endsWith("body")?3:2} value={(draft.editorial??editorialDefaults)[key]} onChange={e=>editCopy(key,e.target.value)} />
      </label>)}
      <Heading level="h2">ترتيب الأقسام</Heading>
      {draft.sections.map((section,index)=><div key={section.id} className="flex gap-3 items-center border rounded p-3"><strong className="flex-1">{labels[section.id]||section.id}</strong><label><input type="checkbox" checked={section.enabled} onChange={e=>setDraft(old=>old?{...old,sections:old.sections.map(x=>x.id===section.id?{...x,enabled:e.target.checked}:x)}:old)}/> ظاهر</label><Button variant="secondary" onClick={()=>move(index,-1)} disabled={index===0}>↑</Button><Button variant="secondary" onClick={()=>move(index,1)} disabled={index===draft.sections.length-1}>↓</Button></div>)}
      <Heading level="h2">الأسئلة الشائعة</Heading>
      {draft.faq.map((entry,index)=><div className="border rounded p-3 flex flex-col gap-2" key={index}><Label>السؤال {index+1}</Label><Input value={entry.question} onChange={e=>setDraft(old=>old?{...old,faq:old.faq.map((v,i)=>i===index?{...v,question:e.target.value}:v)}:old)}/><Label>الإجابة</Label><Textarea value={entry.answer} onChange={e=>setDraft(old=>old?{...old,faq:old.faq.map((v,i)=>i===index?{...v,answer:e.target.value}:v)}:old)}/><Button variant="secondary" onClick={()=>setDraft(old=>old?{...old,faq:old.faq.filter((_,i)=>i!==index)}:old)}>حذف السؤال</Button></div>)}
      <Button variant="secondary" onClick={()=>setDraft(old=>old?{...old,faq:[...old.faq,{question:"سؤال جديد",answer:"الإجابة هنا"}]}:old)} disabled={draft.faq.length>=16}>إضافة سؤال</Button>
      {hasUnsavedChanges&&<Text style={{color:"#a15407"}}>فيه تعديلات غير محفوظة. احفظ المسودة الأول، وبعدها انشر.</Text>}
      <div className="flex flex-wrap gap-3 mt-4"><Button disabled={busy||!hasUnsavedChanges} onClick={()=>submit("save")}>حفظ كمسودة</Button><Button disabled={busy||hasUnsavedChanges} variant="secondary" onClick={()=>submit("publish")}>نشر المسودة المحفوظة</Button><Button disabled={busy||cms.history.length===0} variant="secondary" onClick={()=>submit("rollback")}>استعادة آخر نسخة منشورة</Button></div>
      <Text style={Style}>{message}</Text>
    </div>}
  </div>
}
export const config=defineRouteConfig({label:"SITEYFY CMS"})
export default SiteyfyEditor
