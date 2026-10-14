import type {MedusaRequest,MedusaResponse} from "@medusajs/framework/http"
import {MedusaError} from "@medusajs/framework/utils"
import {retrieveOrder,trackingToken} from "../../../../../lib/docloroo"
export async function GET(req:MedusaRequest,res:MedusaResponse){
 const order=await retrieveOrder(req.scope,req.params.id)
 if(!(order.metadata?.docloroo as Record<string,unknown>|undefined)?.tracking_nonce)throw new MedusaError(MedusaError.Types.NOT_FOUND,"No secure tracking link was recorded for this order")
 res.setHeader("Cache-Control","no-store")
 res.json({path:`/order/track/${order.id}.${trackingToken(order)}`})
}
