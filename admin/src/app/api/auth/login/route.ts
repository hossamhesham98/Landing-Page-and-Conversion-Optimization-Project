import { NextRequest, NextResponse } from "next/server"
import { medusaUrl,sessionCookieName,validateAdminToken } from "@/lib/server"
import {sameOrigin} from "@/lib/security"
export const runtime="nodejs"
export async function POST(req:NextRequest){
 if(!sameOrigin(req.headers.get("origin"), req.headers.get("host")))return NextResponse.json({error:"Invalid request origin"},{status:403})
 let input:unknown
 try{input=await req.json()}catch{return NextResponse.json({error:"Invalid JSON"},{status:400})}
 if(!input||typeof input!=="object")return NextResponse.json({error:"Invalid credentials"},{status:400})
 const {email,password}=input as Record<string,unknown>
 if(typeof email!=="string"||typeof password!=="string"||email.length>254||password.length>512||!email.includes("@")||!password)return NextResponse.json({error:"Please enter a valid email and password."},{status:400})
 try{
  const r=await fetch(`${medusaUrl}/auth/user/emailpass`,{method:"POST",headers:{"content-type":"application/json","accept":"application/json"},body:JSON.stringify({email:email.trim(),password}),cache:"no-store",signal:AbortSignal.timeout(15000),redirect:"manual"})
  if(!r.ok)return NextResponse.json({error:"Invalid credentials or admin access unavailable."},{status:401})
  const body=await r.json() as {token?:unknown}
  if(typeof body.token!=="string"||!await validateAdminToken(body.token))return NextResponse.json({error:"Not authorized as a Medusa administrator."},{status:403})
  const response=NextResponse.json({ok:true},{headers:{"cache-control":"no-store"}})
  response.cookies.set(sessionCookieName,body.token,{httpOnly:true,secure:process.env.NODE_ENV==="production"&&process.env.LOCAL_HTTP!=="true",sameSite:"lax",path:"/",maxAge:60*60*2})
  response.cookies.set("siteyfy_store","",{httpOnly:true,sameSite:"lax",path:"/",maxAge:0})
  return response
 }catch{return NextResponse.json({error:"Medusa is unavailable. Verify localhost:9000."},{status:503})}
}
