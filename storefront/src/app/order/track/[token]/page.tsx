import {pageMetadata} from "@/lib/metadata"
export async function generateMetadata(){return pageMetadata("tracking")};
import { TrackingPage } from "@/components/Pages";
export default function Page(){return <TrackingPage/>;}
