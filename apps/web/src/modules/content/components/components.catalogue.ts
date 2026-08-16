import { parseFrontmatter, readString } from "@sushindustries/ui";

/*
 * Component docs, from `packages/<pkg>/docs/<slug>/<section>.md`.
 *
 * The docs live in the package they document, not on the site, because anyone
 * who installs the package gets them. Documentation shipped beside the code
 * cannot drift from the version somebody actually installed.
 *
 * One file per section, and the tab bar is built from the files that exist. A
 * component with only an `index.md` gets one tab; adding `api.md` adds the API
 * tab and nothing else has to be told about it. That is the whole reason the
 * sections are files rather than headings — a new page is a new file, not an
 * edit to a route.
 */

const FILES = import.meta.glob<string>(
	"../../../../../../packages/*/docs/*/*.md",
	{ eager: true, import: "default", query: "?raw" },
);

/*
 * Fixed order, borrowed from TanStack's own docs because readers already know
 * it: what it is, how to start, how to use it well, what every prop does, and
 * what it looks like in something real.
 */
const SECTION_ORDER = [
	"index",
	"get-started",
	"guides",
	"api",
	"examples",
] as const;

export type SectionId = (typeof SECTION_ORDER)[number];

const SECTION_LABELS: Readonly<Record<SectionId, string>> = {
	index: "Home",
	"get-started": "Get Started",
	guides: "Guides",
	api: "API",
	examples: "Examples",
};

export interface DocSection {
	readonly id: SectionId;
	readonly label: string;
	readonly body: string;
}

export interface ComponentDoc {
	/** Directory name under `docs/`. The URL segment. */
	readonly slug: string;
	readonly title: string;
	readonly summary: string;
	/** The package that ships it, e.g. `@sushindustries/ui`. */
	readonly packageName: string;
	/** Present sections, in the fixed order above. */
	readonly sections: readonly DocSection[];
}

/** `.../packages/ui/docs/scroll-spin/api.md` -> pkg, slug, section */
function partsFrom(path: string): {
	pkg: string;
	slug: string;
	section: string;
} {
	const segments = path.split("/");
	return {
		section: segments.at(-1)?.replace(/\.md$/, "") ?? "",
		slug: segments.at(-2) ?? "",
		pkg: segments.at(-4) ?? "",
	};
}

function splitFrontmatter(raw: string): { frontmatter: string; body: string } {
	const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(raw);
	if (!match) return { frontmatter: "", body: raw };

	return { frontmatter: match[1] ?? "", body: raw.slice(match[0].length) };
}

function isSectionId(value: string): value is SectionId {
	return (SECTION_ORDER as readonly string[]).includes(value);
}

interface Draft {
	slug: string;
	pkg: string;
	title: string;
	summary: string;
	sections: Map<SectionId, string>;
}

const DRAFTS = new Map<string, Draft>();

for (const [path, raw] of Object.entries(FILES)) {
	const { pkg, slug, section } = partsFrom(path);
	if (!pkg || !slug || !isSectionId(section)) continue;

	const { frontmatter, body } = splitFrontmatter(raw);
	const meta = parseFrontmatter(frontmatter);

	const draft = DRAFTS.get(slug) ?? {
		slug,
		pkg,
		title: slug,
		summary: "",
		sections: new Map<SectionId, string>(),
	};

	// Title and summary come from index.md; other sections may carry their own
	// frontmatter without overwriting the component's identity.
	if (section === "index") {
		draft.title = readString(meta, "title", slug);
		draft.summary = readString(meta, "summary");
	}

	draft.sections.set(section, body);
	DRAFTS.set(slug, draft);
}

const DOCS: readonly ComponentDoc[] = [...DRAFTS.values()]
	.map((draft) => ({
		slug: draft.slug,
		title: draft.title,
		summary: draft.summary,
		packageName: `@sushindustries/${draft.pkg}`,
		sections: SECTION_ORDER.filter((id) => draft.sections.has(id)).map(
			(id) => ({
				id,
				label: SECTION_LABELS[id],
				body: draft.sections.get(id) ?? "",
			}),
		),
	}))
	.sort((a, b) => a.title.localeCompare(b.title));

export function listComponentDocs(): readonly ComponentDoc[] {
	return DOCS;
}

export function findComponentDoc(slug: string): ComponentDoc | undefined {
	return DOCS.find((doc) => doc.slug === slug);
}
