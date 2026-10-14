import type {MedusaRequest, MedusaResponse} from "@medusajs/framework/http"
import {ContainerRegistrationKeys} from "@medusajs/framework/utils"
import {z} from "@medusajs/framework/zod"
import {getSettings} from "../../../../lib/docloroo"

// Read adapter only: totals, status and items remain native Medusa order data.
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  await getSettings(req.scope)
  const input = z.object({q:z.string().max(150).default(""),status:z.enum(["", "pending", "completed", "canceled", "archived"]).default(""),from:z.iso.date().optional(),to:z.iso.date().optional(),offset:z.coerce.number().int().min(0).default(0),limit:z.coerce.number().int().min(1).max(100).default(15)}).parse(req.query)
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const matching: any[] = []
  let skip = 0
  // Scan before slicing so name/phone search and tie breaking are correct across pages.
  do {
    const {data} = await query.graph({entity:"order",fields:["id","display_id","created_at","email","status","payment_status","currency_code","total","metadata","customer.*","shipping_address.*","items.*"],pagination:{skip,take:100,order:{created_at:"DESC",id:"DESC"}}})
    for (const order of data) {
      if (!order.metadata?.docloroo) continue
      const address = order.shipping_address
      const terms = [order.display_id, order.id, order.email, address?.first_name, address?.last_name, address?.phone, typeof address?.phone==="string"&&address.phone.startsWith("+20")?"0"+address.phone.slice(3):"", order.customer?.email].join(" ").toLowerCase()
      if (input.q && !terms.includes(input.q.toLowerCase())) continue
      if (input.status && order.status !== input.status) continue
      const at = new Date(order.created_at).getTime()
      if (input.from && at < Date.parse(`${input.from}T00:00:00Z`)) continue
      if (input.to && at >= Date.parse(`${input.to}T00:00:00Z`) + 86400000) continue
      matching.push(order)
    }
    if (data.length < 100) break
    skip += 100
  } while (true)
  matching.sort((a,b) => new Date(b.created_at).getTime()-new Date(a.created_at).getTime() || b.id.localeCompare(a.id))
  res.setHeader("Cache-Control","no-store")
  res.json({orders:matching.slice(input.offset,input.offset+input.limit),count:matching.length,offset:input.offset,limit:input.limit})
}
