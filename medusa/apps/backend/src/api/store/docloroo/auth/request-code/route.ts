import type {MedusaRequest,MedusaResponse} from "@medusajs/framework/http"
import {z} from "@medusajs/framework/zod"
import {mailReady} from "../../../../../lib/docloroo-mail"
import {requestEmailCodeWorkflow} from "../../../../../workflows/docloroo/email-otp"
export async function POST(req:MedusaRequest,res:MedusaResponse){
  const {email}=z.object({email:z.email().max(254).transform(x=>x.trim().toLowerCase())}).strict().parse(req.body)
  if(!mailReady())return res.status(503).json({code:"MAIL_NOT_CONFIGURED",message:"تسجيل الدخول متوقف لحين إعداد مزوّد بريد حقيقي. لم يتم إرسال كود."})
  const {result}=await requestEmailCodeWorkflow(req.scope).run({input:{email,ip:req.ip||"unknown"}})
  res.setHeader("Cache-Control","no-store")
  res.json(result)
}
