import { defineConfig } from "tsdown";

export default defineConfig({
	entry: ["./src/schema.ts", "./src/client.server.ts"],
	format: ["esm", "cjs"],
	dts: true,
	deps: {
		neverBundle: ["drizzle-orm", "postgres"],
	},
	clean: true,
});
