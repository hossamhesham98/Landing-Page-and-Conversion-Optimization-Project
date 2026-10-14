import {NextResponse} from "next/server"
import {getSessionToken,callMedusa} from "@/lib/server"
export async function GET(){
 const token=await getSessionToken()
 if(!token)return NextResponse.json({authenticated:false},{status:401})
 try{const response=await callMedusa("/admin/users/me",token);if(!response.ok)return NextResponse.json({authenticated:false},{status:401});const {user}=await response.json();return NextResponse.json({authenticated:true,user:{id:user.id,email:user.email,first_name:user.first_name,last_name:user.last_name}},{headers:{"cache-control":"no-store"}})}catch{return NextResponse.json({error:"Medusa unavailable"},{status:502})}
}
