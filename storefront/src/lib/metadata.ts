import type {Metadata} from "next"
import {loadPublishedHome,type SiteyfyPage} from "./siteyfy-content"
export async function pageMetadata(key?:keyof NonNullable<SiteyfyPage["pages"]>):Promise<Metadata>{
 const {page}=await loadPublishedHome(),copy=key?page.pages?.[key]:undefined
 return {title:copy?.seo?.title||page.global?.seo_title||"DoCloroo | بطانية تلوين مع علبة ألوان",description:copy?.seo?.description||page.global?.seo_description||"بطانية تلوين DoCloroo بمقاس 130 × 150 سم، ومع كل بطانية علبة ألوان.",robots:{index:process.env.DOCLOROO_PRODUCTION_LAUNCH_APPROVED==="true",follow:process.env.DOCLOROO_PRODUCTION_LAUNCH_APPROVED==="true"}}
}
