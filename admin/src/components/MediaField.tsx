"use client"
import {useState} from "react"
import {adminFetch} from "./Data"
export function MediaField({label,value,onChange,video=false}:{label:string;value:string;onChange:(value:string)=>void;video?:boolean}){
 const [library,setLibrary]=useState<{id:string;url:string;name:string;mime:string}[]>([]);const [busy,setBusy]=useState(false),[error,setError]=useState("")
 async function upload(file:File|undefined){if(!file)return;setBusy(true);setError("");try{
  const data=new FormData();data.set("files",file)
  const result=await adminFetch<{files:{url:string}[]}>("uploads",{method:"POST",body:data})
  if(!result.files?.[0]?.url)throw new Error("Medusa did not return a saved media URL")
  onChange(result.files[0].url)
 }catch(e){setError(e instanceof Error?e.message:String(e))}finally{setBusy(false)}}
 async function browse(){try{const r=await adminFetch<{media:typeof library}>("siteyfy/media");setLibrary(r.media)}catch(e){setError(String(e))}}
 return <div className="form-group"><label>{label}</label><input value={value} maxLength={2000} onChange={e=>onChange(e.target.value)} aria-label={`${label} URL`}/><input type="file" disabled={busy} accept={video?"video/mp4,video/webm":"image/png,image/jpeg,image/webp"} aria-label={`Upload ${label}`} onChange={e=>void upload(e.target.files?.[0])}/><button type="button" className="btn btn-outline" onClick={()=>void browse()}>Choose from media library</button>{library.length>0&&<select aria-label={`Library ${label}`} value="" onChange={e=>{if(e.target.value)onChange(e.target.value)}}><option value="">Choose saved media</option>{library.filter(m=>video?m.mime.startsWith("video/"):m.mime.startsWith("image/")).map(m=><option key={m.id} value={m.url}>{m.name}</option>)}</select>}{busy&&<small>Uploading to Medusa…</small>}{error&&<small role="alert" className="error-box">{error}</small>}{value&&(video?<video src={value} controls preload="metadata" style={{maxWidth:"100%",maxHeight:180}}/>:<img src={value} alt={label} style={{maxWidth:"100%",maxHeight:180,objectFit:"contain"}}/>)}</div>
}
