import {createStep,createWorkflow,StepResponse,WorkflowResponse} from "@medusajs/framework/workflows-sdk"
import {ContainerRegistrationKeys,Modules,NotificationStatus} from "@medusajs/framework/utils"
import {getSettings,orderFields,orderStatus,statusLabels,publicOrder} from "../../lib/docloroo"
import {alertSettings,fingerprint,orderSnapshot,stockState,stockAlert,unseenSignal,type AlertSettings} from "../../lib/siteyfy-alert-policy"

const storeLock="siteyfy:docloroo:store"
const templates=["docloroo-admin-order","docloroo-admin-stock"]
type Input={order_id?:string;event?:string;signal?:{key:string;label:string};settings?:{enabled:boolean;recipient:string;low_stock_threshold:number}}

// The native notification table is the durable outbox. A logical event can have
// bounded failed attempts, but an accepted event is never submitted again.
async function deliver(container:any,key:string,template:string,data:any,to:string) {
  return container.resolve(Modules.LOCKING).execute(`siteyfy-alert:${key}`,async()=>{
  const service=container.resolve(Modules.NOTIFICATION)
  const previous=await service.listNotifications({resource_id:key},{take:10,order:{created_at:"DESC"}})
  if(previous.some((x:any)=>x.status===NotificationStatus.SUCCESS))return true
  if(previous.length>=5)return true // Retain exhausted failures for administrator review.
  if(previous.length&&Date.now()-new Date(previous[0].created_at).getTime()<60000*2**previous.length)return true
  try {
    await service.createNotifications({to,channel:"email",template,resource_id:key,resource_type:"siteyfy_admin_alert",trigger_type:data.event,
      idempotency_key:`${key}:attempt:${previous.length+1}`,data})
  }catch {
    // SMTP rejection is persisted by Medusa. Do not log recipient data or secrets.
  }
  return (await service.listNotifications({resource_id:key},{take:1})).length>0
  },{timeout:30})
}

async function config(container:any,input:Input):Promise<AlertSettings> {
  return container.resolve(Modules.LOCKING).execute(storeLock,async()=>{
    const {store}=await getSettings(container)
    const current=alertSettings(store.metadata?.siteyfy_admin_notifications)
    const next={...current,...input.settings}
    if(input.settings||!store.metadata?.siteyfy_admin_notifications)
      await container.resolve(Modules.STORE).updateStores(store.id,{metadata:{...store.metadata,siteyfy_admin_notifications:next}})
    return next
  },{timeout:30})
}

async function checkOrder(container:any,id:string,settings:AlertSettings,event?:string,signal?:Input["signal"]) {
  await container.resolve(Modules.LOCKING).execute(id,async()=>{
    const {data:[order]}=await container.resolve(ContainerRegistrationKeys.QUERY).graph({entity:"order",fields:[...orderFields,"email","shipping_address.*","payment_collections.*","returns.*"],filters:{id}})
    if(!order?.metadata?.docloroo)return
    const previous=order.metadata.siteyfy_admin_alerts as any,status=orderStatus(order),snapshot=orderSnapshot(order,status),hash=fingerprint(snapshot)
    const seenSignals:string[]=previous?.seen_signals||[]
    const freshSignal=unseenSignal(seenSignals,signal)
    if(previous?.fingerprint===hash&&!freshSignal)return
    const version=Number(previous?.version||0)+1
    // Existing orders receive a baseline, never a replay of historical emails.
    const oldOrder=new Date(order.created_at).getTime()<Date.parse(settings.activated_at)
    const baseline=!previous&&oldOrder&&!event
    const label=freshSignal?.label||(!previous?(oldOrder&&event!=="order.placed"?"تحديث الطلب":"طلب جديد"):status!==previous.stage?`تغيير الحالة: ${statusLabels[status]||status}`:snapshot.cancellation_requested_at!==previous.cancellation_requested_at?"طلب إلغاء من العميل":"تحديث بيانات أو تنفيذ أو دفع الطلب")
    if(!baseline&&settings.enabled){
      const address=order.shipping_address||{}
      const key=freshSignal?`siteyfy-order-signal:${fingerprint([id,freshSignal.key])}`:`siteyfy-order:${fingerprint([id,version,hash])}`
      const stored=await deliver(container,key,"docloroo-admin-order",{event:event||"order.reconciled",label,order_id:id,display_id:order.display_id,order:publicOrder(order),status_label:statusLabels[status]||status,
        customer_name:[address.first_name,address.last_name].filter(Boolean).join(" "),customer_email:order.email,customer_phone:address.phone,
        address:[address.province,address.city,address.address_1,address.address_2,address.postal_code].filter(Boolean).join(" / "),
        payment_status:snapshot.payments.map((x:any)=>`${x.status} (محصل: ${x.captured}، مسترد: ${x.refunded})`).join(" / "),
        admin_path:`/orders/${id}`,occurred_at:new Date().toISOString()},settings.recipient)
      if(!stored)throw new Error("Admin notification outbox unavailable")
    }
    const {data:[latest]}=await container.resolve(ContainerRegistrationKeys.QUERY).graph({entity:"order",fields:["id","metadata"],filters:{id}})
    await container.resolve(Modules.ORDER).updateOrders(id,{metadata:{...latest.metadata,siteyfy_admin_alerts:{fingerprint:hash,version,stage:status,cancellation_requested_at:snapshot.cancellation_requested_at,seen_signals:signal?[...new Set([...seenSignals,signal.key])].slice(-50):seenSignals,checked_at:new Date().toISOString()}}})
  },{timeout:30})
}

