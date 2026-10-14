import { createStep, createWorkflow, StepResponse, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { acquireLockStep, releaseLockStep, cancelOrderWorkflow, cancelOrderFulfillmentWorkflow } from "@medusajs/medusa/core-flows"
import { MedusaError, Modules } from "@medusajs/framework/utils"
import { orderStatus, retrieveOrder, validTrackingToken } from "../../lib/docloroo"
export type OrderAction = { order_id: string; customer_id?: string; token?: string; admin?: boolean; status?: string }
export const authorizeOrder = async (input: OrderAction, container: any) => {
  const order = await retrieveOrder(container, input.order_id)
  if (!order.metadata?.docloroo) throw new MedusaError(MedusaError.Types.NOT_ALLOWED, "This connection manages DoCloroo orders only")
  if (!input.admin && !(input.customer_id && input.customer_id === order.customer_id) && !validTrackingToken(order, input.token)) throw new MedusaError(MedusaError.Types.UNAUTHORIZED, "رابط متابعة غير صالح أو حساب غير مخوّل")
  return order
}
const doclorooCancelOrRequestReview = createStep("docloroo-cancel-or-request-review", async (input: OrderAction, { container }) => {
  const order = await authorizeOrder(input, container)
  const current = orderStatus(order)
  if (current === "cancelled") return new StepResponse({ review: false })
  const dc = (order.metadata?.docloroo || {}) as Record<string, any>
  if (["shipped", "delivered"].includes(current) && dc.cancellation_requested_at) return new StepResponse({ review: true })
  const now = new Date().toISOString()
  const review = ["shipped", "delivered"].includes(current)
  // Retain the request and timestamp even if the operational cancellation fails.
  await container.resolve(Modules.ORDER).updateOrders(order.id, { metadata: { ...order.metadata, docloroo: { ...dc, cancellation_requested_at: now, audit: [...(dc.audit || []), { action: review ? "cancellation_requested" : "cancellation_requested_before_shipping", at: now }] } } })
  if (!review) {
    for (const fulfillment of order.fulfillments || []) {
      if (fulfillment && !fulfillment.canceled_at) await cancelOrderFulfillmentWorkflow(container).run({ input: { order_id: order.id, fulfillment_id: fulfillment.id } })
    }
    await cancelOrderWorkflow(container).run({ input: { order_id: order.id } })
  }
  await container.resolve(Modules.EVENT_BUS).emit({ name: review ? "docloroo.cancellation_requested" : "docloroo.order_cancelled", data: { id: order.id } })
  return new StepResponse({ review })
})
export const doclorooCancelWorkflow = createWorkflow("docloroo-cancel", (input: OrderAction) => {
  acquireLockStep({ key: input.order_id, timeout: 30, ttl: 120 })
  const result = doclorooCancelOrRequestReview(input)
  releaseLockStep({ key: input.order_id })
  return new WorkflowResponse(result)
})
const doclorooSetOrderStatus = createStep("docloroo-set-order-status", async (input: OrderAction, { container }) => {
  const order = await authorizeOrder({ ...input, admin: true }, container)
  if (orderStatus(order) === "cancelled") throw new MedusaError(MedusaError.Types.NOT_ALLOWED, "الطلب ملغي")
  if (!["new", "confirming", "confirmed"].includes(input.status || "")) throw new MedusaError(MedusaError.Types.INVALID_DATA, "الشحن والتسليم يُسجلان من إجراءات Medusa Fulfillment")
  if (["shipped", "delivered"].includes(orderStatus(order))) throw new MedusaError(MedusaError.Types.NOT_ALLOWED, "لا يمكن إرجاع طلب مشحون إلى مرحلة التأكيد")
  const dc = (order.metadata?.docloroo || {}) as Record<string, any>
  await container.resolve(Modules.ORDER).updateOrders(order.id, { metadata: { ...order.metadata, docloroo: { ...dc, status: input.status, audit: [...(dc.audit || []), { action: "status_changed", status: input.status, at: new Date().toISOString() }] } } })
  await container.resolve(Modules.EVENT_BUS).emit({ name: "docloroo.order_status_changed", data: { id: order.id, status: input.status } })
  return new StepResponse()
})
export const doclorooOrderStatusWorkflow = createWorkflow("docloroo-order-status", (input: OrderAction) => {
  acquireLockStep({ key: input.order_id, timeout: 30, ttl: 120 })
  doclorooSetOrderStatus(input)
  releaseLockStep({ key: input.order_id })
  return new WorkflowResponse({})
})
