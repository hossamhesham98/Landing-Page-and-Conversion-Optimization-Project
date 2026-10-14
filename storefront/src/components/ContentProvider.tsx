"use client"
import {createContext,useContext,useEffect,useState} from "react"
import {usePathname,useSearchParams} from "next/navigation"
import {fallbackPage,type SiteyfyPage} from "@/lib/siteyfy-content"
const Content=createContext<SiteyfyPage>(fallbackPage)
export function useContent(){return useContext(Content)}
export default function ContentProvider({initial,children}:{initial:SiteyfyPage;children:React.ReactNode}){
 const [content,setContent]=useState(initial),pathname=usePathname(),search=useSearchParams(),preview=search.get("preview")
 useEffect(()=>{let active=true;fetch(`/api/content${preview?`?preview=${encodeURIComponent(preview)}`:""}`,{cache:"no-store"}).then(r=>{if(!r.ok)throw new Error();return r.json()}).then(r=>{if(active)setContent(r.page)}).catch(()=>{});return()=>{active=false}},[pathname,preview])
 useEffect(()=>{if(content.global?.font)document.body.style.fontFamily=`'${content.global.font}','Segoe UI',Tahoma,Arial,sans-serif`},[content.global?.font])
 return <Content.Provider value={content}>{children}</Content.Provider>
}
