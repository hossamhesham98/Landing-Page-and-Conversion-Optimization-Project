import { ModuleProvider, Modules } from "@medusajs/framework/utils"
import DoclorooSmtpProvider from "./service"
export default ModuleProvider(Modules.NOTIFICATION,{services:[DoclorooSmtpProvider]})
