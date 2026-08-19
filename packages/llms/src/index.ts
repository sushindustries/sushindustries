/*
 * Machine-readable indexes for a site, from one description of it.
 *
 * Strings in, strings out. No framework, no filesystem, no router - which is
 * what lets the same description drive a server route, a build script writing
 * files to disk, or a test asserting the output.
 *
 * The four surfaces are layered on purpose:
 *
 *   llms.txt        the map - one line per page, with a description
 *   llms-full.txt   the territory - every page's text, inlined
 *   sitemap.xml     the canonical URL list, for search crawlers - flat, or
 *                   as an index of per-section shards
 *   robots.txt      the rules, pointing at the other three
 *
 * A reader that only needs to know what exists fetches the index and stops.
 * One that needs the content fetches the full file and needs nothing else.
 * Publishing only the full version makes every lookup expensive; publishing
 * only the index makes it a round trip per page.
 */

export interface SiteEntry {
	/** Site-relative path, with a leading slash. */
	readonly path: string;
	readonly title: string;
	readonly description?: string;
	/** Source text for the full-text file. Markdown is the usual case. */
	readonly body?: string;
	/** Excluded from the sitemap but kept in the index. */
	readonly noindex?: boolean;
}

export interface SiteSection {
	readonly title: string;
	readonly description?: string;
	readonly entries: readonly SiteEntry[];
}

export interface SiteDescription {
	/** Absolute origin, no trailing slash. e.g. `https://example.com` */
	readonly origin: string;
	readonly title: string;
	/** One line under the title. */
	readonly summary?: string;
	/** A blockquote under the summary: how to read the rest. */
	readonly framing?: string;
	readonly sections: readonly SiteSection[];
	/** Paths with no entry of their own - section indexes, the home page. */
	readonly extraPaths?: readonly string[];
}

/** Joins an origin and a path without doubling or dropping the slash. */
function url(origin: string, path: string): string {
	const base = origin.replace(/\/+$/, "");
	return path.startsWith("/") ? `${base}${path}` : `${base}/${path}`;
}

function header(site: SiteDescription): string[] {
	const lines = [`# ${site.title}`, ""];

	if (site.summary) lines.push(site.summary, "");
	if (site.framing) lines.push(`> ${site.framing}`, "");

	return lines;
}

/** `- [Title](url): description` */
function entryLine(site: SiteDescription, entry: SiteEntry): string {
	const link = `- [${entry.title}](${url(site.origin, entry.path)})`;
	return entry.description ? `${link}: ${entry.description}` : link;
}

/**
 * The index: every page as one line, grouped by section.
 *
 * `extraLinks` appends a final section, which is how the index points at the
 * full-text file without this module having to assume that file's path.
 */
export function renderLlmsIndex(
	site: SiteDescription,
	extraLinks?: { title: string; entries: readonly SiteEntry[] },
): string {
	const lines = header(site);

	for (const section of site.sections) {
		if (section.entries.length === 0) continue;

		lines.push(`## ${section.title}`, "");
		if (section.description) lines.push(section.description, "");

		for (const entry of section.entries) lines.push(entryLine(site, entry));
		lines.push("");
	}

	if (extraLinks && extraLinks.entries.length > 0) {
		lines.push(`## ${extraLinks.title}`, "");
		for (const entry of extraLinks.entries) lines.push(entryLine(site, entry));
		lines.push("");
	}

	return `${lines.join("\n")}\n`;
}

/**
 * The same structure with each entry's text inlined.
 *
 * Each page is delimited by a `---` rule and introduced by its own frontmatter
 * block, rather than by a heading. That is deliberate and it is the difference
 * between a file a human can read and a file a program can split: headings are
 * ambiguous, because the page content contains headings too, so a parser has
 * no reliable way to tell where one document ends. A rule followed by
 * frontmatter is unambiguous.
 *
 * Entries without a body still appear with their URL. "This page exists and I
 * have no text for it" is more useful than silence.
 */
export function renderLlmsFull(
	site: SiteDescription,
	options: { indexPath?: string } = {},
): string {
	const lines = header(site);

	if (options.indexPath) {
		lines.push(
			`Fetch the page index at: ${url(site.origin, options.indexPath)}`,
			"",
		);
	}

	for (const section of site.sections) {
		if (section.entries.length === 0) continue;

		for (const entry of section.entries) {
			lines.push(renderPageDocument(site, entry, { section: section.title }));
		}
	}

	return `${lines.join("\n")}\n`;
}

