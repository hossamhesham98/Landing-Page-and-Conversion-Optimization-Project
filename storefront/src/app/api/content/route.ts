import {NextRequest,NextResponse} from "next/server"
import {loadPublishedHome} from "@/lib/siteyfy-content"
export async function GET(req:NextRequest){const result=await loadPublishedHome(req.nextUrl.searchParams.get("preview")||undefined);return NextResponse.json(result,{headers:{"cache-control":"no-store"}})}
