import {NextRequest,NextResponse} from "next/server"
import {cookies} from "next/headers"
import {getSessionToken,callMedusa} from "@/lib/server"
import {sameOrigin} from "@/lib/security"
async function stores(){
 const token=await getSessionToken();if(!token)return null
 const response=await callMedusa("/admin/siteyfy/context",token)
 if(!response.ok)return null
 const {store}=await response.json()
 return [{id:store.id,name:store.name,logo:"/docloroo-logo.png"}]
}
export async function GET(){const allowed=await stores();if(!allowed)return NextResponse.json({error:"Unauthorized workspace"},{status:401});const selected=(await cookies()).get("siteyfy_store")?.value;if(selected&&!allowed.some(s=>s.id===selected))return NextResponse.json({error:"Unauthorized workspace"},{status:403});return NextResponse.json({stores:allowed,selected:selected||allowed[0].id},{headers:{"cache-control":"no-store"}})}
export async function POST(req:NextRequest){
 if(!sameOrigin(req.headers.get("origin"),req.headers.get("host")))return NextResponse.json({error:"Invalid origin"},{status:403})
 const allowed=await stores();if(!allowed)return NextResponse.json({error:"Unauthorized"},{status:401})
 const input=await req.json().catch(()=>null)
 if(!allowed.some(s=>s.id===input?.id))return NextResponse.json({error:"Unauthorized workspace"},{status:403})
 const response=NextResponse.json({selected:input.id});response.cookies.set("siteyfy_store",input.id,{httpOnly:true,sameSite:"lax",secure:process.env.NODE_ENV==="production"&&process.env.LOCAL_HTTP!=="true",path:"/",maxAge:28800});return response
}
