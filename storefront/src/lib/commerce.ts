export type CatalogVariant={id:string;medusaId:string;name:string;image:string;price:number;available:number}
export type Catalog={available:boolean;variants:CatalogVariant[];reason?:string;development?:boolean;title?:string;description?:string}
export type CartLine={id:string;qty:number;lineId:string;name:string;image:string;price:number;total:number}
export type Totals={count:number;subtotal:number;discount:number;productsTotal:number;shipping:number;grandTotal:number;rate:number}
export type Cart={lines:CartLine[];totals:Totals}
export const emptyCart:Cart={lines:[],totals:{count:0,subtotal:0,discount:0,productsTotal:0,shipping:0,grandTotal:0,rate:0}}
export async function commerce<T>(operation:string,data?:unknown):Promise<T>{
 const r=await fetch(`/api/commerce/${operation}`,{method:data===undefined?"GET":"POST",credentials:"same-origin",cache:"no-store",headers:data===undefined?{}:{"content-type":"application/json"},body:data===undefined?undefined:JSON.stringify(data)})
 const body=await r.json().catch(()=>({}))
 if(!r.ok)throw new Error(body.message||"تعذر الوصول إلى المتجر. حاول مرة أخرى.")
 return body as T
}
