"use client";
import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useShop } from "./StoreProvider";
import { formatEGP, Line, VARIANTS, VariantId } from "@/lib/shop";
import {commerce,emptyCart,type Cart} from "@/lib/commerce";
import {renderEditorial} from "@/lib/editorial";
import { fallbackPage, type SiteyfyPage, type Proof, type SectionId, type CmsBlock } from "@/lib/siteyfy-content";


type ImageId = VariantId | "markers";
export default function HomeClient({cms,proof}:{cms:SiteyfyPage;proof:Proof}) {
  const router = useRouter();
  const { addLines, notify, buyNow, catalog, busy, error } = useShop();
  const designs=catalog.variants.length?catalog.variants:VARIANTS;
  const images=[...designs,{id:"markers",name:"علبة الألوان",image:cms.media?.markers_image??"/assets/markers-studio.webp"}];
  const [selected, setSelected] = useState<VariantId>("fun");
  const [photo, setPhoto] = useState<ImageId>("fun");
  const [picks, setPicks] = useState<Record<VariantId, number>>({fun:1,garden:0,space:0});
  const [markerRight, setMarkerRight] = useState(0);
  const cardsRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(false);
  const selectedLines: Line[] = designs.filter(v => picks[v.id] > 0).map(v => ({ id: v.id, qty: picks[v.id] }));
  const count=selectedLines.reduce((sum,line)=>sum+line.qty,0);
  const [quote,setQuote]=useState<Cart|null>(null),[offers,setOffers]=useState<{two:Cart;three:Cart}|null>(null),[quoting,setQuoting]=useState(false);
  const quoteQueue=useRef(Promise.resolve());
  const selection=JSON.stringify(selectedLines);
  useEffect(()=>{if(!catalog.available||!catalog.variants[0])return;let active=true;const id=catalog.variants[0].id;quoteQueue.current=quoteQueue.current.then(async()=>{try{const two=await commerce<Cart>("quote",{lines:[{id,qty:2}],kind:"two"});const three=await commerce<Cart>("quote",{lines:[{id,qty:3}],kind:"three"});if(active)setOffers({two,three})}catch{if(active)setOffers(null)}});return()=>{active=false}},[catalog.available,catalog.variants]);
  useEffect(()=>{let active=true;setQuote(null);if(!count){setQuote(emptyCart);return;}if(!catalog.available)return;setQuoting(true);const timer=setTimeout(()=>{quoteQueue.current=quoteQueue.current.then(async()=>{try{const result=await commerce<Cart>("quote",{lines:JSON.parse(selection)});if(active)setQuote(result)}catch(e){if(active)notify(e instanceof Error?e.message:String(e))}finally{if(active)setQuoting(false)}})},350);return()=>{active=false;clearTimeout(timer)}},[selection,catalog.available]);
  const totals=quote?.totals||{...emptyCart.totals,count};
  const firstPrice=catalog.variants[0]?.price;
  const title=cms.hero.title===fallbackPage.hero.title?(catalog.title||cms.hero.title):cms.hero.title;
  useEffect(()=>{if(!catalog.variants.length)return;setPicks(prev=>Object.fromEntries(catalog.variants.map((v,i)=>[v.id,Math.min(prev[v.id]??(i===0?1:0),v.available)])));if(!catalog.variants.some(v=>v.id===selected)){setSelected(catalog.variants[0].id);setPhoto(catalog.variants[0].id)}},[catalog.variants]);
  const image = images.find(v => v.id === photo) ?? images[0];
  const placeMarker = () => {
    const parent = cardsRef.current;
    const active = parent?.querySelector<HTMLElement>(".variant-card.active");
    if (parent && active) setMarkerRight(parent.getBoundingClientRect().right - active.getBoundingClientRect().right + 7);
  };
  useLayoutEffect(placeMarker, [selected]);
  useEffect(() => { window.addEventListener("resize", placeMarker); return () => window.removeEventListener("resize", placeMarker); }, []);
  function choose(id: VariantId) { setSelected(id); setPhoto(id); }
  function change(id: VariantId, delta: number) {
    setPicks(prev => ({...prev,[id]:Math.max(0,Math.min(catalog.variants.find(v=>v.id===id)?.available??0,(prev[id]??0)+delta))})); choose(id);
  }
  async function add() { if(!selectedLines.length){notify("اختار عدد البطاطين الأول");return;} await addLines(selectedLines); }
  async function buy() { if(!selectedLines.length){notify("حدد عدد البطاطين الأول");return;} if(await buyNow(selectedLines))router.push("/checkout?source=buy"); }
  return <main id="top" style={{"--pink":cms.theme?.accent??"#F13677","--pale":cms.theme?.badge??"#F5E6AD"} as React.CSSProperties}>
    <div className="container crumbs">الرئيسية / <span>بطانية تلوين DoCloroo</span></div>
    <section className="container hero-grid" id="product">
      <div className="product-info">
        <p className="eyebrow"><span className="color-dot" aria-hidden="true"/> {cms.hero.eyebrow}</p>
        <h1>{title.endsWith("DoCloroo") ? <>{title.slice(0,-"DoCloroo".length)}<span className="squiggle-under">DoCloroo</span></> : title}</h1>
        <a className="hero-rating" href="#reviews" aria-label="الانتقال لآراء العملاء"><span className="hero-stars" aria-hidden="true">{proof.reviews.length ? "★".repeat(Math.round(proof.reviews.reduce((s,r)=>s+r.stars,0)/proof.reviews.length))+"☆".repeat(5-Math.round(proof.reviews.reduce((s,r)=>s+r.stars,0)/proof.reviews.length)) : ""}</span><span>{proof.reviews.length ? `${(proof.reviews.reduce((s,r)=>s+r.stars,0)/proof.reviews.length).toFixed(1)} (${proof.reviews.length} تقييم)` : "عرض آراء العملاء"}</span></a>
        {proof.sold_count !== null ? <div className="sales-proof"><span className="sales-proof-icon">✦</span>أكثر من {proof.sold_count!.toLocaleString("en-US")} قطعة تم بيعها</div> : null}
        <p className="lede">{cms.hero.description}</p>
        <div className="price-row"><div className="price">{firstPrice!==undefined?formatEGP(firstPrice):"السعر غير متاح"}</div><span className="price-includes">شامل البطانية + علبة ألوان</span></div>
        <div className="mini-perks"><span className="perk">✎ علبة ألوان مع كل بطانية</span><span className="perk">▣ 130 × 150 سم</span><span className="perk">♡ هدية إبداعية</span></div>
        <div className="bundle-mini"><Image unoptimized src={cms.media?.markers_image??"/assets/markers-studio.webp"} width={47} height={63} alt="علبة أقلام مرفقة"/><div><strong>مع كل بطانية علبة ألوان 🎁</strong><span>بتشتري 3 بطاطين؟ هيوصل معاهم 3 علب ألوان، من غير تكلفة إضافية.</span></div></div>
        <div className="form-divider"/>
        <div className="form-header"><div className="form-label">اختار رسوماتك وحدد الكمية 🎨</div><div className="form-helper">{catalog.variants.length} تصميمات{firstPrice!==undefined?` • ${formatEGP(firstPrice)} للقطعة`:""}</div></div>
        <div className="variant-picks" ref={cardsRef}>
          <span className="moving-marker" aria-hidden="true" style={{right:markerRight}}><svg fill="none" viewBox="0 0 52 58"><path d="M5 9C20 1 35 7 39 13C45 20 34 26 39 32C43 37 51 36 46 44C44 49 38 46 39 40C39 36 35 34 34 28C33 17 29 13 18 13" stroke="#F13677" strokeLinecap="round" strokeLinejoin="round" strokeWidth="7"/><path d="M10 6C15 2 23 2 29 6" stroke="#F25880" strokeLinecap="round" strokeWidth="3"/></svg></span>
          {designs.map(v=><div className={`variant-card ${v.id===selected?"active":""} ${picks[v.id]>0?"has-qty":""}`} key={v.id}>
            <button className="variant-hit" type="button" onClick={()=>choose(v.id)} aria-pressed={selected===v.id}><Image unoptimized src={v.image} width={190} height={130} alt={`بطانية ${v.name}`}/><div className="variant-name">{v.name}</div><div className="variant-subline">{"price" in v?formatEGP(v.price):"جاري تحميل السعر"}</div></button>
            <div className="variant-qty-wrap"><div className="qty-stepper"><button type="button" aria-label={`تقليل ${v.name}`} onClick={()=>change(v.id,-1)} disabled={picks[v.id]===0}>−</button><strong>{picks[v.id]??0}</strong><button type="button" aria-label={`زيادة ${v.name}`} onClick={()=>change(v.id,1)} disabled={(picks[v.id]??0)>=(catalog.variants.find(x=>x.id===v.id)?.available??0)}>+</button></div></div>
          </div>)}
        </div>
        <div className="variant-count-summary"><span>إجمالي اللي اخترته: <b>{totals.count} بطانية</b></span><span>ومعاهم <b>{totals.count} علبة ألوان</b></span></div>
        <div className="offer-box">
          <div className="offer-header"><span className="offer-title">✦ اشتري أكتر ووفر</span><span className="offer-hint">الخصم بيتحسب على كل الرسومات مع بعض</span></div>
          {offers&&<div className="deal-grid">{([{key:"two",label:"قطعتين",cart:offers.two},{key:"three",label:"3 قطع أو أكثر",cart:offers.three}] as const).map(offer=><div key={offer.key} className={`deal-card ${offer.key==="three"?"best-deal":""} ${(offer.key==="two"?count===2:count>=3)?"active":""}`}><div className="deal-top"><b>{offer.label}</b><span className="deal-percent">خصم {Math.round(offer.cart.totals.rate*100)}%</span></div><div className="deal-prices"><del>{formatEGP(offer.cart.totals.subtotal)}</del><strong>{formatEGP(offer.cart.totals.productsTotal)}</strong></div><div className="deal-save">وفّر {formatEGP(offer.cart.totals.discount)}</div></div>)}</div>}
          <div className="live-order-total" aria-live="polite">{count===0?<span className="live-order-empty">زود كمية أي رسمة وشوف قيمة التوفير فورًا.</span>:!quote?<p>{quoting?"جاري حساب السعر من Medusa…":"الحساب غير متاح حاليًا"}</p>:<>
            <div className="live-row"><span>سعر {totals.count} بطانية قبل الخصم</span><strong>{formatEGP(totals.subtotal)}</strong></div>
            {totals.discount ? <div className="live-row saved"><span>✦ وفّرت خصم {Math.round(totals.rate*100)}%</span><strong>− {formatEGP(totals.discount)}</strong></div> : <div className="offer-promo-hint">{offers?.two.totals.discount?`ضيف بطانية تانية لتحصل على خصم ${Math.round(offers.two.totals.rate*100)}%.`:"الخصومات المتاحة تظهر حسب إعدادات المتجر."}</div>}
            <div className="live-row final"><span>إجمالي المنتجات بعد الخصم</span><strong>{formatEGP(totals.productsTotal)}</strong></div>
          </>}</div>
        </div>
        <div className="action-stack"><button className="btn btn-primary" onClick={()=>void buy()} disabled={busy||!catalog.available} type="button">{cms.hero.primary_button}</button><button className="btn btn-outline" onClick={()=>void add()} disabled={busy||!catalog.available} type="button">{cms.hero.secondary_button}</button></div>
        {catalog.development&&<p className="v7-safe">بيئة تطوير محلية — المخزون والصور للاختبار، وليست إتاحة تجارية.</p>}{!catalog.available&&<p className="v7-safe" role="status">{catalog.reason||"البيع غير مفعّل قبل اعتماد التصميمات والمخزون"}</p>}{error&&<p role="alert" className="v7-safe">{error}</p>}<div className="cod-note">✓ الدفع عند الاستلام فقط</div>
      </div>
      <div className="media-col"><div aria-hidden="true" className="doodle-deco doodle-deco-star">✳</div><div aria-hidden="true" className="doodle-deco doodle-deco-loop">〰</div>
        <div className="main-photo-wrap"><Image unoptimized src={image.image} alt={photo==="markers"?"علبة الألوان المرفقة":`بطانية ${image.name}`} width={900} height={730} className="main-photo" priority/><div className="photo-tag">✎ رسومات مؤقتة للمعاينة</div><button className="zoom-photo" type="button" onClick={()=>setZoom(true)} aria-label="تكبير صورة البطانية">⌕</button><div className="hero-pack-float"><Image unoptimized src={cms.media?.markers_image??"/assets/markers-studio.webp"} alt="علبة ألوان" width={50} height={68}/><span>+ علبة ألوان<br/>مع كل بطانية</span></div></div>
        <div className="gallery-thumbs">{images.map(x=><button type="button" className={`gallery-thumb ${photo===x.id?'active':''}`} key={x.id} onClick={()=>x.id==='markers'?setPhoto('markers'):choose(x.id as VariantId)}><Image unoptimized src={x.image} alt={x.name} width={140} height={95}/><span>{x.name}</span></button>)}</div>
      </div>
    </section>
    {cms.sections.map(section=><React.Fragment key={section.id}>{section.enabled&&(()=>{
      if(section.id==="reviews")return <Reviews key={section.id} reviews={proof.reviews}/>
      if(section.id==="faq")return <section className="section" id="faq" key="faq"><div className="container faq"><div className="section-heading"><span className="kicker">عندك سؤال؟</span><h2>الأسئلة الشائعة</h2></div>{cms.faq.map((item,index)=><details key={index}><summary>{item.question}</summary><p>{item.answer}</p></details>)}</div></section>
      return <div key={section.id} dangerouslySetInnerHTML={{__html:renderEditorial(section.id,cms)}}/>
    })()}{(cms.blocks||[]).filter(b=>b.enabled&&b.after===section.id).map(b=><ContentBlock key={b.id} block={b}/>)}</React.Fragment>)}
    {zoom ? <div className="v7-overlay" role="presentation" onClick={()=>setZoom(false)} style={{display:'grid',placeItems:'center',zIndex:90,cursor:'zoom-out'}}><Image unoptimized src={image.image} alt={image.name} width={1050} height={850} style={{maxWidth:'94vw',maxHeight:'90vh',objectFit:'contain'}}/></div> : null}
    <div className="mobile-sticky"><div className="mobile-sticky-price"><strong>{quote&&count?formatEGP(totals.productsTotal):firstPrice!==undefined?formatEGP(firstPrice):"جاري تحميل السعر"}</strong><span>{count>1?`${count} بطاطين من اختيارك`:'بطانية + علبة ألوان'}</span></div><button type="button" className="btn btn-primary" onClick={()=>void buy()} disabled={busy||!catalog.available}>اشترِ الآن ←</button></div>
  </main>;
}

