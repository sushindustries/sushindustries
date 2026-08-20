import type { CodegenConfig } from "@graphql-codegen/cli";

/*
 * Types for the resolvers, from the schema the resolvers are served over.
 *
 * The schema is already generated - `pnpm sushindustries graphql` writes
 * `apollo/schema.graphql` from the Drizzle tables, so a field cannot disagree
 * with its column. What nothing checked was the layer between: 585 lines of
 * hand-written resolvers, annotated with nothing, answering that schema. A
 * renamed column regenerated the schema and left a resolver returning a shape
 * no type had ever agreed to.
 *
 * So this closes the last link in the chain: column to field, field to
 * resolver. `tsc` refuses the mismatch, which is better than a check that
 * reports one - the mismatch never gets committed.
 *
 * The plain plugins rather than the server preset. That preset wants the schema
 * split into domain folders with one file per resolver, which is a good shape
 * for a new server and a large restructure for a single map that already works.
 *
 * `mappers` below, `contextType` deliberately absent: several resolvers return
 * Drizzle rows and registry entries rather than the wire shape, which is what
 * mappers are for, while nothing here reads a context. Add one the day that
 * stops being true.
 *
 * Run by `pnpm sushindustries graphql`, immediately after the schema it reads
 * is written. Generating them apart is how one gets run and the other does not.
 */
const config: CodegenConfig = {
	schema: "apollo/schema.graphql",
	generates: {
		"apps/web/src/modules/graph/graphql.generated.ts": {
			config: {
				/*
				 * What the resolvers actually return.
				 *
				 * This is the documented answer to the mismatch, and skipping it
				 * was the mistake: `providers()` returns rows straight out of
				 * Drizzle and `elements()` returns registry entries, neither of
				 * which is the GraphQL type's shape. Without a mapper the
				 * generated `Resolvers` demands the schema shape, every one of
				 * those resolvers fails to typecheck, and the temptation is to
				 * cast - which is the type safety being bought and then thrown
				 * away one call site at a time.
				 *
				 * A mapper says "this type's parent is that type", so the field
				 * resolvers hanging off it are typed against the row rather than
				 * against the wire format.
				 */
				mappers: {
					ReferenceProvider:
						"@sushindustries/db/schema#ReferenceProvider as ReferenceProviderRow",
					ReferencePage:
						"@sushindustries/db/schema#ReferencePage as ReferencePageRow",
					Element: "./elements.server#ShapedElement",
					Repository: "./github.server#RepositorySummary",
					/*
					 * Aliased: the schema declares a type of the same name, and an
					 * unaliased import collides with the interface generated for it.
					 */
					ElementShard: "./elements.server#ElementShard as ElementShardModel",
				},
				/*
				 * The resolver map is one object literal covering some of the
				 * types, not all of them. Without this, `Resolvers` demands every
				 * field of every type and the annotation is unusable.
				 */
				useIndexSignature: true,
				/* Matches the repo: no `I` prefix, no `Type` suffix. */
				skipTypename: true,
				/* `verbatimModuleSyntax` is on here, so a type import has to say so. */
				useTypeImports: true,
			},
			plugins: ["typescript", "typescript-resolvers"],
		},
	},
};

export default config;
