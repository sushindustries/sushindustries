/*
 * Shards our providers' documentation indexes into local JSON.
 *
 * Every library in stack.yaml that publishes an llms.txt gets fetched once,
 * cut into its individual entries, and stored beside this file. After that,
 * answering "where are the Router docs on search params" is a file read rather
 * than a round trip, and it still works with no network at all.
 *
 * We store the index, not the pages. Their prose stays on their servers where
 * it belongs. What we keep is the map, which is the part that tells you which
 * page to open and is the part a model otherwise guesses at.
 */

import {
	existsSync,
	mkdirSync,
	readFileSync,
	rmSync,
	writeFileSync,
} from "node:fs";
import { join } from "node:path";
import { flags, parseStack, REFERENCES, STACK } from "../lib/context.mjs";
import { banner, blank, field, note, ok, spinner, warn } from "../lib/ui.mjs";

/** Lowercase, dashed, stable. These become filenames. */
const slugify = (value) =>
	String(value)
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "");

const TIMEOUT = 20_000;

/**
 * How many entries a shard may hold before it is cut in two.
 *
 * The same number the sitemap uses, and for the same reason: a shard exists so
 * that a reader can load the part it needs, and one file holding three and a
 * half thousand entries is not a shard, it is the thing sharding was meant to
 * avoid. Five hundred keeps every file small enough to read whole.
 */
const SHARD_LIMIT = 500;

export async function refs() {
	banner("references");

	const stack = parseStack(readFileSync(STACK, "utf8"));

	// Keyed by URL, not by package: TanStack publishes one index for eleven
	// entries here, and fetching it eleven times would be eleven identical
	// files with different names.
	const providers = new Map();
	for (const item of stack) {
		if (!item.llms) continue;
		if (!providers.has(item.llms)) providers.set(item.llms, []);
		providers.get(item.llms).push(item.name);
	}

	mkdirSync(REFERENCES, { recursive: true });
	const force = flags.has("--force");
	const shards = [];

	for (const [url, used] of providers) {
		const slug = new URL(url).hostname
			.replace(/^www\./, "")
			.replace(/\./g, "-");
		const shard = await fetchShard({ url, slug, usedFor: used, force });
		if (shard) shards.push(shard);
	}

	/*
	 * Some indexes are indexes of indexes. TanStack's root llms.txt lists one
	 * per library, so stopping at the first level would leave us knowing that
	 * Router exists and nothing whatsoever about it. One level deeper is
	 * enough. Beyond that lies the documentation itself, which we deliberately
	 * do not mirror.
	 */
	for (const parent of [...shards]) {
		for (const entry of parent.entries) {
			if (!entry.url.endsWith("llms.txt")) continue;

			const child = await fetchShard({
				url: entry.url,
				slug: `${parent.provider}-${slugify(entry.name)}`,
				usedFor: parent.usedFor,
				parent: parent.provider,
				fallbackTitle: entry.name,
				force,
			});
			if (child) shards.push(child);
		}
	}

	writeManifest(shards);
	writeCatalogue(shards);

	blank();
	field("providers", String(shards.length));
	field(
		"entries",
		String(shards.reduce((total, one) => total + one.entries.length, 0)),
	);
	field(
		"shards",
		String(shards.reduce((total, one) => total + shardsFor(one).length, 0)),
	);
	field("written", "packages/cli/references/");
	blank();

	const missing = stack
		.filter((item) => !item.llms && item.package !== "")
		.map((item) => item.name);
	if (missing.length) {
		warn(`${missing.length} dependency(ies) publish no llms.txt:`);
		note(missing.join(", "));
		blank();
	}

	ok("References sharded");
	blank();
}

