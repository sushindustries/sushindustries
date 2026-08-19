CREATE TABLE "documents" (
	"path" text PRIMARY KEY NOT NULL,
	"kind" text NOT NULL,
	"slug" text,
	"section" text,
	"route" text,
	"title" text,
	"summary" text,
	"body" text NOT NULL,
	"words" integer DEFAULT 0 NOT NULL,
	"tokens" integer DEFAULT 0 NOT NULL,
	"sha" text NOT NULL,
	"synced_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reference_providers" (
	"provider" text PRIMARY KEY NOT NULL,
	"title" text,
	"source" text NOT NULL,
	"parent" text,
	"used_for" text,
	"entries" integer DEFAULT 0 NOT NULL,
	"fetched_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "references" (
	"id" text PRIMARY KEY NOT NULL,
	"provider" text NOT NULL,
	"section" text NOT NULL,
	"name" text NOT NULL,
	"url" text NOT NULL,
	"description" text
);
