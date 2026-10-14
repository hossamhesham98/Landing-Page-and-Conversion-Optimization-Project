import {ResourceList} from "@/components/ResourceList"
import {Suspense} from "react"
export const metadata={title:"Products"}
export default function Page(){return <Suspense fallback={<div className="panel loading-state">Loading products...</div>}><ResourceList resource="products"/></Suspense>}