/** One provider, fetched and cut up, or null if it could not be had. */
async function fetchShard({
	url,
	slug,
	usedFor,
	parent,
	fallbackTitle,
	force,
}) {
	const dir = join(REFERENCES, slug);
	const own = join(dir, "index.json");

	if (existsSync(own) && !force) {
		const cached = readProvider(slug);
		note(`${slug} - ${cached.entries.length} entries (cached)`);
		return cached;
	}

	const spin = spinner(`fetching ${slug}`);
	let body;
	try {
		const response = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT) });
		if (!response.ok) throw new Error(`HTTP ${response.status}`);
		body = await response.text();
	} catch (error) {
		// A provider that is down is not a reason to abandon the other thirty.
		spin.stop(false, `${slug} - ${error.message}`);
		return null;
	}

	const shard = {
		provider: slug,
		source: url,
		...(parent ? { parent } : {}),
		fetchedAt: new Date().toISOString().slice(0, 10),
		usedFor,
		...parseLlms(body, url),
	};
	if (!shard.title && fallbackTitle) shard.title = fallbackTitle;

	writeProvider(shard);
	const count = shardsFor(shard).length;
	spin.stop(
		true,
		`${slug} - ${shard.entries.length} entries, ${count} shard(s)`,
	);
	return shard;
}

/* ── sharding ────────────────────────────────────────────────────────── */

/**
 * How one provider's entries divide into files.
 *
 * By section first, because a section is the unit somebody actually wants:
 * "the Router guides" is a real request and "the first five hundred Router
 * entries" is not. A section over the limit is then cut in order, so a huge
 * one degrades into numbered parts rather than defeating the whole scheme.
 */
export function shardsFor(provider) {
	const out = [];

	for (const name of [...new Set(provider.entries.map((one) => one.section))]) {
		const entries = provider.entries.filter((one) => one.section === name);
		const parts = Math.ceil(entries.length / SHARD_LIMIT) || 1;

		for (let part = 0; part < parts; part++) {
			out.push({
				section: name,
				file: `${slugify(name) || "general"}${part ? `-${part + 1}` : ""}.json`,
				entries: entries.slice(part * SHARD_LIMIT, (part + 1) * SHARD_LIMIT),
			});
		}
	}

	return out;
}

/**
 * One directory per provider: an index, and a file per section.
 *
 * The directory is removed first so a refresh cannot leave a shard behind from
 * a section the provider has since dropped. That orphan would be invisible -
 * it would still parse, still answer, and quietly describe a page that no
 * longer exists.
 */
function writeProvider(provider) {
	const dir = join(REFERENCES, provider.provider);
	rmSync(dir, { recursive: true, force: true });
	mkdirSync(dir, { recursive: true });

	const shards = shardsFor(provider);

	for (const shard of shards) {
		writeFileSync(
			join(dir, shard.file),
			`${JSON.stringify({ provider: provider.provider, section: shard.section, entries: shard.entries }, null, "\t")}\n`,
		);
	}

	const { entries, ...meta } = provider;
	writeFileSync(
		join(dir, "index.json"),
		`${JSON.stringify(
			{
				...meta,
				total: entries.length,
				sections: shards.map((shard) => ({
					name: shard.section,
					entries: shard.entries.length,
					file: shard.file,
				})),
			},
			null,
			"\t",
		)}\n`,
	);
}

/** A provider read back whole, for the cached path and for the catalogue. */
function readProvider(slug) {
	const dir = join(REFERENCES, slug);
	const index = JSON.parse(readFileSync(join(dir, "index.json"), "utf8"));

	const entries = index.sections.flatMap(
		(section) =>
			JSON.parse(readFileSync(join(dir, section.file), "utf8")).entries,
	);

	return { ...index, entries };
}

/**
 * The one file a reader loads first.
 *
 * Every provider, every section, and the file each one lives in - and no
 * entries at all. That is what makes it worth having: it stays a few kilobytes
 * whatever happens to the thing it describes, so answering "what is available"
 * never costs loading what is available.
 */
