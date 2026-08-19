import { parseFrontmatter, readString } from "@sushindustries/ui";

/*
 * The hub, configured rather than coded.
 *
 * Which bars the home chart draws, in what order and against what measure, is
 * a judgement about what matters this month - not a fact about the schema. So
 * it is `content/studio/hub.md`, globbed at build time like every other piece
 * of content here, and changing it is editing a Markdown file rather than a
 * component.
 *
 * That also makes it something the studio can edit *itself*: the file is a
 * document, the documents feature edits documents, and there is no separate
 * settings screen to build or keep in step.
 *
 * The parser is deliberately small - `key: value` under a `chart:` block, and
 * nothing else. A configuration language is a program, and a program that
 * decides what a dashboard shows is a program that wants tests. Six lines of
 * labels do not.
 */

const FILES = import.meta.glob<string>("../../../content/studio/*.md", {
	eager: true,
	import: "default",
	query: "?raw",
});

/** Where a bar's number comes from. */
export type HubSource =
	| { readonly of: "documents"; readonly kind?: string }
	| { readonly of: "collections" }
	| { readonly of: "references" }
	| { readonly of: "views" };

export interface HubBar {
	/** Stable across renders and unique in the chart. The label, slugged. */
	readonly id: string;

	/** Drawn on the axis. */
	readonly label: string;

	readonly source: HubSource;
}

export interface HubConfig {
	readonly title: string;
	readonly summary: string;

	/** How many things, or what they cost to read. */
	readonly measure: "count" | "tokens";

	readonly bars: readonly HubBar[];

	/** The prose under the chart. */
	readonly body: string;
}

/**
 * The default, for when the file is missing or unparseable.
 *
 * A hub with no chart rather than a thrown error. This is one Markdown file
 * deciding a decoration; taking the whole studio down because somebody
 * mistyped a key in it would be the configuration outranking the thing it
 * configures.
 */
const FALLBACK: HubConfig = {
	title: "Studio",
	summary: "What is in the repository, and what can be done to it.",
	measure: "count",
	bars: [],
	body: "",
};

/** `Component APIs` → `component-apis`. Only ever used as a React key. */
const slugify = (value: string) =>
	value
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-|-$/g, "");

/**
 * `documents:component` → `{ of: "documents", kind: "component" }`.
 *
 * An unknown source is dropped rather than defaulted. A bar that silently
 * became "documents" because its source was misspelled is a chart that lies,
 * and a missing bar is a thing somebody notices.
 */
function toSource(value: string): HubSource | undefined {
	const [of, kind] = value.trim().split(":");

	if (of === "documents") return kind ? { of, kind } : { of };
	if (of === "collections" || of === "references" || of === "views") {
		return { of };
	}
	return undefined;
}

/**
 * The `chart:` block, which is the one nested thing the frontmatter has.
 *
 * `parseFrontmatter` in the library is flat by design, so the block is read
 * off the raw text here: lines indented under `chart:` until the indentation
 * stops. That is the whole of the nesting this file supports, and supporting
 * more would be the moment to reach for a YAML parser rather than to grow
 * this one.
 */
function readBars(frontmatter: string): readonly HubBar[] {
	const lines = frontmatter.split("\n");
	const start = lines.findIndex((line) => line.trim() === "chart:");
	if (start === -1) return [];

	const bars: HubBar[] = [];

	for (const line of lines.slice(start + 1)) {
		if (!/^\s+\S/.test(line)) break;
		if (line.trim().startsWith("#")) continue;

		const at = line.indexOf(":");
		if (at === -1) continue;

		const label = line.slice(0, at).trim();
		const source = toSource(line.slice(at + 1));
		if (!label || !source) continue;

		bars.push({ id: slugify(label), label, source });
	}

	return bars;
}

function parse(raw: string): HubConfig {
	const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(raw);
	if (!match) return FALLBACK;

	const frontmatter = match[1] ?? "";
	const meta = parseFrontmatter(frontmatter);

	return {
		title: readString(meta, "title", FALLBACK.title),
		summary: readString(meta, "summary", FALLBACK.summary),
		measure: readString(meta, "measure") === "tokens" ? "tokens" : "count",
		bars: readBars(frontmatter),
		body: raw.slice(match[0].length).trim(),
	};
}

const HUB: HubConfig = (() => {
	const raw = Object.entries(FILES).find(([path]) =>
		path.endsWith("/hub.md"),
	)?.[1];

	return raw ? parse(raw) : FALLBACK;
})();

export function hubConfig(): HubConfig {
	return HUB;
}
