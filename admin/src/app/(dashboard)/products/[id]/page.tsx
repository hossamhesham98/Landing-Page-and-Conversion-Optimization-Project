import {CatalogEditor as ProductDetail} from "@/components/CatalogEditor"
export const metadata={title:"Edit product"}
export default async function Page({params}:{params:Promise<{id:string}>}){const {id}=await params;return <ProductDetail id={id}/>}
