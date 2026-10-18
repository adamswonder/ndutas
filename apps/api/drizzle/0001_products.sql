CREATE TABLE "products" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"price" integer NOT NULL,
	"image" text NOT NULL,
	"category" text NOT NULL,
	"available" boolean DEFAULT true NOT NULL,
	"sort_order" integer NOT NULL,
	"archived_at" timestamp with time zone
);
--> statement-breakpoint
CREATE INDEX "products_category_sort_idx" ON "products" USING btree ("category","sort_order");