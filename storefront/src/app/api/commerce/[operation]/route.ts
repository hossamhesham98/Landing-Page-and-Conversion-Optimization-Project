import {cookies} from "next/headers"
import {NextRequest,NextResponse} from "next/server"
import {emptyCart} from "@/lib/commerce"
export const runtime="nodejs"
const cartCookie="docloroo_cart"
const customerCookie="docloroo_customer"
const number=(v:unknown)=>typeof v==="number"?v:Number(v||0)
async function store(path:string,init?:RequestInit){
 const base=process.env.MEDUSA_INTERNAL_URL,key=process.env.MEDUSA_PUBLISHABLE_KEY
 if(!base||!key)throw new Error("المتجر غير متصل بمحرك التجارة حاليًا")
 const token=(await cookies()).get(customerCookie)?.value
 const r=await fetch(`${base.replace(/\/$/,"")}/store/${path}`,{...init,cache:"no-store",redirect:"error",signal:AbortSignal.timeout(15000),headers:{"x-publishable-api-key":key,"content-type":"application/json",...(token?{authorization:`Bearer ${token}`}:{ }),...init?.headers}})
 const body=await r.json().catch(()=>({}))
 if(!r.ok){const e=new Error(body.message||"تعذر إتمام العملية من Medusa") as Error&{status?:number};e.status=r.status;throw e}
 return body
}
const post=(data:unknown)=>({method:"POST",body:JSON.stringify(data)})
async function context(){const {regions}=await store("regions");const region=regions.find((r:{currency_code:string;countries?:{iso_2:string}[]})=>r.currency_code==="egp"&&r.countries?.some(c=>c.iso_2==="eg"));if(!region)throw new Error("منطقة البيع في مصر غير جاهزة");return region.id as string}
async function catalog(){
 const region=await context()
 const {products}=await store(`products?handle=docloroo-coloring-blanket&region_id=${region}&fields=*variants.calculated_price,+variants.inventory_quantity,+metadata,+variants.metadata,+variants.thumbnail`)
 const product=products?.[0]
 const development=process.env.DOCLOROO_DEVELOPMENT_TEST==="true"&&product?.metadata?.development_test===true
 if(!product||(!development&&(product.metadata?.inventory_pending===true||product.metadata?.design_approval_pending===true||product.metadata?.development_test===true)))return {available:false,variants:[],reason:"البيع غير متاح لحين اعتماد التصميمات والمخزون"}
 const variants=(product.variants||[]).filter((v:any)=>v.metadata?.active!==false).map((v:any)=>({id:String(v.metadata?.design_key||v.id),medusaId:v.id,name:v.title,image:v.thumbnail||v.metadata?.image||product.thumbnail,price:number(v.calculated_price?.calculated_amount),available:v.manage_inventory&&!v.allow_backorder?Math.max(0,number(v.inventory_quantity)):0}))
 return {available:variants.some((v:any)=>v.available>0&&v.price>0),variants,development,title:product.title,description:product.description}
}
function publicCart(cart:any){
 const subtotal=number(cart.item_subtotal),discount=number(cart.item_discount_total),productsTotal=number(cart.item_total),shipping=number(cart.shipping_total)
 const lines=(cart.items||[]).map((i:any)=>({id:String(i.variant?.metadata?.design_key||i.variant_id),lineId:i.id,qty:i.quantity,name:i.variant_title||i.title,image:i.thumbnail||i.variant?.thumbnail||i.variant?.metadata?.image,price:number(i.unit_price),total:number(i.total)}))
 return {lines,totals:{count:lines.reduce((s:number,x:any)=>s+x.qty,0),subtotal,discount,productsTotal,shipping,grandTotal:number(cart.total),rate:subtotal?discount/subtotal:0}}
}
async function cartId(create=false,buy=false,quote:string|false=false){const jar=await cookies(),name=quote?`docloroo_quote_${quote}`:buy?"docloroo_buy_cart":cartCookie;let id=buy&&create?undefined:jar.get(name)?.value;if(id&&!/^cart_[a-zA-Z0-9]+$/.test(id))id=undefined;if(id&&create){const existing=await store(`carts/${id}?fields=+completed_at`);if(existing.cart.completed_at)id=undefined}if(!id&&create){const r=await store("carts",post({region_id:await context()}));id=r.cart.id;jar.set(name,id!,{httpOnly:true,sameSite:"lax",secure:process.env.NODE_ENV==="production"&&process.env.LOCAL_HTTP!=="true",path:"/",maxAge:60*60*24*7})}return id}
async function loadCart(id:string){const {cart}=await store(`carts/${id}?fields=+items.variant.metadata,+items.total,+items.subtotal,+items.discount_total,+completed_at`);return cart.completed_at?emptyCart:publicCart(cart)}
type Context={params:Promise<{operation:string}>}
export async function GET(req:NextRequest,ctx:Context){const {operation}=await ctx.params;try{
 if(operation==="catalog")return NextResponse.json(await catalog(),{headers:{"cache-control":"no-store"}})
 if(operation==="orders")return NextResponse.json(await store("customers/me/docloroo/orders"),{headers:{"cache-control":"no-store"}})
 if(operation==="cart"){const id=await cartId(false,req.nextUrl.searchParams.get("source")==="buy");return NextResponse.json(id?await loadCart(id):emptyCart,{headers:{"cache-control":"no-store"}})}
 return NextResponse.json({message:"المورد غير متاح"},{status:404})
 }catch(e){return failure(e)}}
