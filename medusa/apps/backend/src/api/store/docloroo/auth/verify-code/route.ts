import type {MedusaRequest,MedusaResponse} from "@medusajs/framework/http"
import {z} from "@medusajs/framework/zod"
import {mailReady} from "../../../../../lib/docloroo-mail"
import {verifyEmailCodeWorkflow} from "../../../../../workflows/docloroo/email-otp"
export async function POST(req:MedusaRequest,res:MedusaResponse){
  const input=z.object({email:z.email().max(254).transform(x=>x.trim().toLowerCase()),code:z.string().regex(/^\d{6}$/)}).strict().parse(req.body)
  if(!mailReady())return res.status(503).json({code:"MAIL_NOT_CONFIGURED",message:"التحقق بالبريد غير مفعّل حاليًا."})
  const {result}=await verifyEmailCodeWorkflow(req.scope).run({input})
  res.setHeader("Cache-Control","no-store")
  res.json(result)
}
