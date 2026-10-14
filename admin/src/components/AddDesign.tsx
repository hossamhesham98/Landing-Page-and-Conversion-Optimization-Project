"use client"
import {useState} from "react"
import {adminFetch} from "./Data"
import {MediaField} from "./MediaField"
export function AddDesign({productId,onSaved}:{productId:string;onSaved:()=>Promise<void>}){
 const [title,setTitle]=useState(""),[sku,setSku]=useState(""),[image,setImage]=useState(""),[price,setPrice]=useState(""),[busy,setBusy]=useState(false),[error,setError]=useState("")
 async function save(e:React.FormEvent){e.preventDefault();setBusy(true);try{await adminFetch("siteyfy/designs",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({product_id:productId,title,sku,image,price:Number(price)})});setTitle("");setSku("");setImage("");setPrice("");await onSaved()}catch(e){setError(String(e))}finally{setBusy(false)}}
 return <details className="panel editor-card"><summary>Add design · no stock assumed</summary><form onSubmit={save}><div className="form-group"><label>Design name</label><input required value={title} onChange={e=>setTitle(e.target.value)}/></div><div className="form-group"><label>Unique SKU</label><input required value={sku} onChange={e=>setSku(e.target.value)}/></div><div className="form-group"><label>EGP price per piece</label><input type="number" min="0.01" step="0.01" required value={price} onChange={e=>setPrice(e.target.value)}/></div><MediaField label="Design image" value={image} onChange={setImage}/>{error&&<div className="error-box" role="alert">{error}</div>}<button className="btn btn-primary" disabled={busy}>Create in Medusa</button></form></details>
}
