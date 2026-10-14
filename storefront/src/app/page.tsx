import HomeClient from "@/components/HomeClient"
import { loadPublishedHome } from "@/lib/siteyfy-content"
export const dynamic="force-dynamic"
export default async function HomePage({searchParams}:{searchParams:Promise<{preview?:string}>}){
  const {preview}=await searchParams
  const {page,proof}=await loadPublishedHome(preview)
  return <HomeClient cms={page} proof={proof}/>
}
