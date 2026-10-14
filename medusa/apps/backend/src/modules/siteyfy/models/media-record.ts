import {model} from "@medusajs/framework/utils"
export const MediaRecord=model.define("siteyfy_media",{
  id:model.id({prefix:"media"}).primaryKey(),store_id:model.text(),file_id:model.text(),url:model.text(),mime:model.text(),name:model.text(),
}).indexes([{on:["store_id"]}])
