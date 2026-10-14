import type { Metadata } from "next"
import "./globals.css"
export const metadata:Metadata={title:{default:"SITEYFY · Digital Solutions",template:"%s · SITEYFY"},description:"SITEYFY Digital Solutions — secure commerce and content administration",robots:{index:false,follow:false}}
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>}