function writeManifest(shards) {
	writeFileSync(
		join(REFERENCES, "index.json"),
		`${JSON.stringify(
			{
				generatedBy: "pnpm sushindustries refs",
				fetchedAt: new Date().toISOString().slice(0, 10),
				shardLimit: SHARD_LIMIT,
				/*
				 * Stated in the file itself, because this directory is a copy of
				 * other people's work and the limit on it is the thing that keeps
				 * it a citation rather than a reproduction.
				 */
				contains:
					"Links, titles, section names and each provider's own one-line descriptions, taken from the llms.txt they publish for this purpose. No page content.",
				providers: shards.map(({ entries, ...meta }) => ({
					...meta,
					total: entries.length,
					sections: shardsFor({ entries }).map((shard) => ({
						name: shard.section,
						entries: shard.entries.length,
						file: `${meta.provider}/${shard.file}`,
					})),
				})),
			},
			null,
			"\t",
		)}\n`,
	);
}

/**
 * One page listing everything that can be looked up.
 *
 * The shards answer "where is this documented". This answers the question
 * before it, which is "what is even available to me". Built from the shards,
 * so it cannot claim a provider that is no longer there.
 */
function writeCatalogue(shards) {
	const total = shards.reduce((sum, shard) => sum + shard.entries.length, 0);

	const out = [
		"<!-- Generated by `pnpm sushindustries refs`. Do not edit. -->",
		"",
		"# Reference catalogue",
		"",
		`${total} documentation entries from ${shards.length} providers, fetched once and kept here.`,
		"Ask the `sushindustries` MCP server rather than reading this page.",
		"",
		"| Provider | Entries | Sections | Shards | Used for | Fetched |",
		"| --- | --- | --- | --- | --- | --- |",
		...shards
			.slice()
			.sort((a, b) => b.entries.length - a.entries.length)
			.map((shard) => {
				const files = shardsFor(shard);
				const sections = new Set(files.map((one) => one.section)).size;
				return `| [${shard.title || shard.provider}](${shard.provider}/index.json) | ${shard.entries.length} | ${sections} | ${files.length} | ${shard.usedFor.join(", ")} | ${shard.fetchedAt} |`;
			}),
		"",
		"## Refreshing",
		"",
		"```bash",
		"pnpm sushindustries refs --force",
		"```",
		"",
		"Without `--force` an existing shard is kept, so the ordinary run costs",
		"nothing. Refresh when a dependency is upgraded: a stale index is worse",
		"than none, because it looks current.",
		"",
	];

	writeFileSync(join(REFERENCES, "index.md"), `${out.join("\n")}\n`);
}

/**
 * Reads llms.txt as specified at llmstxt.org: an H1 title, a blockquote
 * summary, then `## Section` headings over `- [name](url): description` lines.
 *
 * Providers are loose about this. Anything that is not a recognisable link
 * line is skipped rather than guessed at, because a wrong entry is worse than
 * a missing one: a missing entry sends you to a search box, and a wrong one
 * sends you to a page that does not exist and looks like the library changed.
 *
 * `base` is the URL the index came from, because some providers write
 * host-less links. React Three Fiber and drei both list `/getting-started/
 * introduction`, and stored raw those are unusable - nothing downstream knows
 * which host they belong to, and the nested fetch above would throw on them.
 */
export function parseLlms(source, base) {
	const lines = source.split("\n");
	const first = (prefix) =>
		lines
			.find((line) => line.startsWith(prefix))
			?.slice(prefix.length)
			.trim() ?? "";

	let section = "";
	const entries = [];

	for (const raw of lines) {
		const line = raw.trim();
		if (line.startsWith("## ")) {
			section = line.slice(3).trim();
			continue;
		}

		const match = line.match(/^-\s*\[([^\]]+)\]\(([^)]+)\)\s*:?\s*(.*)$/);
		if (!match) continue;

		let url = match[2].trim();
		try {
			url = new URL(url, base).href;
		} catch {
			// Unparseable link, skipped for the same reason a malformed line is.
			continue;
		}

		entries.push({
			name: match[1].trim(),
			url,
			description: match[3].trim(),
			section: section || "General",
		});
	}

	return { title: first("# "), summary: first("> "), entries };
}
