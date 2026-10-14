import {NextRequest,NextResponse} from "next/server"
import {cookies} from "next/headers"
import {getSessionToken,callMedusa} from "@/lib/server"
import {allowedAdminPath,sameOrigin,readResponseCode} from "@/lib/security"
export const runtime="nodejs"
type Params={params:Promise<{path:string[]}>}
async function handle(req:NextRequest,ctx:Params){
 const {path}=await ctx.params
 if(!allowedAdminPath(path))return NextResponse.json({error:"Unsupported admin resource"},{status:404})
 if(req.method!=="GET"&&!sameOrigin(req.headers.get("origin"),req.headers.get("host")))return NextResponse.json({error:"Invalid origin"},{status:403})
 const token=await getSessionToken()
 if(!token)return NextResponse.json({error:"Please sign in to SITEYFY."},{status:401})
 const selected=(await cookies()).get("siteyfy_store")?.value
 if(selected){
  try{const context=await callMedusa("/admin/siteyfy/context",token);if(!context.ok)return NextResponse.json({error:"Workspace access denied"},{status:context.status});const {store}=await context.json();if(store.id!==selected)return NextResponse.json({error:"Unauthorized workspace"},{status:403})}catch{return NextResponse.json({error:"Workspace could not be verified"},{status:502})}
 }
 let body: BodyInit|undefined
 let contentType: string|undefined
 if(req.method!=="GET"){
  const type=req.headers.get("content-type")||""
  if(path.length===1&&path[0]==="uploads"){
   if(!type.startsWith("multipart/form-data"))return NextResponse.json({error:"Multipart required"},{status:415})
   if(Number(req.headers.get("content-length")||0)>25*1024*1024)return NextResponse.json({error:"Maximum upload is 25 MB"},{status:413})
   const input=await req.formData(),file=input.get("files")
   if(!(file instanceof File)||file.size===0||file.size>25*1024*1024)return NextResponse.json({error:"Select one file, up to 25 MB"},{status:400})
   const bytes=new Uint8Array(await file.arrayBuffer())
   const text=(a:number,b:number)=>String.fromCharCode(...bytes.slice(a,b))
   const valid=(file.type==="image/png"&&bytes[0]===137&&text(1,4)==="PNG")||
    (file.type==="image/jpeg"&&bytes[0]===255&&bytes[1]===216&&bytes[2]===255)||
    (file.type==="image/webp"&&text(0,4)==="RIFF"&&text(8,12)==="WEBP")||
    (file.type==="video/mp4"&&text(4,8)==="ftyp")||
    (file.type==="video/webm"&&bytes[0]===26&&bytes[1]===69&&bytes[2]===223&&bytes[3]===163)
   if(!valid)return NextResponse.json({error:"Use a valid PNG, JPEG, WebP, MP4 or WebM file"},{status:415})
   const upload=new FormData();upload.set("files",file,file.name.replace(/[^a-zA-Z0-9_.-]/g,"_"));body=upload
  }else{
   if(!type.startsWith("application/json"))return NextResponse.json({error:"JSON required"},{status:415})
   body=await req.text();contentType="application/json"
   if(body.length>250_000)return NextResponse.json({error:"Request too large"},{status:413})
  }
 }
 try{
  const target=`/admin/${path.join("/")}${req.nextUrl.search}`
  const upstream=await callMedusa(target,token,{method:req.method,body,headers:contentType?{"content-type":contentType}:undefined})
  const content=await upstream.text()
  if(req.method==="POST"&&path.length===1&&path[0]==="uploads"&&upstream.ok&&body instanceof FormData){
   const file=body.get("files") as File,result=JSON.parse(content)
   for(const saved of result.files||[]){const registered=await callMedusa("/admin/siteyfy/media",token,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({file_id:saved.id,url:saved.url,mime:file.type,name:file.name})});if(!registered.ok)return NextResponse.json({error:"File uploaded, but library registration failed. Retry registration before publishing."},{status:502})}
  }
  if(upstream.status===401||upstream.status===403)return NextResponse.json({error:readResponseCode(upstream.status)},{status:upstream.status})
  const response=new NextResponse(upstream.status===204?null:(content||"{}"),{status:upstream.status,headers:{"content-type":upstream.headers.get("content-type")?.includes("json")?"application/json":"text/plain; charset=utf-8","cache-control":"no-store"}})
  return response
 }catch{return NextResponse.json({error:"Could not reach Medusa backend."},{status:502})}
}
export async function GET(req:NextRequest,ctx:Params){return handle(req,ctx)}
export async function POST(req:NextRequest,ctx:Params){return handle(req,ctx)}
