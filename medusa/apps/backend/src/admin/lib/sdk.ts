import Medusa from "@medusajs/js-sdk"
export const sdk = new Medusa({ baseUrl: window.location.port === "5173" ? `${window.location.protocol}//${window.location.hostname}:9000` : window.location.origin, auth: { type: "session" } })
