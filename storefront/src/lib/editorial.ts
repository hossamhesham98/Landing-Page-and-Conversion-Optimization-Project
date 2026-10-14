// SITEYFY CMS editorial text applied only to trusted HTML templates.
// Never interpolate administrator-supplied raw HTML into dangerouslySetInnerHTML.
import { fallbackPage, safeMediaUrl, type SiteyfyPage, type SectionId } from "./siteyfy-content"
import {about_video,markers,how_it_works,closing} from "./static-sections"

export function escapeHtmlText(s: string) {
  return s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")
    .replace(/"/g,"&quot;").replace(/'/g,"&#39;")
}

export function renderEditorial(section: Exclude<SectionId,"faq"|"reviews">, page: SiteyfyPage): string {
  return applyMedia(renderText(section,page),page)
}
function applyMedia(html:string,page:SiteyfyPage):string {
  const media=page.media
  if(!media)return html
  for(const [key,old] of [["markers_image","/assets/markers-studio.webp"],["about_video","/assets/product-preview-v5.mp4"],["about_poster","/assets/video-poster-v5.webp"]] as const){
    const url=media[key]
    if(url&&safeMediaUrl(url))html=html.replaceAll(old,escapeHtmlText(url))
  }
  if(media.about_video&&safeMediaUrl(media.about_video))html=html.replace('type="video/mp4"',media.about_video.split("?")[0].endsWith(".webm")?'type="video/webm"':'type="video/mp4"')
  return html
}
function renderText(section: Exclude<SectionId,"faq"|"reviews">, page: SiteyfyPage): string {
  const content = page.editorial
  if (!content) return {about:about_video,markers,howto:how_it_works,closing}[section]
  const safe = (value:string) => escapeHtmlText(value)
  if(section==="about")return about_video
    .replace(/<h2 class="doodle-title">[\s\S]*?<\/h2>/,(original)=>content.about_title===fallbackPage.editorial?.about_title?original:`<h2 class="doodle-title">${safe(content.about_title)}</h2>`)
    .replace(/<p>بطانية تلوين DoCloroo[\s\S]*?<\/p>/,(original)=>content.about_body===fallbackPage.editorial?.about_body?original:`<p>${safe(content.about_body)}</p>`)
  if(section==="markers")return markers
    .replace(/<h2 class="doodle-title">[\s\S]*?<\/h2>/,(original)=>content.markers_title===fallbackPage.editorial?.markers_title?original:`<h2 class="doodle-title">${safe(content.markers_title)}</h2>`)
    .replace(/<p>مش محتاج تختار الألوان[\s\S]*?<\/p>/,(original)=>content.markers_body===fallbackPage.editorial?.markers_body?original:`<p>${safe(content.markers_body)}</p>`)
  if(section==="howto")return how_it_works
    .replace(/<p>هنعرض تعليمات الغسيل والكي[^<]*<\/p>/,`<p>${safe(content.howto_intro)}</p>`)
  return closing
    .replace(/<h2>ابدأ تجربة التلوين مع DoCloroo<\/h2>/,`<h2>${safe(content.closing_title)}</h2>`)
    .replace(/<p>بطانية 130 × 150 سم[^<]*<\/p>/,`<p>${safe(content.closing_body)}</p>`)
}
