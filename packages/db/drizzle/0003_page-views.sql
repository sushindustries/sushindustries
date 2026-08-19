CREATE TABLE "page_views" (
	"path" text PRIMARY KEY NOT NULL,
	"kind" text NOT NULL,
	"views" integer DEFAULT 0 NOT NULL,
	"first_seen" timestamp with time zone DEFAULT now() NOT NULL,
	"last_seen" timestamp with time zone DEFAULT now() NOT NULL
);
