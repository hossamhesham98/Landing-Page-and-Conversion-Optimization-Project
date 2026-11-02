import type {MedusaContainer} from "@medusajs/framework/types"
import {siteyfyAdminAlertsWorkflow} from "../workflows/siteyfy/admin-alerts"
export default async function reconcileAdminAlerts(container:MedusaContainer) {
  await siteyfyAdminAlertsWorkflow(container).run({input:{}})
}
export const config={name:"siteyfy-admin-alerts",schedule:"* * * * *"}
