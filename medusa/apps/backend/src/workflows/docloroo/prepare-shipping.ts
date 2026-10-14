import {createWorkflow,WorkflowResponse,transform} from "@medusajs/framework/workflows-sdk"
import {updateCartWorkflow,addShippingMethodToCartWorkflow,useQueryGraphStep,acquireLockStep,releaseLockStep} from "@medusajs/medusa/core-flows"
export const doclorooPrepareShippingWorkflow=createWorkflow("docloroo-prepare-shipping",(input:{cart_id:string})=>{
  // Separate wrapper key: native child workflows release their own cart lock.
  const key=transform(input,x=>`docloroo:cart:${x.cart_id}`)
  acquireLockStep({key,timeout:30,ttl:120})
  const updated=updateCartWorkflow.runAsStep({input:{id:input.cart_id,shipping_address:{country_code:"eg"}}})
  const {data:options}=useQueryGraphStep({entity:"shipping_option",fields:["id"],filters:transform({updated},()=>({name:"DoCloroo COD Egypt"}))})
  const shipping=addShippingMethodToCartWorkflow.runAsStep({input:transform({options,input},x=>({cart_id:x.input.cart_id,options:[{id:x.options[0]?.id}]}))})
  releaseLockStep({key})
  return new WorkflowResponse(shipping)
})