function Reviews({reviews}:{reviews:Proof["reviews"]}) {
  const {notify} = useShop();
  const [name,setName] = useState("");const [stars,setStars] = useState(0);const [comment,setComment] = useState("");
  const [photo,setPhoto] = useState<File|null>(null);const [url,setUrl] = useState(""); const [status,setStatus] = useState("");
  useEffect(()=>{if(!photo){setUrl("");return;}const objectURL=URL.createObjectURL(photo);setUrl(objectURL);return()=>URL.revokeObjectURL(objectURL);},[photo]);
  const [sending,setSending]=useState(false);
  async function submit(e:React.FormEvent){e.preventDefault();if(sending)return;if(name.trim().length<2||!stars||comment.trim().length<5){setStatus("راجع الاسم والتقييم والتعليق.");return;}setSending(true);setStatus("");try{let image:string|undefined;if(photo){const data=new FormData();data.set("photo",photo);const r=await fetch("/api/review-image",{method:"POST",body:data});const body=await r.json();if(!r.ok)throw new Error(body.message||"تعذر حفظ الصورة");image=body.url;}const r=await commerce<{id:string;status:string}>("review",{display_name:name.trim(),rating:stars,comment:comment.trim(),...(image?{image}:{})});if(!r.id||r.status!=="pending")throw new Error("لم يؤكد السيرفر حفظ التقييم");setStatus("تم حفظ تقييمك وهو قيد المراجعة قبل النشر.");notify("تم حفظ التقييم للمراجعة");setName("");setStars(0);setComment("");setPhoto(null)}catch(e){setStatus(e instanceof Error?e.message:String(e))}finally{setSending(false)}}
  const average=reviews.length?reviews.reduce((a,b)=>a+b.stars,0)/reviews.length:0;
  return <section className="section reviews-section" id="reviews"><div className="container"><div className="reviews-heading"><div><span className="kicker">♡ كلام من التجربة</span><h2>آراء عملائنا <span aria-hidden="true" className="reviews-star">✳</span></h2><p>هنا هتظهر التقييمات الحقيقية فقط بعد إضافتها واعتمادها.</p></div><div className="review-score"><span aria-hidden="true" className="review-score-stars">{average?'★'.repeat(Math.round(average)):'☆☆☆☆☆'}</span><span>{average?`${average.toFixed(1)} من 5 • ${reviews.length} تقييم`:'مستنيين أول تقييم منشور'}</span></div></div>
    <div className="reviews-layout"><div className="review-list v7-review-list">{reviews.length?reviews.map((r,i)=><article className="review-card" key={i}><strong>{r.name}</strong><div className="review-score-stars">{'★'.repeat(r.stars)}</div><p>{r.comment}</p>{r.image&&<Image unoptimized src={r.image} alt={`صورة تجربة ${r.name}`} width={180} height={180} style={{objectFit:"contain"}}/>}</article>):<><div className="no-reviews"><span aria-hidden="true">✎ ✦ ♡</span><h3>مساحة لآراء عملائنا</h3><p>هنعرض هنا تجارب العملاء الحقيقية من القنوات السابقة أو المراجعات المعتمدة الجديدة، من غير أي تقييمات وهمية.</p></div><div className="reviews-proof-note">المتوسط وعدد التقييمات هيظهروا أعلى المنتج لما تتوفر تقييمات حقيقية معتمدة.</div></>}</div>
      <div className="review-form-card"><div className="review-form-head"><span aria-hidden="true" className="review-form-doodle">✎</span><h3>قولنا رأيك في DoCloroo</h3><p>شارك تجربتك وساعد غيرك يختار رسمة بطانيته.</p></div>
        <form className="v7-review-form" onSubmit={submit}><div className="field"><label htmlFor="rname">اسمك *</label><input id="rname" value={name} onChange={e=>setName(e.target.value)} maxLength={70} placeholder="اكتب اسمك" required/></div>
          <fieldset className="review-stars-field"><legend>تقييمك *</legend><div className="v7-review-stars" role="group" aria-label="تقييمك من نجمة إلى خمس نجوم">{[1,2,3,4,5].map(s=><button className={stars>=s?'active':''} key={s} type="button" aria-label={`${s} نجوم`} aria-pressed={stars===s} onClick={()=>setStars(s)}>★</button>)}</div><span className="star-label">{stars?`${stars} من 5 نجوم`:'اختار عدد النجوم'}</span></fieldset>
          <div className="field"><label htmlFor="rcomment">تعليقك *</label><textarea id="rcomment" rows={4} maxLength={1500} value={comment} onChange={e=>setComment(e.target.value)} placeholder="احكيلنا عن تجربتك مع البطانية..." required/></div>
          <div className="review-file-row"><label className="file-pick" htmlFor="rphoto">▧ أضف صورة لتجربتك <span>(اختياري)</span></label><input id="rphoto" type="file" accept="image/jpeg,image/png,image/webp" onChange={e=>{const file=e.target.files?.[0]??null;if(file&&(file.size>5*1024*1024||!['image/jpeg','image/png','image/webp'].includes(file.type))){setStatus('اختار صورة JPG أو PNG أو WebP أقل من 5MB');e.target.value='';setPhoto(null);return;}setStatus('');setPhoto(file);}}/>{url&&<><Image className="v7-preview-image" src={url} alt="معاينة صورة التقييم" width={115} height={115} unoptimized/><button type="button" onClick={()=>setPhoto(null)}>إزالة الصورة</button></>}<small>JPG / PNG / WebP — بحد أقصى 5 ميجابايت</small></div>
          <div role="status" aria-live="polite" className="review-status">{status}</div><button className="btn btn-primary btn-full" disabled={sending} type="submit">إرسال التقييم ♡</button><p className="review-fineprint">التقييمات والصور تُعرض فقط بعد المراجعة والموافقة عليها.</p>
        </form></div>
    </div></div></section>;
}


function ContentBlock({block}:{block:CmsBlock}){return <section className="section"><div className="container"><h2>{block.title}</h2><p style={{whiteSpace:"pre-wrap"}}>{block.body}</p>{block.media&&block.type==="image"&&<Image unoptimized src={block.media} alt={block.title} width={900} height={600} style={{maxWidth:"100%",height:"auto",objectFit:"contain"}}/>}{block.media&&block.type==="video"&&<video src={block.media} controls playsInline preload="metadata" style={{maxWidth:"100%",maxHeight:720}}/>}</div></section>}
