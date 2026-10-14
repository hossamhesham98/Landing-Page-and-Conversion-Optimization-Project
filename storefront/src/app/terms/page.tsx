import {pageMetadata} from "@/lib/metadata"
export async function generateMetadata(){return pageMetadata("terms")};
import { LegalPage } from "@/components/Pages";
export default function Page(){return <LegalPage kind="terms"/>;}