async function checkStock(container:any,settings:AlertSettings) {
  await container.resolve(Modules.LOCKING).execute(storeLock,async()=>{
    const {store}=await getSettings(container),query=container.resolve(ContainerRegistrationKeys.QUERY)
    // An event waiting for this lock must use the latest threshold and recipient,
    // rather than settings captured before another administrator saved changes.
    settings=alertSettings(store.metadata?.siteyfy_admin_notifications)
    const {data:locations}=await query.graph({entity:"stock_location",fields:["id","name"],filters:{name:"DoCloroo"}})
    const locationIds=new Set(locations.map((x:any)=>x.id))
    if(!locationIds.size)throw new Error("DoCloroo stock location is missing")
    const states={...(store.metadata?.siteyfy_admin_stock as any||{})}
    let skip=0
    do {
      const {data:products}=await query.graph({entity:"product",fields:["id","title","status","metadata","variants.id","variants.title","variants.sku","variants.metadata","variants.manage_inventory","variants.inventory_items.required_quantity","variants.inventory_items.inventory.location_levels.*"],pagination:{skip,take:100}})
      for(const product of products){
        if(product.status!=="published"||product.metadata?.brand!=="DoCloroo")continue
        for(const variant of product.variants||[]){
          if(!variant?.manage_inventory||variant.metadata?.active===false)continue
          const links=variant.inventory_items||[]
          const available=links.length?Math.min(...links.map((link:any)=>Math.max(0,Math.floor((link.inventory?.location_levels||[]).filter((level:any)=>locationIds.has(level.location_id)).reduce((sum:number,level:any)=>sum+Number(level.stocked_quantity)-Number(level.reserved_quantity),0)/Number(link.required_quantity||1))))):0
          const current={available,state:stockState(available,settings.low_stock_threshold)},previous=states[variant.id]
          if(settings.enabled&&stockAlert(previous,current)){
            const version=Number(previous?.version||0)+1,key=`siteyfy-stock:${fingerprint([variant.id,version,current])}`
            const label=current.state==="out"?"نفاد المخزون":current.state==="low"?"نقص المخزون":"عودة المخزون للمستوى الطبيعي"
            const stored=await deliver(container,key,"docloroo-admin-stock",{event:"inventory.changed",label,product:product.title,design:variant.title,sku:variant.sku,available,threshold:settings.low_stock_threshold,admin_path:`/products/${product.id}`,occurred_at:new Date().toISOString()},settings.recipient)
            if(!stored)throw new Error("Stock notification outbox unavailable")
          }
          if(!previous||previous.available!==available||previous.state!==current.state)states[variant.id]={...current,version:Number(previous?.version||0)+1}
        }
      }
      if(products.length<100)break
      skip+=100
    }while(true)
    await container.resolve(Modules.STORE).updateStores(store.id,{metadata:{...store.metadata,siteyfy_admin_stock:states}})
  },{timeout:30})
}

async function retry(container:any) {
  const service=container.resolve(Modules.NOTIFICATION)
  let skip=0
  const keys=new Set<string>()
  do {
    const previous=await service.listNotifications({template:templates,status:NotificationStatus.FAILURE},{take:100,skip,order:{created_at:"DESC"}})
    for(const item of previous){
      if(!item.resource_id||keys.has(item.resource_id))continue
      keys.add(item.resource_id)
      await deliver(container,item.resource_id,item.template,item.data,item.to)
    }
    if(previous.length<100)break
    skip+=100
  }while(true)
}

const synchronize=createStep("synchronize-siteyfy-admin-alerts",async(input:Input,{container})=>{
  const settings=await config(container,input)
  if(input.order_id)await checkOrder(container,input.order_id,settings,input.event,input.signal)
  else {
    let skip=0
    do {
      const {data:orders}=await container.resolve(ContainerRegistrationKeys.QUERY).graph({entity:"order",fields:["id"],pagination:{skip,take:100}})
      for(const order of orders)await checkOrder(container,order.id,settings)
      if(orders.length<100)break
      skip+=100
    }while(true)
  }
  await checkStock(container,settings)
  if(settings.enabled)await retry(container)
  return new StepResponse({settings})
})
export const siteyfyAdminAlertsWorkflow=createWorkflow("siteyfy-admin-alerts",(input:Input)=>new WorkflowResponse(synchronize(input)))
