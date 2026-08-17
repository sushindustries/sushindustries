import type { IconName } from "@sushindustries/ui";
import source from "../../../content/assistant.md?raw";

/*
 * What the assistant says before it is asked anything, read from
 * `content/assistant.md`.
 *
 * The same contract as `nav.md`, `shelf.md` and `footer.md`, and here for the
 * same reason: the greeting, the links under it and the questions it offers
 * are copy, and copy on this site lives in Markdown. Hard-coding them puts
 * three strings a non-programmer would want to change inside a component, and
 * the panel is the first thing anybody reads.
 *
 * Build-time, from `?raw`, so this costs nothing at runtime and cannot fail on
 * a request.
 */

export interface AssistantLink {
	readonly label: string;
	readonly href: string;
	readonly icon?: IconName;
}

/** One list line: `- [label](href) \`icon\`` */
const LINK = /^\s*-\s+\[([^\]]+)\]\(([^)]+)\)(?:\s+`([^`]+)`)?\s*$/;
/** One list line with no link: an opener. */
const PLAIN = /^\s*-\s+(?!\[)(.+?)\s*$/;

/*
 * A section's body: everything after its heading, up to the next one.
 *
 * Located by heading text rather than by position, so reordering the document
 * cannot silently swap the greeting for the openers.
 */
function section(heading: string): string {
	const at = source.indexOf(`## ${heading}`);
	if (at === -1) return "";

	const body = source.slice(at + heading.length + 3);
	const next = body.indexOf("\n## ");
	return next === -1 ? body : body.slice(0, next);
}

/*
 * The greeting: the last paragraph of its section.
 *
 * The section explains itself first - that text is a note to whoever edits the
 * file, not something to show a reader - so the greeting is the final block,
 * and a paragraph is anything separated by a blank line that is not a list.
 */
export function assistantGreeting(): string {
	const paragraphs = section("The greeting")
		.split("\n\n")
		.map((block) => block.trim())
		.filter((block) => block && !block.startsWith("-"));

	return paragraphs.at(-1)?.replace(/\n/g, " ") ?? "";
}

export function assistantLinks(): readonly AssistantLink[] {
	const links: AssistantLink[] = [];

	for (const line of section("Elsewhere").split("\n")) {
		const match = LINK.exec(line);
		if (!match) continue;

		const [, label = "", href = "", icon] = match;
		links.push({ label, href, icon: icon as IconName | undefined });
	}

	return links;
}

/** The questions offered as pills. Each is sent verbatim when pressed. */
export function assistantOpeners(): readonly string[] {
	const openers: string[] = [];

	for (const line of section("Openers").split("\n")) {
		const match = PLAIN.exec(line);
		if (!match?.[1]) continue;
		openers.push(match[1]);
	}

	return openers;
}
