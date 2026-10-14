import {createStep,createWorkflow,StepResponse,WorkflowResponse} from "@medusajs/framework/workflows-sdk"
import {getSettings} from "../../lib/docloroo"
import type SiteyfyModuleService from "../../modules/siteyfy/service"
const registerMedia=createStep("register-media",async(input:{file_id:string;url:string;mime:string;name:string},{container})=>{
  const {store}=await getSettings(container),service=container.resolve<SiteyfyModuleService>("siteyfy")
  const [existing]=await service.listMediaRecords({store_id:store.id,file_id:input.file_id})
  return new StepResponse(existing||await service.createMediaRecords({...input,store_id:store.id}))
})
export const siteyfyMediaWorkflow=createWorkflow("siteyfy-media",(input:{file_id:string;url:string;mime:string;name:string})=>new WorkflowResponse(registerMedia(input)))
