import { AbstractNotificationProviderService,MedusaError } from "@medusajs/framework/utils"
import type { ProviderSendNotificationDTO, ProviderSendNotificationResultsDTO } from "@medusajs/framework/types"
import nodemailer from "nodemailer"
import { mailText, requireMail } from "../../lib/docloroo-mail"
import { developmentTestEnabled } from "../../lib/docloroo-launch"
export default class DoclorooSmtpProvider extends AbstractNotificationProviderService {
  static identifier="docloroo-smtp"
  async send(notification:ProviderSendNotificationDTO):Promise<ProviderSendNotificationResultsDTO>{
    requireMail()
    const port=Number(process.env.SMTP_PORT||587)
    const sink=developmentTestEnabled()&&process.env.DOCLOROO_MAIL_SINK==="true"&&["docloroo-mailpit","127.0.0.1","localhost"].includes(process.env.SMTP_HOST||"")
    const transporter=nodemailer.createTransport({host:process.env.SMTP_HOST,port,secure:port===465,requireTLS:!sink,ignoreTLS:sink,
      ...(process.env.SMTP_USER?{auth:{user:process.env.SMTP_USER,pass:process.env.SMTP_PASSWORD}}:{}),
      tls:{rejectUnauthorized:true},connectionTimeout:10000,socketTimeout:15000,logger:false,debug:false})
    try{
      const text=mailText(notification.template,notification.data||{},notification.to)
      const result=await transporter.sendMail({from:process.env.SMTP_FROM,to:notification.to,...text,disableFileAccess:true,disableUrlAccess:true})
      if(!result.messageId||!result.accepted?.length||result.rejected?.length)throw new MedusaError(MedusaError.Types.UNEXPECTED_STATE,"SMTP did not accept the recipient")
      return {id:result.messageId}
    }catch{throw new MedusaError(MedusaError.Types.UNEXPECTED_STATE,"SMTP delivery failed; notification was not sent")}
    finally{transporter.close()}
  }
}
