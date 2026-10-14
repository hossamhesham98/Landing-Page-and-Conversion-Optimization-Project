import {pageMetadata} from "@/lib/metadata"
export async function generateMetadata(){return pageMetadata("login")};
import { LoginPage } from "@/components/Pages";
export default function Page(){return <LoginPage/>;}
