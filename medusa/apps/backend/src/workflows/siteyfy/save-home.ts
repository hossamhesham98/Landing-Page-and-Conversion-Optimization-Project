import { createStep, createWorkflow, StepResponse, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { MedusaError, Modules } from "@medusajs/framework/utils"
import { acquireLockStep, releaseLockStep } from "@medusajs/medusa/core-flows"
import { loadCms, type SiteyfyHome, type StoredCms } from "../../lib/siteyfy-cms"

export type HomeMutation = {action:"save"|"publish"|"rollback";revision:number;draft?:SiteyfyHome}
export function nextCms(cms:StoredCms,input:HomeMutation):StoredCms {
  if (input.revision !== cms.revision) throw new MedusaError(MedusaError.Types.CONFLICT, "Another administrator changed this page. Refresh before editing.")
  if (input.action === "save") {
    if (!input.draft) throw new MedusaError(MedusaError.Types.INVALID_DATA, "Draft is required")
    return {...cms,draft:input.draft,revision:cms.revision+1}
  }
  if (input.action === "publish") return {revision:cms.revision+1,draft:cms.draft,published:cms.draft,
    history:[...cms.history,{revision:cms.revision,saved_at:new Date().toISOString(),page:cms.published}].slice(-4)}
  const previous = cms.history.at(-1)
  if (!previous) throw new MedusaError(MedusaError.Types.INVALID_DATA, "No earlier published version")
  return {revision:cms.revision+1,draft:previous.page,published:previous.page,history:cms.history.slice(0,-1)}
}
const storeSiteyfyCms = createStep("store-siteyfy-cms", async (input:HomeMutation, {container})=>{
  const {store,cms}=await loadCms(container)
  const next=nextCms(cms,input)
  await container.resolve(Modules.STORE).updateStores(store.id,{metadata:{...store.metadata,siteyfy_cms:next}})
  return new StepResponse(next,{id:store.id,previous:store.metadata?.siteyfy_cms,revision:next.revision})
},async (previous,{container})=>{
  if (!previous) return
  const {store,cms}=await loadCms(container)
  // Restore only our field, never unrelated metadata or a newer revision.
  if (store.id === previous.id && cms.revision === previous.revision)
    await container.resolve(Modules.STORE).updateStores(store.id,{metadata:{...store.metadata,siteyfy_cms:previous.previous ?? null}})
})
export const siteyfySaveHomeWorkflow=createWorkflow("siteyfy-save-home",(input:HomeMutation)=>{
  acquireLockStep({key:"siteyfy:docloroo:store",timeout:10,ttl:30})
  const saved=storeSiteyfyCms(input)
  releaseLockStep({key:"siteyfy:docloroo:store"})
  return new WorkflowResponse(saved)
})
