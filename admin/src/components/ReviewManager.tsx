"use client"
import {useEffect,useState} from "react"
import {adminFetch} from "./Data"
type Review={id:string;display_name:string;rating:number;comment:string;image?:string;status:string}
export function ReviewManager(){
 const [rows,setRows]=useState<Review[]>([]),[error,setError]=useState(""),[busy,setBusy]=useState(false)
 async function load(){try{const r=await adminFetch<{reviews:Review[]}>("siteyfy/reviews");setRows(r.reviews)}catch(e){setError(String(e))}}
 useEffect(()=>{void load()},[])
 async function moderate(id:string,status:"approved"|"rejected"){setBusy(true);setError("");try{await adminFetch("siteyfy/reviews",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({id,status})});await load()}catch(e){setError(String(e))}finally{setBusy(false)}}
 return <div className="page-flow"><div className="page-head"><div><span className="eyebrow">DOCLOROO / REVIEWS</span><h1>Customer reviews</h1><p>New submissions remain pending. Only approved reviews are public.</p></div></div>{error&&<div role="alert" className="error-box">{error}</div>}{rows.length?rows.map(r=><article className="panel editor-card" key={r.id}><h2>{r.display_name} · {r.rating}/5</h2><span className="status neutral">{r.status}</span><p dir="auto">{r.comment}</p>{r.image&&<img src={r.image} alt="Review attachment" style={{maxWidth:250,maxHeight:250}}/>}<div className="action-group"><button className="btn btn-primary" disabled={busy} onClick={()=>void moderate(r.id,"approved")}>Approve</button><button className="btn btn-outline" disabled={busy} onClick={()=>void moderate(r.id,"rejected")}>Reject / unpublish</button></div></article>):<div className="panel empty-state">No reviews submitted.</div>}</div>
}
