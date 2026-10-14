import {NextRequest,NextResponse} from "next/server"
export async function POST(req:NextRequest){
 const origin=req.headers.get("origin"),host=req.headers.get("host")
 try{
  if(!origin||new URL(origin).host!==host)return NextResponse.json({message:"مصدر غير مسموح"},{status:403})
  if(Number(req.headers.get("content-length")||0)>6*1024*1024)return NextResponse.json({message:"الحد الأقصى للصورة 5 MB"},{status:413})
  const form=await req.formData(),photo=form.get("photo")
  if(!(photo instanceof File)||photo.size>5*1024*1024||!['image/jpeg','image/png','image/webp'].includes(photo.type))return NextResponse.json({message:"اختار صورة JPG أو PNG أو WebP أقل من 5 MB"},{status:400})
  const base=process.env.MEDUSA_INTERNAL_URL,key=process.env.MEDUSA_PUBLISHABLE_KEY
  if(!base||!key)return NextResponse.json({message:"خدمة الصور غير جاهزة"},{status:503})
  const r=await fetch(`${base}/store/siteyfy/review-image`,{method:"POST",cache:"no-store",headers:{"content-type":"application/json","x-publishable-api-key":key},body:JSON.stringify({mime:photo.type,content:Buffer.from(await photo.arrayBuffer()).toString("base64")}),signal:AbortSignal.timeout(20000)})
  return NextResponse.json(await r.json(),{status:r.status})
 }catch{return NextResponse.json({message:"تعذر حفظ الصورة"},{status:502})}
}
