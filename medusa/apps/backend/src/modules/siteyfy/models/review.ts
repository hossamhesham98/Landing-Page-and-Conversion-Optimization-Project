import {model} from "@medusajs/framework/utils"
export const Review=model.define("siteyfy_review",{
  id:model.id({prefix:"review"}).primaryKey(),store_id:model.text(),product_id:model.text(),
  display_name:model.text(),rating:model.number(),comment:model.text(),image:model.text().nullable(),
  status:model.enum(["pending","approved","rejected"]).default("pending"),
  source_reference:model.text().nullable(),moderated_by:model.text().nullable(),moderated_at:model.dateTime().nullable(),
}).indexes([{on:["store_id","status"]}])
