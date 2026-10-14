"use client"
import {PageContentSections} from "./PageContentSections"
import {useContent} from "./ContentProvider"
import Link from "next/link"
export {CheckoutPage,SuccessPage,LoginPage,AccountPage,TrackingPage} from "./CustomerPages"
function Crumb({label}:{label:string}){return <div className="v7-crumblinks"><Link href="/">الرئيسية</Link> › {label}</div>}
function Title({tag,title,subtitle}:{tag:string;title:string;subtitle?:string}){return <><span className="kicker">{tag}</span><h1 className="v7-page-title">{title}</h1>{subtitle&&<p className="v7-muted">{subtitle}</p>}</>}
export function LegalPage({kind}:{kind:'privacy'|'terms'}){
 const copy=useContent().pages?.[kind];
 if(copy)return <main className="v7-router-page"><div className="v7-page-inner v7-center"><Crumb label={copy.title}/><Title tag="معلومات مهمة" title={copy.title} subtitle={copy.intro}/><div className="v7-panel v7-legal"><PageContentSections blocks={copy.blocks}/></div></div></main>;
 return <main className="v7-router-page"><div className="v7-page-inner v7-center"><Crumb label={kind==='privacy'?'سياسة الخصوصية':'الشروط والأحكام'}/><Title tag="معلومات مهمة" title={kind==='privacy'?'سياسة الخصوصية':'الشروط والأحكام'} subtitle="المحتوى التالي مسودة للتصميم فقط ويحتاج مراجعة واعتماد قبل إطلاق المتجر."/><div className="v7-panel v7-legal"><div className="v7-safe">هذه الصفحة ليست سياسة منشورة أو معتمدة قانونيًا حتى الآن.</div>{kind==='privacy'?<><h2>البيانات المطلوبة للطلب</h2><p>سيحتاج المتجر عند الإطلاق إلى الاسم ورقم الهاتف والبريد الإلكتروني وعنوان التوصيل لمعالجة طلبات العملاء. يجب تحديد جهة التحكم في البيانات ومدة الاحتفاظ والحقوق ووسائل التواصل بعد مراجعة السياسة النهائية.</p><h2>تسجيل الدخول</h2><p>مخطط أن يتم تسجيل الدخول إلى حساب العميل بواسطة كود تحقق يرسل إلى بريده الإلكتروني.</p><h2>التواصل</h2><p>بيانات التواصل الرسمية لم تعتمد بعد.</p></>:<><h2>المنتج والدفع</h2><p>بطانية تلوين DoCloroo بمقاس 130×150 سم، تشمل علبة ألوان مع كل بطانية، والدفع عند الاستلام. أسعار وخصومات المنتجات موضحة في المتجر.</p><h2>الطلب والسياسات</h2><p>سيتم اعتماد شروط الاستبدال والاسترجاع، والأحكام التفصيلية قبل الإطلاق. المعلومات الحالية ليست تعهدًا نهائيًا.</p><h2>تعديل أو إلغاء الطلب</h2><p>تتوقف إجراءات الإلغاء على حالة الطلب؛ وبعد الشحن يحتاج الطلب لمراجعة تشغيلية.</p></>}</div></div></main>;
}

