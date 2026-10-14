import type {MedusaRequest,MedusaResponse} from "@medusajs/framework/http"
import {z} from "@medusajs/framework/zod"
import {uploadFilesWorkflow} from "@medusajs/medusa/core-flows"
import {imageContent} from "../../../../lib/media-validation"
import {siteyfyRateLimitWorkflow} from "../../../../workflows/siteyfy/rate-limit"
import {randomUUID} from "node:crypto"
export async function POST(req:MedusaRequest,res:MedusaResponse){
 const input=z.object({mime:z.enum(["image/png","image/jpeg","image/webp"]),content:z.string().max(7*1024*1024)}).strict().parse(req.body)
 imageContent(input.mime,input.content)
 await siteyfyRateLimitWorkflow(req.scope).run({input:{ip:req.ip||"unknown",scope:"review-image"}})
 const ext={"image/png":"png","image/jpeg":"jpg","image/webp":"webp"}[input.mime]
 const {result}=await uploadFilesWorkflow(req.scope).run({input:{files:[{filename:`review-${randomUUID()}.${ext}`,mimeType:input.mime,content:input.content,access:"public"}]}})
 res.status(201).json({url:result[0].url})
}
