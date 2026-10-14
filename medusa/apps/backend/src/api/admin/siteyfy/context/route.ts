import type {MedusaRequest,MedusaResponse} from "@medusajs/framework/http"
import {getSettings} from "../../../../lib/docloroo"
// All currently authenticated Medusa administrators manage this single store.
export async function GET(req:MedusaRequest,res:MedusaResponse){const {store}=await getSettings(req.scope);res.setHeader("Cache-Control","no-store");res.json({store:{id:store.id,name:store.name}})}