/**
 * One page as a standalone document: the frontmatter block that names it,
 * then its text.
 *
 * Exported because a site that also mirrors each page at its own URL needs
 * exactly one page's worth of this, and a second implementation of a wire
 * format is a second thing to keep in step. `renderLlmsFull` is now this
 * function in a loop.
 */
export function renderPageDocument(
	site: SiteDescription,
	entry: SiteEntry,
	options: { section?: string } = {},
): string {
	const lines = ["---", `title: ${entry.title}`];

	if (options.section) lines.push(`section: ${options.section}`);
	if (entry.description) lines.push(`description: ${entry.description}`);

	lines.push(`source: ${url(site.origin, entry.path)}`);
	lines.push("---", "");

	if (entry.body) lines.push(entry.body.trim(), "");

	return lines.join("\n");
}

/**
 * One section as a Markdown listing: its heading, its description, and one
 * line per entry in the same shape `llms.txt` uses.
 */
export function renderSectionIndex(
	site: SiteDescription,
	section: SiteSection,
): string {
	const lines = [`# ${section.title}`, ""];

	if (section.description) lines.push(section.description, "");

	for (const entry of section.entries) lines.push(entryLine(site, entry));
	lines.push("");

	return lines.join("\n");
}

/** The five characters that are not legal as XML text. */
function escapeXml(value: string): string {
	return value
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&apos;");
}

/** One `<urlset>` for a list of paths. The shared shape of every shard. */
export function renderUrlset(origin: string, paths: readonly string[]): string {
	// A duplicate <loc> is not an error, but it is a sign the caller's lists
	// overlap, and deduping here is cheaper than every caller remembering.
	const unique = [...new Set(paths)];

	const body = unique
		.map((path) => `\t<url><loc>${escapeXml(url(origin, path))}</loc></url>`)
		.join("\n");

	return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${body}
</urlset>
`;
}

export function renderSitemap(site: SiteDescription): string {
	const paths = [
		...(site.extraPaths ?? []),
		...site.sections.flatMap((section) =>
			section.entries
				.filter((entry) => !entry.noindex)
				.map((entry) => entry.path),
		),
	];

	return renderUrlset(site.origin, paths);
}

export interface SitemapShard {
	/** Site-relative path the shard is served at, e.g. `/sitemap-0.xml`. */
	readonly path: string;
	/** The page paths this shard lists, deduped, `noindex` already dropped. */
	readonly paths: readonly string[];
}

/*
 * The sharded form of the same sitemap: one shard per section, so a crawler
 * that saw one section change refetches one small file rather than the whole
 * roster, and adding a section adds a shard without touching any route.
 *
 * Shard 0 carries the paths only `extraPaths` knows about - the home page and
 * the section indexes. Entry paths repeated in `extraPaths` are dropped there
 * rather than deduped later, so no URL appears in two shards.
 *
 * Shards are numbered, not named: the number scheme lets a section be renamed
 * without invalidating the shard URL a crawler already holds. A section whose
 * entries are all `noindex` gets no shard - an empty urlset in the index is a
 * crawl request that returns nothing.
 */
export function sitemapShards(site: SiteDescription): readonly SitemapShard[] {
	/*
	 * Only indexable entries claim their path: a `noindex` entry appears in no
	 * shard, so letting it knock the same path out of the extras would drop
	 * that URL from the sitemap entirely. The home page sat behind exactly
	 * this - capability entries pointing at `/` are noindex, and `/` still has
	 * to be published by shard 0.
	 */
	const entryPaths = new Set(
		site.sections.flatMap((section) =>
			section.entries
				.filter((entry) => !entry.noindex)
				.map((entry) => entry.path),
		),
	);
	const extras = [
		...new Set((site.extraPaths ?? []).filter((path) => !entryPaths.has(path))),
	];

	const groups: (readonly string[])[] = [];
	if (extras.length > 0) groups.push(extras);

	for (const section of site.sections) {
		const paths = [
			...new Set(
				section.entries
					.filter((entry) => !entry.noindex)
					.map((entry) => entry.path),
			),
		];
		if (paths.length > 0) groups.push(paths);
	}

	return groups.map((paths, index) => ({
		path: `/sitemap-${index}.xml`,
		paths,
	}));
}

/**
 * The `<sitemapindex>` pointing at the shards.
 *
 * `shardPaths` overrides the derived list, which is how a second index (say,
 * one for a site's Markdown mirrors) reuses the rendering without pretending
 * its shards come from the sections.
 */
export function renderSitemapIndex(
	site: SiteDescription,
	shardPaths?: readonly string[],
): string {
	const paths = shardPaths ?? sitemapShards(site).map((shard) => shard.path);

	const body = paths
		.map(
			(path) =>
				`\t<sitemap><loc>${escapeXml(url(site.origin, path))}</loc></sitemap>`,
		)
		.join("\n");

	return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${body}
</sitemapindex>
`;
}