export async function POST(req:NextRequest,ctx:Context){
 const origin=req.headers.get("origin"),host=req.headers.get("host")
 if(!origin||!host||!sameOrigin(origin,host))return NextResponse.json({message:"طلب من مصدر غير مسموح"},{status:403})
 if(!req.headers.get("content-type")?.startsWith("application/json"))return NextResponse.json({message:"JSON مطلوب"},{status:415})
 const text=await req.text();if(text.length>12000)return NextResponse.json({message:"طلب أكبر من المسموح"},{status:413})
 const {operation}=await ctx.params
 try{
 const data=JSON.parse(text)
 if(operation==="review")return NextResponse.json(await store("siteyfy/reviews",post(data)),{status:201})
 if(operation==="logout"){const jar=await cookies();for(const name of [customerCookie,cartCookie,"docloroo_buy_cart"])jar.delete(name);return NextResponse.json({logged_out:true})}
 if(operation==="track"||operation==="cancel"){
  if(typeof data.id!=="string"||!/^order_[a-zA-Z0-9]+$/.test(data.id))return NextResponse.json({message:"رابط الطلب غير صالح"},{status:400})
  return NextResponse.json(await store(`docloroo/orders/${data.id}/${operation}`,post({token:data.token==="account"?undefined:data.token})),{headers:{"cache-control":"no-store"}})
 }
 if(operation==="request-code")return NextResponse.json(await store("docloroo/auth/request-code",post({email:data.email})))
 if(operation==="verify-code"){
  const result=await store("docloroo/auth/verify-code",post({email:data.email,code:data.code}))
  if(!result.token)throw new Error("لم يتم التحقق من الحساب")
  ;(await cookies()).set(customerCookie,result.token,{httpOnly:true,sameSite:"lax",secure:process.env.NODE_ENV==="production"&&process.env.LOCAL_HTTP!=="true",path:"/",maxAge:60*60})
  return NextResponse.json({authenticated:true})
 }
 if(operation==="add"||operation==="buy"||operation==="quote"){
  const cat=await catalog();if(!cat.available)return NextResponse.json({message:cat.reason||"لا يوجد مخزون معتمد متاح"},{status:409})
  if(!Array.isArray(data.lines)||!data.lines.length||data.lines.length>20)throw new Error("اختار تصميمًا وكمية")
  const items=data.lines.map((line:any)=>{const variant=cat.variants.find((v:any)=>v.id===line.id);if(!variant||!Number.isSafeInteger(line.qty)||line.qty<1||line.qty>99||line.qty>variant.available)throw new Error("الكمية المختارة غير متوفرة");return {variant_id:variant.medusaId,quantity:line.qty}})
  const id=await cartId(true,operation==="buy",operation==="quote"?(["two","three"].includes(data.kind)?data.kind:"selection"):false)
  if(operation==="quote"){
   const {cart}=await store(`carts/${id}`)
   for(const old of cart.items||[]){const desired=items.find((i:any)=>i.variant_id===old.variant_id);if(!desired)await store(`carts/${id}/line-items/${old.id}`,{method:"DELETE"});else if(desired.quantity!==old.quantity)await store(`carts/${id}/line-items/${old.id}`,post({quantity:desired.quantity}))}
   const missing=items.filter((i:any)=>!cart.items?.some((old:any)=>old.variant_id===i.variant_id));if(missing.length)await store(`docloroo/carts/${id}/items`,post({items:missing}))
   await store(`docloroo/carts/${id}/sync`,post({}))
  }else await store(`docloroo/carts/${id}/items`,post({items}))
  return NextResponse.json(await loadCart(id!))
 }
 const id=await cartId(false,(operation==="checkout"||operation==="shipping")&&data.source==="buy");if(!id)return NextResponse.json({message:"السلة فارغة"},{status:400})
 if(operation==="shipping"){await store(`docloroo/carts/${id}/shipping`,post({}));return NextResponse.json(await loadCart(id))}
 if(operation==="update"||operation==="remove"){
  const {cart}=await store(`carts/${id}`),item=cart.items?.find((i:any)=>i.id===data.lineId);if(!item)throw new Error("عنصر السلة غير موجود")
  if(operation==="remove")await store(`carts/${id}/line-items/${item.id}`,{method:"DELETE"})
  else{if(!Number.isSafeInteger(data.qty)||data.qty<1||data.qty>99)throw new Error("راجع الكمية");await store(`carts/${id}/line-items/${item.id}`,post({quantity:data.qty}))}
  await store(`docloroo/carts/${id}/sync`,post({}));return NextResponse.json(await loadCart(id))
 }
 if(operation==="checkout"){
  const {source,...input}=data
  const result=await store(`docloroo/carts/${id}/checkout`,post(input));return NextResponse.json(result)
 }
 return NextResponse.json({message:"العملية غير متاحة"},{status:404})
 }catch(e){return failure(e)}
}
function failure(e:unknown){return NextResponse.json({message:e instanceof Error?e.message:"حدث خطأ"},{status:(e as {status?:number})?.status||502})}
function sameOrigin(origin:string,host:string){try{const parsed=new URL(origin);return parsed.host===host&&["http:","https:"].includes(parsed.protocol)}catch{return false}}
