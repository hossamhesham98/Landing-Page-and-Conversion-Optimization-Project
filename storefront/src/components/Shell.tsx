"use client";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useShop } from "./StoreProvider";
import { formatEGP } from "@/lib/shop";
import type {CartLine,Totals} from "@/lib/commerce";
import {useContent} from "./ContentProvider";
import { useEffect } from "react";

export function Header() {
  const { totals, setDrawer } = useShop();
  const content=useContent();
  const count = totals.count;
  const pathname = usePathname();
  return <>
    <div className="topbar">{content.global?.topbar??"🎨 بطانية تلوين + علبة ألوان مع كل قطعة — اختار رسوماتك المفضلة!"}</div>
    <header className="navbar"><div className="container navrow">
      <Link aria-label="DoCloroo — الرئيسية" href="/" className="brand"><Image src="/assets/docloroo-logo.png" alt="DoCloroo" width={173} height={60} priority style={{objectFit:'contain'}}/></Link>
      <nav className="navlinks" aria-label="روابط الموقع">
        <Link href="/#product">البطانية</Link><Link href="/#about-video">اعرف أكثر</Link><Link href="/#reviews">آراء العملاء</Link><Link href="/#markers">علبة الألوان</Link><Link href="/#how-it-works">طريقة الاستخدام</Link><Link href="/#faq">الأسئلة الشائعة</Link>
      </nav>
      <div className="nav-actions">
        <Link className="iconbtn" aria-label="حسابي" title="حسابي" href="/account"><svg fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><circle cx="12" cy="7.4" r="3.8"/><path d="M4.5 20c.5-4 3.3-6.1 7.5-6.1s7 2.1 7.5 6.1"/></svg></Link>
        <button className="iconbtn" aria-label="السلة" title="السلة" type="button" onClick={() => setDrawer(true)}><svg fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="m3 4 2 1.5 2.7 11h10l2.1-8H6"/><circle cx="9" cy="20" r="1"/><circle cx="18" cy="20" r="1"/></svg><span className="bag-count">{count}</span></button>
      </div>
    </div></header>
  </>;
}
export function Footer() {
  const content=useContent();
  return <footer><div className="container"><div className="footer-row"><Image alt="DoCloroo" src="/assets/docloroo-logo.png" width={165} height={60} style={{objectFit:'contain'}}/><p>{content.global?.footer??"بطانية تلوين، 3 رسمات، وألوان كتير تحكي بيها قصتك"}</p></div><div className="foot-bottom"><span>© DoCloroo</span><span className="footer-links-v6"><Link href="/privacy">سياسة الخصوصية</Link><Link href="/terms">الشروط والأحكام</Link><Link href="/account">حسابي</Link></span></div></div></footer>;
}
export function OrderItems({lines}:{lines:CartLine[]}){
 return <>{lines.map(line=><div className="v7-item" key={line.lineId}>{line.image&&<img src={line.image} alt={line.name} width={70} height={62}/>}<div className="v7-item-main"><b>{line.name} × {line.qty}</b><small>بطانية تلوين DoCloroo + {line.qty} علبة ألوان</small></div><b>{formatEGP(line.total)}</b></div>)}</>
}
export function Bill({totals:t,checkout=false}:{totals:Totals;checkout?:boolean}){
 return <div className="v7-bill"><div className="v7-bill-row"><span>المنتجات ({t.count})</span><strong>{formatEGP(t.subtotal)}</strong></div>{t.discount>0&&<div className="v7-bill-row saving"><span>خصم الكمية</span><strong>− {formatEGP(t.discount)}</strong></div>}{checkout&&<div className="v7-bill-row"><span>الشحن للطلب كله</span><strong>{formatEGP(t.shipping)}</strong></div>}<div className="v7-bill-row final"><span>{checkout?"الإجمالي للدفع عند الاستلام":"إجمالي المنتجات"}</span><strong>{formatEGP(checkout?t.grandTotal:t.productsTotal)}</strong></div></div>
}
export function CartDrawer() {
  const { cart, totals:t, drawer, setDrawer, updateCart, removeCart, notify, busy } = useShop();

  useEffect(() => { document.body.style.overflow = drawer ? "hidden" : ""; return () => { document.body.style.overflow = ""; }; }, [drawer]);
  useEffect(() => { if (!drawer) return; const listener = (ev: KeyboardEvent) => { if (ev.key === "Escape") setDrawer(false); }; window.addEventListener("keydown", listener); return () => window.removeEventListener("keydown", listener); }, [drawer, setDrawer]);
  if (!drawer) return null;
  return <><div className="v7-overlay" onClick={() => setDrawer(false)} aria-hidden="true"/>
    <aside className="v7-drawer" aria-label="سلة المشتريات" role="dialog" aria-modal="true">
      <div className="drawer-head"><h2>سلة المشتريات <small>({t.count})</small></h2><button className="xbtn" onClick={() => setDrawer(false)} aria-label="إغلاق السلة">×</button></div>
      <div className="drawer-body">
        {!cart.length ? <div className="v7-empty"><div style={{fontSize:42}}>🛍️</div><h3>السلة لسه فاضية</h3><p>اختار رسمة البطانية اللي تعجبك وابدأ!</p><button className="btn btn-outline" onClick={() => setDrawer(false)}>متابعة التسوق</button></div> : <>
          {cart.map(line => {const v={name:line.name,image:line.image};return <div className="cart-line" key={line.id}><img src={v.image} alt={v.name} width={80} height={78}/><div><div className="cart-name">بطانية {v.name}</div><div className="cart-price">كل بطانية + علبة ألوان • {formatEGP(line.price)}</div><div className="cart-actions"><div className="small-qty"><button disabled={busy} onClick={() => void updateCart(line.id,-1)} aria-label={`تقليل ${v.name}`}>−</button><strong>{line.qty}</strong><button disabled={busy} onClick={() => void updateCart(line.id,1)} aria-label={`زيادة ${v.name}`}>+</button></div><button className="remove" disabled={busy} onClick={() => void removeCart(line.id)}>حذف</button></div></div></div>})}
        </>}
      </div>
      {cart.length > 0 && <div className="drawer-footer">{t.discount > 0 && <div className="cart-savings">🎉 وفّرت {formatEGP(t.discount)} بخصم الكمية</div>}<Bill totals={t}/><Link onClick={() => setDrawer(false)} className="btn btn-primary btn-full" style={{marginTop:14}} href="/checkout">إتمام الطلب ←</Link><button className="btn btn-outline btn-full" style={{marginTop:8}} onClick={() => {setDrawer(false);notify('تقدر تضيف رسومات تانية من الصفحة الرئيسية')}}>متابعة التسوق</button></div>}
    </aside>
  </>;
}

