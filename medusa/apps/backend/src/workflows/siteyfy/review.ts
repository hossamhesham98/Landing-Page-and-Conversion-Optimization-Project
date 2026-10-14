import {createStep,createWorkflow,StepResponse,WorkflowResponse} from "@medusajs/framework/workflows-sdk"
import {ContainerRegistrationKeys,MedusaError,Modules} from "@medusajs/framework/utils"
import {getSettings} from "../../lib/docloroo"
import type SiteyfyModuleService from "../../modules/siteyfy/service"
export type ReviewInput={display_name:string;rating:number;comment:string;image?:string;id?:string;status?:"approved"|"rejected";actor_id?:string}
const saveReview=createStep("save-review",async(input:ReviewInput,{container})=>{
  const {store}=await getSettings(container),service=container.resolve<SiteyfyModuleService>("siteyfy")
  if(input.id){const review=await service.retrieveReview(input.id);if(review.store_id!==store.id||!input.actor_id||!input.status)throw new MedusaError(MedusaError.Types.NOT_ALLOWED,"Review moderation denied")
    return new StepResponse(await service.updateReviews({id:review.id,status:input.status,moderated_by:input.actor_id,moderated_at:new Date()}))}
  const {data:[product]}=await container.resolve(ContainerRegistrationKeys.QUERY).graph({entity:"product",fields:["id"],filters:{handle:"docloroo-coloring-blanket"}})
  if(!product)throw new MedusaError(MedusaError.Types.NOT_FOUND,"DoCloroo product unavailable")
  return new StepResponse(await service.createReviews({store_id:store.id,product_id:product.id,display_name:input.display_name,rating:input.rating,comment:input.comment,image:input.image||null,status:"pending"}))
})
export const siteyfyReviewWorkflow=createWorkflow("siteyfy-review",(input:ReviewInput)=>new WorkflowResponse(saveReview(input)))
