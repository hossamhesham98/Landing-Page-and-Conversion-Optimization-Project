import {redirect} from "next/navigation"
import {getSessionToken,validateAdminToken} from "@/lib/server"
import {AdminShell} from "@/components/AdminShell"
export const dynamic="force-dynamic"
export default async function Layout({children}:{children:React.ReactNode}){
 const token=await getSessionToken()
 if(!token||!await validateAdminToken(token))redirect("/login")
 return <AdminShell>{children}</AdminShell>
}
