import { loadEnv, defineConfig } from '@medusajs/framework/utils'

loadEnv(process.env.NODE_ENV || 'development', process.cwd())

module.exports = defineConfig({
  admin: { backendUrl: process.env.MEDUSA_BACKEND_URL },
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    databaseDriverOptions: {
      ssl: false,
      sslmode: "disable",
    },
    redisUrl: process.env.REDIS_URL,
    http: {
      storeCors: process.env.STORE_CORS!,
      adminCors: process.env.ADMIN_CORS!,
      authCors: process.env.AUTH_CORS!,
      jwtSecret: process.env.JWT_SECRET,
      cookieSecret: process.env.COOKIE_SECRET,
      authMethodsPerActor: { user: ["emailpass"], customer: ["email-otp"] },
    }
  },
  modules: [
    {resolve:"@medusajs/medusa/file",options:{providers:[{resolve:"@medusajs/medusa/file-local",id:"local",options:{upload_dir:"static",backend_url:`${process.env.MEDUSA_PUBLIC_URL}/static`}}]}},
    {resolve:"./src/modules/siteyfy"},
    ...(process.env.REDIS_URL ? [
      {resolve:"@medusajs/medusa/cache-redis",options:{redisUrl:process.env.REDIS_URL}},
      {resolve:"@medusajs/medusa/event-bus-redis",options:{redisUrl:process.env.REDIS_URL,jobOptions:{attempts:5,backoff:{type:"exponential",delay:5000},removeOnComplete:{age:86400,count:1000},removeOnFail:{age:604800,count:1000}}}},
      {resolve:"@medusajs/medusa/locking",options:{providers:[{resolve:"@medusajs/medusa/locking-redis",id:"locking-redis",is_default:true,options:{redisUrl:process.env.REDIS_URL}}]}},
    ] : []),
    {resolve:"@medusajs/medusa/auth",options:{providers:[{resolve:"@medusajs/medusa/auth-emailpass",id:"emailpass"},{resolve:"./src/modules/docloroo-email-otp",id:"email-otp"}]}},
    {resolve:"@medusajs/medusa/notification",options:{providers:[{resolve:"./src/modules/docloroo-smtp",id:"docloroo-smtp",options:{channels:["email"]}}]}},
  ],
})
