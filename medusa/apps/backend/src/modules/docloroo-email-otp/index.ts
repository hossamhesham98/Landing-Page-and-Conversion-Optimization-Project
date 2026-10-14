import { ModuleProvider, Modules } from "@medusajs/framework/utils"
import EmailOtpProvider from "./service"
export default ModuleProvider(Modules.AUTH,{services:[EmailOtpProvider]})
