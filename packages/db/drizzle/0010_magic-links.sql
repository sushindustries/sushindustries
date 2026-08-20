CREATE TABLE "magic_links" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"hash" text NOT NULL,
	"prefix" text NOT NULL,
	"token_name" text NOT NULL,
	"scopes" text NOT NULL,
	"token_days" integer,
	"invited_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"redeemed_at" timestamp with time zone,
	"token_id" uuid,
	"revoked_at" timestamp with time zone,
	CONSTRAINT "magic_links_hash_unique" UNIQUE("hash")
);
--> statement-breakpoint
ALTER TABLE "magic_links" ADD CONSTRAINT "magic_links_invited_by_accounts_id_fk" FOREIGN KEY ("invited_by") REFERENCES "public"."accounts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "magic_links" ADD CONSTRAINT "magic_links_token_id_api_tokens_id_fk" FOREIGN KEY ("token_id") REFERENCES "public"."api_tokens"("id") ON DELETE set null ON UPDATE no action;