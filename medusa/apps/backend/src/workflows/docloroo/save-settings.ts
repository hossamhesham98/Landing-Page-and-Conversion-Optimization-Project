import { createStep, createWorkflow, StepResponse, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { acquireLockStep, releaseLockStep } from "@medusajs/medusa/core-flows"
import { Modules } from "@medusajs/framework/utils"
import { getSettings } from "../../lib/docloroo"
const doclorooSaveSettings = createStep("docloroo-save-settings", async (input: Record<string, unknown>, { container }) => {
  const { store } = await getSettings(container)
  await container.resolve(Modules.STORE).updateStores(store.id, { metadata: { ...store.metadata, docloroo: input } })
  return new StepResponse({}, { id: store.id, metadata: store.metadata })
}, async (previous, { container }) => {
  if (previous) {const {store}=await getSettings(container);await container.resolve(Modules.STORE).updateStores(previous.id,{metadata:{...store.metadata,docloroo:previous.metadata?.docloroo||null}})}
})
export const doclorooSettingsWorkflow = createWorkflow("docloroo-settings", (input: Record<string, unknown>) => {
  acquireLockStep({key:"siteyfy:docloroo:store",timeout:10,ttl:30})
  const result = doclorooSaveSettings(input)
  releaseLockStep({key:"siteyfy:docloroo:store"})
  return new WorkflowResponse(result)
})
