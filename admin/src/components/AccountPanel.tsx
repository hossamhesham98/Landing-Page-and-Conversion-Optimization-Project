"use client"
import {useEffect,useState} from "react"
export function AccountPanel({settings=false}:{settings?:boolean}){
 const [user,setUser]=useState<{email:string;first_name?:string;last_name?:string}|null>(null),[error,setError]=useState("")
 useEffect(()=>{fetch("/api/auth/session",{cache:"no-store"}).then(async r=>{const data=await r.json();if(!r.ok)throw new Error(data.error||"Your session has expired");setUser(data.user)}).catch(e=>setError(e.message))},[])
 return <div className="page-flow"><h1>{settings?"Account Settings":"My Profile"}</h1><section className="panel editor-card">{error?<p role="alert">{error}</p>:!user?<p>Loading account…</p>:<><h2>{[user.first_name,user.last_name].filter(Boolean).join(" ")||user.email}</h2><p>Email: {user.email}</p><p>Authentication: your existing Medusa administrator account.</p>{settings&&<><p>This account manages the authorized DoCloroo workspace. Account identity is read directly from Medusa.</p><p>Use Sign Out in the account menu to end this browser session.</p></>}</>}</section></div>
}
