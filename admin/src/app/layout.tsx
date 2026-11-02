import type { Metadata } from "next"
import "./globals.css"
export const metadata:Metadata={title:{default:"SITEYFY · Digital Solutions",template:"%s · SITEYFY"},description:"SITEYFY Digital Solutions — secure commerce and content administration",robots:{index:false,follow:false},icons:{icon:[{url:"/icons/icon-32.png",sizes:"32x32",type:"image/png"},{url:"/icons/icon-192.png",sizes:"192x192",type:"image/png"}],shortcut:"/favicon.ico",apple:{url:"/icons/icon-180.png",sizes:"180x180",type:"image/png"}}}
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>}
