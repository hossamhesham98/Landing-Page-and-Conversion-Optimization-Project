export type Raw={id?:string;display_id?:number;title?:string;description?:string;handle?:string;status?:string;email?:string;first_name?:string;last_name?:string;code?:string;type?:string;created_at?:string;updated_at?:string;currency_code?:string;total?:number;thumbnail?:string;variants?:Raw[];items?:Raw[];customer?:Raw;collection?:Raw;is_active?:boolean;[key:string]:unknown}
export async function adminFetch<T>(path:string, init?:RequestInit):Promise<T>{
 const res=await fetch(`/api/admin/${path.replace(/^\//,"")}`,{...init,cache:"no-store",headers:{...init?.headers}})
 const body=await res.json().catch(()=>({}))
 if(!res.ok)throw new Error(typeof body.error==="string"?body.error:typeof body.message==="string"?body.message:`HTTP ${res.status}`)
 return body as T
}
export function str(v:unknown):string{return v==null?"—":String(v)}
export function date(v:unknown):string {if(typeof v!=="string")return "—";const d=new Date(v);return Number.isNaN(d.getTime())?"—":new Intl.DateTimeFormat("en-GB",{year:"numeric",month:"short",day:"numeric"}).format(d)}
export function money(v:unknown, currency?:unknown):string {if(typeof v!=="number"||!Number.isFinite(v))return "—";const code=typeof currency==="string"&&currency.length===3?currency.toUpperCase():"EGP";try{return new Intl.NumberFormat("en-EG",{style:"currency",currency:code,maximumFractionDigits:2}).format(v)}catch{return `${v.toFixed(2)} ${code}`}}
export function statusClass(s:unknown):string{const text=String(s||"").toLowerCase();return ["published","completed","active","fulfilled","paid"].includes(text)?"good":["canceled","cancelled","rejected","failed"].includes(text)?"bad":"neutral"}