/** One shard as a urlset, or undefined when the number names no shard. */
export function renderSitemapShard(
	site: SiteDescription,
	shard: number,
): string | undefined {
	const found = sitemapShards(site)[shard];
	return found ? renderUrlset(site.origin, found.paths) : undefined;
}

export interface RobotsOptions {
	/** Path prefixes to keep crawlers out of, e.g. `["/preview/"]`. */
	readonly disallow?: readonly string[];
	/**
	 * Content-Signal declarations, stating what this content may be used for.
	 *
	 * Written above the user-agent block because it applies to the whole file
	 * rather than to one agent. Omitting it is not the same as declining: it
	 * leaves the question unanswered, which is how it gets answered for you.
	 */
	readonly contentSignal?: {
		readonly aiTrain: boolean;
		readonly search: boolean;
		readonly aiInput: boolean;
	};
	/** Defaults to `/sitemap.xml`. Pass `null` to omit the line. */
	readonly sitemapPath?: string | null;
	/** Referenced as comments, so a reader that follows them finds the indexes. */
	readonly indexPaths?: readonly string[];
}

export function renderRobots(
	site: SiteDescription,
	options: RobotsOptions = {},
): string {
	const {
		disallow = [],
		sitemapPath = "/sitemap.xml",
		indexPaths = [],
		contentSignal,
	} = options;

	const lines: string[] = [];

	if (contentSignal) {
		const yesNo = (value: boolean): string => (value ? "yes" : "no");

		lines.push(
			`Content-Signal: ai-train=${yesNo(contentSignal.aiTrain)}, search=${yesNo(contentSignal.search)}, ai-input=${yesNo(contentSignal.aiInput)}`,
			"",
		);
	}

	lines.push("User-agent: *", "Allow: /");

	for (const path of disallow) lines.push(`Disallow: ${path}`);

	if (sitemapPath) {
		lines.push("", `Sitemap: ${url(site.origin, sitemapPath)}`);
	}

	if (indexPaths.length > 0) {
		lines.push("", "# Plain-text indexes for assistants.");
		for (const path of indexPaths) lines.push(`# ${url(site.origin, path)}`);
	}

	return `${lines.join("\n")}\n`;
}

/* ── reading a document back ─────────────────────────────────────────── */

export interface DocHeading {
	readonly level: number;
	readonly title: string;
	/** The text under this heading, up to the next one of the same level or higher. */
	readonly body: string;
}

export interface DocFence {
	readonly language: string;
	readonly code: string;
}

export interface ParsedDoc {
	readonly frontmatter: Readonly<Record<string, string>>;
	readonly title?: string;
	readonly summary?: string;
	/** Everything before the first heading. What the page opens with. */
	readonly lead: string;
	readonly headings: readonly DocHeading[];
	readonly fences: readonly DocFence[];
	/** Site-relative links, deduplicated, in the order they appear. */
	readonly links: readonly string[];
	readonly words: number;
}

/**
 * A Markdown document, read as structure rather than as a blob.
 *
 * Every surface above renders documents outwards; this reads one back in, and
 * it exists because handing an agent nine kilobytes of Markdown to answer
 * "what props does this take" is the expensive way to say something short.
 * With the sections named, a caller can ask for the one it wants.
 *
 * Deliberately not a Markdown parser. It recognises frontmatter, ATX
 * headings, fenced code and links, and it ignores everything else - which is
 * enough to describe a document and far less than enough to render one. The
 * moment this needs to understand emphasis, the answer is that the caller
 * wanted the raw text and should have asked for it.
 *
 * Fenced code is cut out before headings are scanned. A `#` at the start of a
 * line inside a shell block is a comment, and counting it as a section is the
 * failure this ordering exists to avoid.
 */
