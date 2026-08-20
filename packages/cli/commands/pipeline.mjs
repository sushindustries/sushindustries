/*
 * The ETL, as one command that works out what is stale.
 *
 * Three stages already existed and had to be remembered in order: `graphql`
 * writes the schema from the Drizzle tables, `sync` projects the repository
 * into Postgres, `map` redraws the graph. Nothing ran them together, so the
 * generated schema sat a day behind a migration and the projection sat behind
 * the files, and the only symptom was an answer that was quietly old.
 *
 * What makes this a pipeline rather than three commands in a row is that each
 * stage says when it is needed. Adding a table makes the schema stale; editing
 * a document makes the projection stale; neither makes the other so. A run
 * that changes nothing does nothing and says why, which is what makes it safe
 * to put in a hook.
 *
 * It self-extends in the only sense worth the word: a stage is a row in the
 * array below, carrying its own staleness test, so adding one is adding a row.
 * Nothing here enumerates the others or has to be told the order twice.
 */

import {
	globSync,
	mkdirSync,
	readFileSync,
	statSync,
	writeFileSync,
} from "node:fs";
import { dirname, join } from "node:path";
import { flags, root } from "../lib/context.mjs";
import { banner, blank, bold, dim, field, note, ok, warn } from "../lib/ui.mjs";

/*
 * Outside git and per-machine, because "when did this last run here" is a fact
 * about this checkout rather than about the repository. Committing it would
 * make one person's last run everybody's.
 */
const STAMP = join(root, "node_modules/.cache/adam-jurek/pipeline.json");

function stamps() {
	try {
		return JSON.parse(readFileSync(STAMP, "utf8"));
	} catch {
		return {};
	}
}

function stamp(id) {
	const all = stamps();
	all[id] = Date.now();
	mkdirSync(dirname(STAMP), { recursive: true });
	writeFileSync(STAMP, `${JSON.stringify(all, null, "\t")}\n`);
}

/** The newest mtime under a set of globs, or 0 when nothing matches. */
function newest(globs) {
	let latest = 0;
	for (const glob of globs) {
		for (const file of globSync(glob, { cwd: root })) {
			try {
				latest = Math.max(latest, statSync(join(root, file)).mtimeMs);
			} catch {
				// A file that vanished between the glob and the stat is not news.
			}
		}
	}
	return latest;
}

const mtime = (relative) => {
	try {
		return statSync(join(root, relative)).mtimeMs;
	} catch {
		return 0;
	}
};

/**
 * The stages, in the order they depend on each other.
 *
 * `needed` returns a sentence when the stage has work, and null when it does
 * not. A sentence rather than a boolean because the interesting output of this
 * command is *why* something ran, and a boolean cannot say.
 */
const STAGES = [
	{
		id: "graphql",
		about: "write the GraphQL schema from the Drizzle tables",
		needed() {
			const schema = mtime("packages/db/src/schema.ts");
			const generated = mtime("apollo/schema.graphql");

			if (!generated) return "apollo/schema.graphql has never been written";
			if (schema > generated)
				return "the Drizzle schema is newer than the generated one";
			return null;
		},
		async run() {
			const { graphql } = await import("./graphql.mjs");
			return graphql();
		},
	},
	{
		id: "sync",
		about: "project this repository into Postgres",
		needed() {
			const last = stamps().sync ?? 0;
			if (!last) return "nothing has been synced from this checkout yet";

			const changed = newest([
				"apps/web/content/**/*.md",
				"packages/*/docs/**/*.md",
				"packages/*/README.md",
				".claude/**/*.md",
			]);

			return changed > last
				? "documents have changed since the last sync"
				: null;
		},
		async run() {
			if (!process.env.DATABASE_URL) {
				throw new Error(
					"DATABASE_URL is not set, so there is nowhere to project into.",
				);
			}
			const { sync } = await import("./sync.mjs");
			return sync();
		},
	},
	{
		id: "map",
		about: "redraw the dependency graph",
		/*
		 * Always. It reads manifests and prints, so it costs nothing and being
		 * one run behind is the whole failure it exists to prevent.
		 */
		needed: () => "the graph is drawn from whatever the manifests now say",
		async run() {
			const { map } = await import("./map.mjs");
			return map();
		},
	},
];

export async function pipeline() {
	banner("pipeline");

	const force = flags.has("--force");
	const dry = flags.has("--dry");

	if (force) note("--force: every stage runs whether or not it is stale.");
	if (dry) note("--dry: reporting what would run, and running nothing.");
	blank();

	const ran = [];
	const skipped = [];

	for (const stage of STAGES) {
		const why = force ? "forced" : stage.needed();

		if (!why) {
			skipped.push(stage.id);
			console.log(`  ${dim("skip")}  ${bold(stage.id)}  ${dim("up to date")}`);
			continue;
		}

		console.log(`  ${bold(stage.id)}  ${dim(why)}`);

		if (dry) {
			ran.push(stage.id);
			continue;
		}

		try {
			await stage.run();
			stamp(stage.id);
			ran.push(stage.id);
		} catch (error) {
			/*
			 * A failed stage stops the run. The stages are ordered because they
			 * depend on each other - projecting a repository whose schema failed
			 * to generate would write rows against a shape nothing agreed on.
			 */
			warn(`${stage.id} failed: ${error.message}`);
			blank();
			field("ran", ran.join(", ") || "nothing");
			field("stopped at", stage.id);
			blank();
			throw error;
		}
	}

	blank();
	field("ran", ran.join(", ") || "nothing");
	field("skipped", skipped.join(", ") || "nothing");
	blank();

	if (ran.length === 0) {
		ok("Nothing was stale.");
		return;
	}

	ok(dry ? "That is what would run." : "Pipeline complete.");
}
