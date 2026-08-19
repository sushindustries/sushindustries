CREATE TABLE "reference_pages" (
	"id" text PRIMARY KEY NOT NULL,
	"provider" text NOT NULL,
	"section" text NOT NULL,
	"name" text NOT NULL,
	"url" text NOT NULL,
	"description" text
);
