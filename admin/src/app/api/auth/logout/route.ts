import {NextRequest,NextResponse} from "next/server"
import {sessionCookieName} from "@/lib/server"
import {sameOrigin} from "@/lib/security"
export async function POST(req:NextRequest){
 if(!sameOrigin(req.headers.get("origin"),req.headers.get("host")))return NextResponse.json({error:"Invalid request origin"},{status:403})
 const r=NextResponse.json({ok:true},{headers:{"cache-control":"no-store"}})
 r.cookies.set(sessionCookieName,"",{httpOnly:true,secure:process.env.NODE_ENV==="production"&&process.env.LOCAL_HTTP!=="true",sameSite:"lax",path:"/",maxAge:0})
 r.cookies.set("siteyfy_store","",{httpOnly:true,sameSite:"lax",path:"/",maxAge:0})
 return r
}
