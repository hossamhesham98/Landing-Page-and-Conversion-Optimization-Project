import {randomBytes} from "node:crypto"
import {createStep,createWorkflow,StepResponse,WorkflowResponse,transform,when} from "@medusajs/framework/workflows-sdk"
import {ContainerRegistrationKeys,MedusaError,Modules} from "@medusajs/framework/utils"
import {acquireLockStep,releaseLockStep,updateCartWorkflow,addShippingMethodToCartWorkflow,createPaymentCollectionForCartWorkflow,createPaymentSessionsWorkflow,completeCartWorkflow,useQueryGraphStep} from "@medusajs/medusa/core-flows"
import {doclorooSyncTierWorkflow} from "./sync-tier"
import {assertPurchasable,developmentTestEnabled,checkoutVerified} from "../../lib/docloroo-launch"
export type CodInput={cart_id:string;customer_id?:string;name:string;phone:string;region:string;address?:string;delivery?:{area:string;street:string;building:string;floor?:string;apartment?:string;landmark?:string};email:string;notes?:string}
const prepareCod=createStep("prepare-cod",async(input:CodInput,{container})=>{
  const query=container.resolve(ContainerRegistrationKeys.QUERY)
  const {data:[cart]}=await query.graph({entity:"cart",fields:["id","customer_id","currency_code","completed_at","metadata","items.*","items.product.*","items.variant.*"],filters:{id:input.cart_id}})
  const {data:[existing]}=await query.graph({entity:"order_cart",fields:["order_id"],filters:{cart_id:input.cart_id}})
  if(!cart)throw new MedusaError(MedusaError.Types.NOT_FOUND,"السلة غير موجودة")
  if(!existing){
    const customers=container.resolve(Modules.CUSTOMER)
    for(const id of new Set([cart.customer_id,input.customer_id].filter(Boolean))){
      const customer=await customers.retrieveCustomer(id!)
      if(customer.has_account&&customer.email?.toLowerCase()!==input.email.toLowerCase())throw new MedusaError(MedusaError.Types.INVALID_DATA,"استخدم إيميل حسابك الحالي، أو سجل الخروج وابدأ سلة جديدة للشراء بإيميل آخر")
    }
  }
  if(cart.customer_id&&input.customer_id&&cart.customer_id!==input.customer_id)throw new MedusaError(MedusaError.Types.NOT_ALLOWED,"السلة تخص عميلًا آخر")
  if(!existing&&(!cart.items.length||cart.completed_at||cart.currency_code!=="egp"))throw new MedusaError(MedusaError.Types.INVALID_DATA,"السلة غير صالحة لهذا المتجر")
  if(!existing)for(const item of cart.items){if(!item?.product||item.product.metadata?.brand!=="DoCloroo"||!item.variant)throw new MedusaError(MedusaError.Types.NOT_ALLOWED,"السلة تحتوي منتجًا غير متاح");assertPurchasable(item.product,item.variant)}
  if(!process.env.DOCLOROO_TRACKING_SECRET||process.env.DOCLOROO_TRACKING_SECRET.length<32)throw new MedusaError(MedusaError.Types.UNEXPECTED_STATE,"التتبع الآمن غير جاهز")
  const options=await container.resolve(Modules.FULFILLMENT).listShippingOptions({name:"DoCloroo COD Egypt"})
  if(!existing&&options.length!==1)throw new MedusaError(MedusaError.Types.UNEXPECTED_STATE,"خيار الشحن المعتمد غير جاهز")
  const names=input.name.split(/\s+/),address={first_name:names[0],last_name:names.slice(1).join(" "),country_code:"eg",province:input.region,city:input.delivery?.area||input.region,address_1:input.delivery?.street||input.address!,address_2:input.delivery?[`عمارة ${input.delivery.building}`,input.delivery.floor&&`الدور ${input.delivery.floor}`,input.delivery.apartment&&`شقة ${input.delivery.apartment}`,input.delivery.landmark].filter(Boolean).join("، "):undefined,phone:input.phone,metadata:input.delivery?{docloroo_delivery:input.delivery}:undefined}
  return new StepResponse({existing:existing?.order_id,shipping_option_id:options[0]?.id,
    update:{id:input.cart_id,email:input.email,customer_id:input.customer_id,shipping_address:address,billing_address:address,
      metadata:{...cart.metadata,docloroo:{status:"new",payment_method:"cod",shipping_confirmed:true,development_test:developmentTestEnabled(),notes:input.notes||"",delivery:input.delivery||undefined,tracking_nonce:randomBytes(32).toString("hex"),email_delivery:"not_sent",audit:[{action:"created",at:new Date().toISOString()}]}}}})
})
const doclorooCodPaymentWorkflow=createWorkflow("docloroo-cod-payment",(input:{cart_id:string})=>{
  const {data:cart}=useQueryGraphStep({entity:"cart",fields:["id","customer_id","total","shipping_total","payment_collection.id"],filters:{id:input.cart_id},options:{isList:false}})
  const collection=when("create-cod-collection",cart,c=>!c.payment_collection?.id).then(()=>createPaymentCollectionForCartWorkflow.runAsStep({input:{cart_id:input.cart_id}}))
  const session=createPaymentSessionsWorkflow.runAsStep({input:transform({cart,collection},x=>({payment_collection_id:x.cart.payment_collection?.id||x.collection!.id,provider_id:"pp_system_default",customer_id:x.cart.customer_id||undefined,data:{payment_method:"cod"}}))})
  return new WorkflowResponse(session)
})
export const doclorooNativeCodWorkflow=createWorkflow("docloroo-native-cod",(input:CodInput)=>{
  const key=transform(input,x=>`docloroo:cart:${x.cart_id}`)
  acquireLockStep({key,timeout:30,ttl:120})
  const preparation=prepareCod(input)
  const result=when("new-native-cod",preparation,p=>!p.existing).then(()=>{
    const updated=updateCartWorkflow.runAsStep({input:preparation.update})
    const sync=doclorooSyncTierWorkflow.runAsStep({input:transform({input,updated},x=>({cart_id:x.input.cart_id}))})
    const shipping=addShippingMethodToCartWorkflow.runAsStep({input:transform({input,preparation,sync},x=>({cart_id:x.input.cart_id,options:[{id:x.preparation.shipping_option_id!}]}))})
    const session=doclorooCodPaymentWorkflow.runAsStep({input:transform({input,shipping},x=>({cart_id:x.input.cart_id}))})
    return completeCartWorkflow.runAsStep({input:transform({input,session},x=>({id:x.input.cart_id}))})
  })
  releaseLockStep({key})
  return new WorkflowResponse(transform({preparation,result},x=>({id:x.preparation.existing||x.result!.id})))
})
// Native completion checks payment/stock/reservations; additionally enforce COD amount and shipping.
completeCartWorkflow.hooks.validate(async({cart},{container})=>{
  if(!cart.metadata?.docloroo)return new StepResponse()
  if(!checkoutVerified()&&!(developmentTestEnabled()&&process.env.DOCLOROO_INTERNAL_QA==="true"))throw new MedusaError(MedusaError.Types.NOT_ALLOWED,"Checkout integration verification is still required")
  const {data:[full]}=await container.resolve(ContainerRegistrationKeys.QUERY).graph({entity:"cart",fields:["id","total","shipping_total","shipping_methods.*","payment_collection.amount","payment_collection.payment_sessions.provider_id"],filters:{id:cart.id}})
  if(full.shipping_methods?.length!==1||Number(full.shipping_total)!==Number(full.shipping_methods[0]?.amount)||Number(full.payment_collection?.amount)!==Number(full.total)||full.payment_collection?.payment_sessions?.some(s=>s?.provider_id!=="pp_system_default"))throw new MedusaError(MedusaError.Types.INVALID_DATA,"الشحن أو مبلغ الدفع غير مطابق للسلة")
  return new StepResponse()
})
