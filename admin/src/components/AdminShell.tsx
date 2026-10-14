"use client"
import Link from "next/link"
import {usePathname,useRouter} from "next/navigation"
import {useEffect,useState} from "react"
import {Icon} from "./Icons"
const nav=[{href:"/dashboard",text:"Overview",icon:"grid"},{href:"/orders",text:"Orders",icon:"bag"},{href:"/products",text:"Products",icon:"box"},{href:"/customers",text:"Customers",icon:"users"},{href:"/promotions",text:"Promotions",icon:"tag"}]
const studio=[{href:"/content",text:"Page Builder",icon:"layers"},{href:"/reviews",text:"Reviews",icon:"tag"},{href:"/settings",text:"Settings",icon:"settings"}]
export function AdminShell({children}:{children:React.ReactNode}){
 const path=usePathname();const router=useRouter()
 const [drawer,setDrawer]=useState(false),[query,setQuery]=useState("")
 const [storeOpen,setStoreOpen]=useState(false),[accountOpen,setAccountOpen]=useState(false),[menuError,setMenuError]=useState("")
 const [session,setSession]=useState<{email:string;first_name?:string;last_name?:string}|null>(null)
 const [workspace,setWorkspace]=useState<{stores:{id:string;name:string;logo:string}[];selected:string}|null>(null)
 useEffect(()=>{fetch("/api/auth/session",{cache:"no-store"}).then(r=>r.json()).then(r=>setSession(r.user||null));fetch("/api/workspace",{cache:"no-store"}).then(async r=>{const data=await r.json();if(!r.ok)throw new Error(data.error);setWorkspace(data)}).catch(e=>setMenuError(e.message))},[])
 useEffect(()=>{const close=(event:MouseEvent)=>{if(!(event.target as HTMLElement).closest(".dropdown-anchor")){setStoreOpen(false);setAccountOpen(false)}};const escape=(event:KeyboardEvent)=>{if(event.key==="Escape"){setStoreOpen(false);setAccountOpen(false)}};document.addEventListener("click",close);document.addEventListener("keydown",escape);return()=>{document.removeEventListener("click",close);document.removeEventListener("keydown",escape)}},[])
 async function selectStore(id:string){const r=await fetch("/api/workspace",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({id})});const data=await r.json();if(!r.ok){setMenuError(data.error);return}setWorkspace(x=>x?{...x,selected:data.selected}:x);setStoreOpen(false);router.refresh()}
 async function logout(){const result=await fetch("/api/auth/logout",{method:"POST"});if(!result.ok){setMenuError("Could not sign out. Please retry.");return}router.replace("/login");router.refresh()}
 function menu(items:typeof nav){return items.map(item=><Link key={item.href} className={`nav-item ${path===item.href||(item.href==="/products"&&path.startsWith("/products/"))?"active":""}`} href={item.href} onClick={()=>setDrawer(false)}><Icon name={item.icon} size={19}/><span>{item.text}</span>{path===item.href&&<span className="nav-indicator"/>}</Link>)}
 return <div className="app-layout">
  {drawer&&<button aria-label="Close navigation" className="mobile-overlay" onClick={()=>setDrawer(false)}/>}
  <aside className={`sidebar ${drawer?"show":""}`}>
    <div className="sidebar-top"><Link href="/dashboard" className="brand-lockup"><span className="brand-icon"><img src="/siteyfy-symbol.png" alt=""/></span><span><strong>SITEYFY</strong><small>DIGITAL SOLUTIONS</small></span></Link><button aria-label="Close menu" className="mobile-close icon-button" onClick={()=>setDrawer(false)}><Icon name="close"/></button></div>
    <div className="dropdown-anchor store-selector"><button className="workspace" aria-label="Select store" aria-expanded={storeOpen} onClick={()=>{setStoreOpen(!storeOpen);setAccountOpen(false)}}><img className="workspace-logo" src="/docloroo-logo.png" alt="DoCloroo"/><div><b>{workspace?.stores.find(s=>s.id===workspace.selected)?.name||"DoCloroo"}</b><small>Commerce workspace</small></div><span className="workspace-chevron">⌄</span></button>{storeOpen&&<div className="account-dropdown" role="menu">{workspace?workspace.stores.map(store=><button role="menuitemradio" aria-checked={workspace.selected===store.id} key={store.id} onClick={()=>void selectStore(store.id)}><img src={store.logo} alt="" width={70}/><span>{store.name}</span>{workspace.selected===store.id&&<b>✓</b>}</button>):<p>{menuError||"Loading authorized stores…"}</p>}</div>}</div>
    <div className="nav-label">WORKSPACE</div><nav className="nav-stack">{menu(nav)}</nav>
    <div className="nav-label second-label">STUDIO</div><nav className="nav-stack">{menu(studio)}</nav>
    <div className="sidebar-bottom"><div className="side-help"><Icon name="spark" size={18}/><span><strong>Your brand. Your platform.</strong><small>Powered by Medusa engine</small></span></div><button className="logout-button" onClick={logout}><Icon name="logout" size={17}/> Sign out</button></div>
  </aside>
  <div className="app-content">
    <header className="topbar"><button className="menu-trigger icon-button" onClick={()=>setDrawer(true)} aria-label="Open menu"><Icon name="menu"/></button><div className="topbar-breadcrumb"><span>SITEYFY</span><Icon name="chevron" size={14}/><b>{path==="/dashboard"?"Dashboard":(path.split("/")[1]||"Dashboard").replace(/^./,x=>x.toUpperCase())}</b></div><form className="search-top" onSubmit={e=>{e.preventDefault();router.push(`/products?q=${encodeURIComponent(query)}`)}}><Icon name="search" size={17}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search products..." aria-label="Search products"/><kbd>↵</kbd></form><div className="topbar-right"><a className="pill-link store-link" href={process.env.NEXT_PUBLIC_STOREFRONT_URL} target="_blank" rel="noopener noreferrer"><Icon name="globe" size={17}/> View store <Icon name="external" size={14}/></a><div className="dropdown-anchor"><button className="top-avatar" aria-label="Account menu" aria-expanded={accountOpen} onClick={()=>{setAccountOpen(!accountOpen);setStoreOpen(false)}}>{(session?.first_name||session?.email||"?").slice(0,1).toUpperCase()}</button>{accountOpen&&<div className="account-dropdown" role="menu">{session?<><strong>{[session.first_name,session.last_name].filter(Boolean).join(" ")||session.email}</strong><small>{session.email}</small><Link role="menuitem" href="/profile" onClick={()=>setAccountOpen(false)}>My Profile</Link><Link role="menuitem" href="/account-settings" onClick={()=>setAccountOpen(false)}>Account Settings</Link><button role="menuitem" onClick={()=>void logout()}>Sign Out</button></>:<p>Loading your Medusa account…</p>}</div>}</div></div></header>
    <main className="main-content">{menuError&&<p className="error-box" role="alert">{menuError}</p>}{children}</main>
  </div>
 </div>
}
