import { authenticate, configureStoreSearch, defineMiddlewares, errorHandler } from '@medusajs/framework/http'
import {z} from "@medusajs/framework/zod"
import { MedusaError } from '@medusajs/framework/utils'
import '../workflows/docloroo/availability'

// The product index declares filterable `status` and `sales_channel_ids`, so
// the route narrows it to published products in the key's sales channels.
export default defineMiddlewares({
  errorHandler:(error,req,res,next)=>errorHandler()(error instanceof z.ZodError?new MedusaError(MedusaError.Types.INVALID_DATA,error.issues.map(i=>`${i.path.join(".")}: ${i.message}`).join("; ")):error,req,res,next),
  routes: [
    {matcher:"/store/siteyfy/review-image",method:["POST"],bodyParser:{sizeLimit:"8mb"}},
    {
      matcher: '/admin/siteyfy/*',
      middlewares: [authenticate('user', ['session', 'bearer'])],
    },
    {
      matcher: '/admin/docloroo/*',
      middlewares: [authenticate('user', ['session', 'bearer'])],
    },
    {
      matcher: '/store/customers/me/docloroo/*',
      middlewares: [authenticate('customer', ['bearer', 'session'])],
    },
    {
      method: ['GET'],
      matcher: '/store/orders/:id',
      middlewares: [(_req, _res, _next) => {
        // Native order retrieval accepts the order ID alone. This storefront
        // requires the owner session or a signed tracking token instead.
        _next(new MedusaError(MedusaError.Types.NOT_ALLOWED, 'Use secure DoCloroo order tracking'))
      }],
    },
    {
      method: ['POST'],
      matcher: '/store/carts/:id/complete',
      middlewares: [(_req, _res, _next) => {
        // Keep COD, quantity promotions and tracking on the single checkout flow.
        _next(new MedusaError(MedusaError.Types.NOT_ALLOWED, 'Use DoCloroo checkout'))
      }],
    },
    {
      matcher: '/store/docloroo/*',
      middlewares: [authenticate('customer', ['bearer'], { allowUnauthenticated: true })],
    },
    {
      method: ['POST'],
      matcher: '/store/search',
      middlewares: [
        configureStoreSearch({
          allowed_indexes: {
            product: true,
          },
        }),
      ],
    },
  ],
})

