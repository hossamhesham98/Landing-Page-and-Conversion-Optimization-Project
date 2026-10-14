import Image from "next/image"
import {safeMediaUrl,type PageCopy} from "@/lib/siteyfy-content"
export function PageContentSections({blocks}:{blocks:PageCopy["blocks"]}){
 return <>{blocks.filter(b=>b.enabled).map(b=><section key={b.id} className="v7-panel"><h2>{b.title}</h2><p style={{whiteSpace:"pre-line"}}>{b.body}</p>{b.media&&safeMediaUrl(b.media)&&(b.type==="image"?<Image unoptimized src={b.media} alt={b.title} width={900} height={600} style={{maxWidth:"100%",height:"auto",objectFit:"contain"}}/>:b.type==="video"?<video src={b.media} controls playsInline preload="metadata" style={{maxWidth:"100%",maxHeight:720}}/>:null)}</section>)}</>
}
