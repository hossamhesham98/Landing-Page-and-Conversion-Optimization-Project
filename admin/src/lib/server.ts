import "server-only"
import { cookies } from "next/headers"

export const medusaUrl = (process.env.MEDUSA_URL || "http://127.0.0.1:9000").replace(/\/$/, "")
export const sessionCookieName = process.env.NODE_ENV === "production" && process.env.LOCAL_HTTP !== "true" ? "__Host-siteyfy_session" : "siteyfy_session"
export async function getSessionToken():Promise<string|null>{return (await cookies()).get(sessionCookieName)?.value ?? null}
export async function callMedusa(path:string, token:string, init?:RequestInit):Promise<Response>{
 return fetch(`${medusaUrl}${path}`,{
  ...init,cache:"no-store",redirect:"manual",signal:AbortSignal.timeout(15000),
  headers:{"Authorization":`Bearer ${token}`,"Accept":"application/json",...init?.headers},
 })
}
export async function validateAdminToken(token:string):Promise<boolean>{
 try {
  const r=await callMedusa("/admin/users/me",token)
  return r.ok
 } catch{return false}
}
