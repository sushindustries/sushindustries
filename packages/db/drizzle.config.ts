import { defineConfig } from "drizzle-kit";

export default defineConfig({
	dialect: "postgresql",
	schema: "./src/schema.ts",
	out: "./drizzle",
	dbCredentials: {
		// Only drizzle-kit reads this, and only when you run a migration by hand.
		url: process.env.DATABASE_URL ?? "",
	},
});
