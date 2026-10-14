import {createStep,createWorkflow,StepResponse,WorkflowResponse} from "@medusajs/framework/workflows-sdk"
import {acquireLockStep,releaseLockStep} from "@medusajs/medusa/core-flows"
import {Modules} from "@medusajs/framework/utils"
import {getSettings} from "../../lib/docloroo"
export type SalesBaseline={count:number;through_date:string;source_reference:string}
const saveBaseline=createStep("save-baseline",async(input:SalesBaseline,{container})=>{
 const {store}=await getSettings(container)
 await container.resolve(Modules.STORE).updateStores(store.id,{metadata:{...store.metadata,siteyfy_sales_baseline:input}})
 return new StepResponse({saved:true})
})
export const siteyfySaveBaselineWorkflow=createWorkflow("siteyfy-save-baseline",(input:SalesBaseline)=>{
 acquireLockStep({key:"siteyfy:docloroo:store",timeout:10,ttl:30})
 const result=saveBaseline(input)
 releaseLockStep({key:"siteyfy:docloroo:store"})
 return new WorkflowResponse(result)
})
