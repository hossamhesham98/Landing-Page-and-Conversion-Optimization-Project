import type { NextConfig } from "next"
import path from "node:path"
const nextConfig:NextConfig={
  reactStrictMode:true,
  async headers(){return [{source:"/:path*",headers:[{key:"Referrer-Policy",value:"no-referrer"},{key:"X-Content-Type-Options",value:"nosniff"},{key:"Permissions-Policy",value:"camera=(), microphone=(), geolocation=()"}]}]},
  outputFileTracingRoot:path.resolve(process.cwd()),
}
export default nextConfig
