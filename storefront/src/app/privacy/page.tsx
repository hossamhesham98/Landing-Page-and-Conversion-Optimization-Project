import {pageMetadata} from "@/lib/metadata"
export async function generateMetadata(){return pageMetadata("privacy")};
import { LegalPage } from "@/components/Pages";
export default function Page(){return <LegalPage kind="privacy"/>;}
