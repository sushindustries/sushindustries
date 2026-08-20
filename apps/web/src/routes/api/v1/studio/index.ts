import { createFileRoute } from "@tanstack/react-router";
import { openSession } from "../../../../modules/content/github-auth.server";
import { refuse } from "../../../../modules/content/mcp-auth.server";
import { json, originFrom } from "../../../../modules/registry/registry.server";
import {
	AUTHORABLE_KINDS,
	DOCUMENT_KINDS,
	DOCUMENT_SORTS,
} from "../../../../modules/studio/documents/documents.schemas";
import { writerOptions } from "../../../../modules/studio/writers/writers.server";

/*
 * The studio API's front door, and its own documentation.
 *
 * The same principle as `/api/v1` above it: an API is discoverable by fetching
 * its root. The difference is that this half writes, so the root also has to
 * answer the two questions a caller needs before it sends anything - which
 * verbs exist, and whether a write would land anywhere at all.
 *
 * The vocabularies are read from the schemas rather than typed here. A list of
 * kinds in a documentation endpoint that drifts from the enum the validator
 * uses is worse than no list: it is a caller building a request against the
 * documented set and being refused by the real one.
 *
 * Behind the same gate as everything else under `/studio`, because it lists
 * what this deployment can write to.
 */
export const Route = createFileRoute("/api/v1/studio/")({
	server: {
		handlers: {
			GET: async ({ request }) => {
				if (!openSession(request)) {
					const refused = await refuse(request, "studio:read");
					if (refused) return refused;
				}

				const origin = originFrom(request);

				return json({
					name: "sushindustries studio API",
					version: "v1",

					/*
					 * Said plainly, because "nothing here can write" is the first
					 * thing a caller needs to know and the last thing it would work
					 * out from a 400 on its third request.
					 */
					writers: writerOptions(),

					/*
					 * Every write plans unless told otherwise. Documented here rather
					 * than only in each endpoint, because it is one rule and a caller
					 * that learns it once should not have to relearn it per verb.
					 */
					dryRun:
						"Every write plans and changes nothing unless `?apply=true` is set.",

					endpoints: {
						documents: {
							url: `${origin}/api/v1/studio/documents`,
							methods: {
								GET: "The collection, filtered and paged. Query: kind, slug, section, search, sort, direction, limit, offset.",
								POST: "Create one from a template. Body: { kind, slug, title? }.",
								PUT: "Change one. Body: { path, title?, summary? } to retitle, or { kind, from, slug } to move.",
								PATCH:
									"Replace one document's whole text. Body: { path, body, sha? }. `sha` is the version you read; the write is refused if the file has moved since.",
								DELETE:
									"Remove one. Body: { kind, slug, confirm } - confirm must equal slug.",
							},
						},
						workflows: {
							url: `${origin}/api/v1/studio/workflows`,
							methods: {
								GET: "What can be run here, and what each one writes.",
								POST: "Run one. Body: { id, confirm } - confirm must be true for anything that writes.",
							},
						},
						report: {
							url: `${origin}/studio/report`,
							methods: { GET: "What is in the database, in aggregates." },
						},
						graph: {
							url: `${origin}/graphql`,
							methods: { POST: "The same data as a graph. Read only." },
						},
					},

					vocabulary: {
						kinds: DOCUMENT_KINDS,
						authorable: AUTHORABLE_KINDS,
						sorts: DOCUMENT_SORTS,
					},

					notes: [
						"Everything readable here is a projection of the repository, rebuilt by `pnpm sushindustries sync`. It can be older than the repository, never newer - `syncedAt` says how much older.",
						'Every write goes to files, not to rows. The projection catches up on the next sync - POST { id: "sync", confirm: true } to /api/v1/studio/workflows to run one.',
					],
				});
			},
		},
	},
});
