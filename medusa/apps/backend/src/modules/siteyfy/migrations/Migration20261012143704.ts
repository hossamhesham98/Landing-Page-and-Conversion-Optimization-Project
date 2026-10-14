import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20261012143704 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "siteyfy_media" ("id" text not null, "store_id" text not null, "file_id" text not null, "url" text not null, "mime" text not null, "name" text not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "siteyfy_media_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_siteyfy_media_deleted_at" ON "siteyfy_media" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_siteyfy_media_store_id" ON "siteyfy_media" ("store_id") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "siteyfy_review" ("id" text not null, "store_id" text not null, "product_id" text not null, "display_name" text not null, "rating" integer not null, "comment" text not null, "image" text null, "status" text check ("status" in ('pending', 'approved', 'rejected')) not null default 'pending', "source_reference" text null, "moderated_by" text null, "moderated_at" timestamptz null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "siteyfy_review_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_siteyfy_review_deleted_at" ON "siteyfy_review" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_siteyfy_review_store_id_status" ON "siteyfy_review" ("store_id", "status") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "siteyfy_media" cascade;`);

    this.addSql(`drop table if exists "siteyfy_review" cascade;`);
  }

}
