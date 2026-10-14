import type {ExecArgs} from "@medusajs/framework/types"
import {ContainerRegistrationKeys,MedusaError,Modules} from "@medusajs/framework/utils"
import {createShippingProfilesWorkflow,createLocationFulfillmentSetWorkflow,createServiceZonesWorkflow,createShippingOptionsWorkflow,updateProductsWorkflow} from "@medusajs/medusa/core-flows"
import initializeStore from "./seed-docloroo"
import prepareDesigns from "./prepare-docloroo-designs"
import prepareTierRules from "./prepare-docloroo-tier-rules"

// Explicit first-server setup only. Never invoked by the container start command.
export default async function initializeProduction(args:ExecArgs){
 if(process.env.NODE_ENV!=="production"||process.env.CONFIRM_INITIALIZE_FRESH_PRODUCTION!=="true")throw new MedusaError(MedusaError.Types.NOT_ALLOWED,"Explicit fresh production confirmation required")
 if(!/^https:\/\//.test(process.env.DOCLOROO_PUBLIC_URL||""))throw new MedusaError(MedusaError.Types.INVALID_DATA,"Configure the real HTTPS storefront URL first")
 const {container}=args,query=container.resolve(ContainerRegistrationKeys.QUERY)
 const {data:orders}=await query.graph({entity:"order",fields:["id"],pagination:{take:1}})
 const customers=await container.resolve(Modules.CUSTOMER).listCustomers({}, {take:1})
 if(orders.length||customers.length)throw new MedusaError(MedusaError.Types.NOT_ALLOWED,"Existing customer/order data found; initialization refused")
 await initializeStore(args)
 await prepareDesigns(args)
 await prepareTierRules(args)
 const fulfillment=container.resolve(Modules.FULFILLMENT)
 const [location]=await container.resolve(Modules.STOCK_LOCATION).listStockLocations({name:"DoCloroo"})
 const {data:[product]}=await query.graph({entity:"product",fields:["id","metadata","shipping_profile.id"],filters:{handle:"docloroo-coloring-blanket"}})
 let [profile]=await fulfillment.listShippingProfiles({name:"DoCloroo Blankets"})
 if(!profile)({result:[profile]}=await createShippingProfilesWorkflow(container).run({input:{data:[{name:"DoCloroo Blankets",type:"default"}]}}))
 if(!product.shipping_profile?.id)await updateProductsWorkflow(container).run({input:{products:[{id:product.id,shipping_profile_id:profile.id}]}})
 let [set]=await fulfillment.listFulfillmentSets({name:"DoCloroo Shipping"})
 if(!set){await createLocationFulfillmentSetWorkflow(container).run({input:{location_id:location.id,fulfillment_set_data:{name:"DoCloroo Shipping",type:"shipping"}}});[set]=await fulfillment.listFulfillmentSets({name:"DoCloroo Shipping"})}
 const {data:[linked]}=await query.graph({entity:"stock_location",fields:["id","fulfillment_providers.id"],filters:{id:location.id}})
 if(!linked.fulfillment_providers?.some(p=>p?.id==="manual_manual"))await container.resolve(ContainerRegistrationKeys.LINK).create({[Modules.STOCK_LOCATION]:{stock_location_id:location.id},[Modules.FULFILLMENT]:{fulfillment_provider_id:"manual_manual"}})
 let [zone]=await fulfillment.listServiceZones({name:"DoCloroo Egypt"})
 if(!zone)({result:[zone]}=await createServiceZonesWorkflow(container).run({input:{data:[{name:"DoCloroo Egypt",fulfillment_set_id:set.id,geo_zones:[{type:"country",country_code:"eg"}]}]}}))
 const [option]=await fulfillment.listShippingOptions({name:"DoCloroo COD Egypt"})
 if(!option)await createShippingOptionsWorkflow(container).run({input:[{name:"DoCloroo COD Egypt",service_zone_id:zone.id,shipping_profile_id:product.shipping_profile?.id||profile.id,provider_id:"manual_manual",price_type:"flat",type:{label:"Cash on delivery",description:"DoCloroo Egypt shipping",code:"docloroo-cod"},prices:[{currency_code:"egp",amount:70}]}]})
 container.resolve(ContainerRegistrationKeys.LOGGER).info("Fresh DoCloroo configuration prepared: three Draft designs, 899 EGP, native 10%/20% quantity rules and 70 EGP COD shipping. No customers, orders or stock quantities created. Enter approved inventory and images before publishing.")
}
