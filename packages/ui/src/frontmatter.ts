/*
 * A deliberately small frontmatter reader.
 *
 * TanStack Markdown hands back the frontmatter block as a raw string and stops
 * there, which is the right call - it is a Markdown parser, not a YAML one.
 * This covers the subset that content files actually use: `key: value` and
 * inline `[a, b]` lists.
 *
 * It is not YAML and does not pretend to be. No anchors, no nesting, no block
 * scalars. If a content file ever needs those, the honest fix is to add a real
 * YAML parser, not to grow this one until it is a bad one.
 */

export type FrontmatterValue = string | readonly string[];
export type Frontmatter = Readonly<Record<string, FrontmatterValue>>;

/**
 * The `---` block and everything after it, told apart.
 *
 * `parseFrontmatter` reads a block; this is what finds one. They are separate
 * because a Markdown parser that reports frontmatter usually hands back the
 * original source with it - so a caller that only parses renders the metadata
 * as a paragraph of text at the top of the page.
 *
 * This existed five times in this repository, once per catalogue, and the
 * copies had drifted: four matched `\r?\n` and the fifth did not, so a page
 * saved with Windows line endings would have had no title, no summary, and its
 * own frontmatter printed as prose. Nothing failed, nothing warned, and the
 * only symptom was one page looking wrong.
 *
 * That is the whole argument for it living here. A regular expression copied
 * five times is five chances to be right, and the one that is wrong is the one
 * nobody reads.
 */
export function splitFrontmatter(raw: string): {
	frontmatter: string;
	body: string;
} {
	// `\r?` on both newlines: CRLF is what an editor on Windows writes, and a
	// file that round-tripped through one is indistinguishable otherwise.
	const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(raw);

	if (!match) return { frontmatter: "", body: raw };

	return { frontmatter: match[1] ?? "", body: raw.slice(match[0].length) };
}

function stripQuotes(value: string): string {
	const trimmed = value.trim();

	if (trimmed.length < 2) return trimmed;

	const first = trimmed[0];
	const last = trimmed[trimmed.length - 1];

	if ((first === '"' && last === '"') || (first === "'" && last === "'")) {
		return trimmed.slice(1, -1);
	}

	return trimmed;
}

export function parseFrontmatter(raw: string | undefined): Frontmatter {
	if (!raw) return {};

	const result: Record<string, FrontmatterValue> = {};

	for (const line of raw.split("\n")) {
		const trimmed = line.trim();

		// Blank lines and comments carry nothing.
		if (!trimmed || trimmed.startsWith("#")) continue;

		const separator = trimmed.indexOf(":");
		if (separator === -1) continue;

		const key = trimmed.slice(0, separator).trim();
		const value = trimmed.slice(separator + 1).trim();

		if (!key) continue;

		if (value.startsWith("[") && value.endsWith("]")) {
			result[key] = value
				.slice(1, -1)
				.split(",")
				.map(stripQuotes)
				.filter((entry) => entry.length > 0);
			continue;
		}

		result[key] = stripQuotes(value);
	}

	return result;
}

/** Frontmatter values are `string | string[]`; most call sites want one string. */
export function readString(
	frontmatter: Frontmatter,
	key: string,
	fallback = "",
): string {
	const value = frontmatter[key];
	return typeof value === "string" ? value : fallback;
}

export function readList(
	frontmatter: Frontmatter,
	key: string,
): readonly string[] {
	const value = frontmatter[key];
	if (Array.isArray(value)) return value;
	return typeof value === "string" && value.length > 0 ? [value] : [];
}