export function parseDoc(source: string): ParsedDoc {
	const { frontmatter, body } = splitFrontmatter(source);

	const fences: DocFence[] = [];
	// Replaced by blank lines of the same count, so every line number below
	// still corresponds to the line it came from.
	const withoutFences = body.replace(
		/^```([\w-]*)[^\n]*\n([\s\S]*?)^```[^\n]*$/gm,
		(whole, language: string, code: string) => {
			fences.push({
				language: language || "text",
				code: code.replace(/\n$/, ""),
			});
			return "\n".repeat(whole.split("\n").length - 1);
		},
	);

	const lines = withoutFences.split("\n");
	const marks: { level: number; title: string; at: number }[] = [];
	for (const [at, line] of lines.entries()) {
		const heading = /^(#{1,6})\s+(.*)$/.exec(line);
		if (heading) {
			marks.push({
				level: (heading[1] ?? "").length,
				title: (heading[2] ?? "").trim(),
				at,
			});
		}
	}

	const headings = marks.map((mark, index) => ({
		level: mark.level,
		title: mark.title,
		body: lines
			.slice(mark.at + 1, marks[index + 1]?.at ?? lines.length)
			.join("\n")
			.trim(),
	}));

	const lead = lines
		.slice(0, marks[0]?.at ?? lines.length)
		.join("\n")
		.trim();

	const links = [
		...new Set(
			[...body.matchAll(/\]\((\/[^)\s]*)\)/g)].flatMap(
				([, href]) => href ?? [],
			),
		),
	];

	return {
		frontmatter,
		title: frontmatter.title ?? marks.find((mark) => mark.level === 1)?.title,
		summary: frontmatter.summary,
		lead,
		headings,
		fences,
		links,
		words: withoutFences.split(/\s+/).filter(Boolean).length,
	};
}

/**
 * The `---` block at the top, as flat key/value pairs.
 *
 * Flat because that is all this repo's frontmatter ever is: a title, a
 * summary, a date, a tag list left as its literal text. Parsing YAML properly
 * would be a dependency bought to read six keys.
 */
function splitFrontmatter(source: string): {
	frontmatter: Record<string, string>;
	body: string;
} {
	const match = /^---\n([\s\S]*?)\n---\n?/.exec(source);
	if (!match) return { frontmatter: {}, body: source };

	const frontmatter: Record<string, string> = {};
	for (const line of (match[1] ?? "").split("\n")) {
		const at = line.indexOf(":");
		if (at === -1 || line.startsWith("#")) continue;
		frontmatter[line.slice(0, at).trim()] = line
			.slice(at + 1)
			.trim()
			.replace(/^"(.*)"$/, "$1");
	}

	return { frontmatter, body: source.slice(match[0].length) };
}

/* ── what a reply costs ──────────────────────────────────────────────── */

/**
 * Roughly how many tokens a string will cost the model reading it.
 *
 * Four characters per token, which is the usual approximation for English
 * prose and close enough for the only decision it informs: whether to send a
 * document or to send its outline instead. A real tokeniser would be a
 * dependency, a model-specific answer, and a more precise number than a
 * threshold needs.
 *
 * It errs high on code and on anything with a lot of punctuation, which is the
 * direction to err in when the cost of being wrong is a blown context window.
 */
export function estimateTokens(value: string): number {
	return Math.ceil(value.length / 4);
}

export interface BudgetResult {
	readonly text: string;
	readonly tokens: number;
	readonly truncated: boolean;
}

/**
 * A reply cut to fit, with the cut declared in the reply itself.
 *
 * The failure this exists to prevent is quiet: a tool returns a document far
 * larger than anybody intended, the window fills, and the earliest and most
 * important part of the conversation is what gets dropped to make room. The
 * caller never sees a cause, only worse answers.
 *
 * So the truncation is loud. What is returned always says how much was cut and
 * what to do instead, because a reply that stops mid-sentence with no note is
 * indistinguishable from a document that simply ends there - and acting on a
 * half-read API table is worse than not reading it.
 */
export function withinBudget(
	value: string,
	maxTokens: number,
	advice = "Narrow the request and ask again.",
): BudgetResult {
	const tokens = estimateTokens(value);
	if (tokens <= maxTokens) return { text: value, tokens, truncated: false };

	const keep = maxTokens * 4;
	// Cut at a line, not mid-word: a truncated fence or table row reads as
	// malformed content rather than as a truncation.
	const cut = value.slice(0, keep);
	const text = cut.slice(0, Math.max(cut.lastIndexOf("\n"), 0) || keep);

	return {
		text: `${text}\n\n[cut here: this reply was about ${tokens.toLocaleString()} tokens, over the ${maxTokens.toLocaleString()} limit. ${advice}]`,
		tokens,
		truncated: true,
	};
}
