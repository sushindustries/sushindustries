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
 *   sitemap.xml     the canonical URL list, for search crawlers
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
			lines.push("---");
			lines.push(`title: ${entry.title}`);
			lines.push(`section: ${section.title}`);
			if (entry.description) {
				lines.push(`description: ${entry.description}`);
			}
			lines.push(`source: ${url(site.origin, entry.path)}`);
			lines.push("---", "");

			if (entry.body) lines.push(entry.body.trim(), "");
		}
	}

	return `${lines.join("\n")}\n`;
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

export function renderSitemap(site: SiteDescription): string {
	const paths = [
		...(site.extraPaths ?? []),
		...site.sections.flatMap((section) =>
			section.entries
				.filter((entry) => !entry.noindex)
				.map((entry) => entry.path),
		),
	];

	// A duplicate <loc> is not an error, but it is a sign the caller's lists
	// overlap, and deduping here is cheaper than every caller remembering.
	const unique = [...new Set(paths)];

	const body = unique
		.map(
			(path) => `\t<url><loc>${escapeXml(url(site.origin, path))}</loc></url>`,
		)
		.join("\n");

	return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${body}
</urlset>
`;
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
