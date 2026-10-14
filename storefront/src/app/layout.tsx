import "./globals.css";
import {Suspense} from "react";
import ContentProvider from "@/components/ContentProvider";
import {loadPublishedHome} from "@/lib/siteyfy-content";
import StoreProvider from "@/components/StoreProvider";
import { CartDrawer, Footer, Header } from "@/components/Shell";
import {pageMetadata} from "@/lib/metadata";
export const dynamic="force-dynamic";
export async function generateMetadata(){return pageMetadata()}
export default async function RootLayout({children}:{children:React.ReactNode}){
 const {page}=await loadPublishedHome();
 return <html lang="ar" dir="rtl"><body><StoreProvider><Suspense><ContentProvider initial={page}><Header/>{children}<Footer/><CartDrawer/></ContentProvider></Suspense></StoreProvider></body></html>;
}

