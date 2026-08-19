/*
 * `persona.md` in, a system message and the call's settings out.
 *
 * The prompt is a Markdown file for the same reason the glyphs and the devices
 * are tables: it is content. It is edited far more often than the code around
 * it, it wants prose beside it explaining the constraints it imposes, and a
 * prompt buried in a TypeScript string is a prompt nobody reads in review.
 *
 * Not generated, though - unlike the glyphs and the devices, nothing has to be
 * compiled from it into another language, so it is simply parsed where it is
 * used. Generating a `.ts` copy would be a second file to keep in step for no
 * gain at all.
 */

export interface Persona {
	/** Everything under `## System`. What is actually sent. */
	readonly system: string;
	readonly model: string;
	readonly temperature: number;
	readonly maxTokens: number;
}

/*
 * `llama-3.3-70b-versatile` was here and Groq has since retired it - the key
 * authenticates, the model 404s, and the panel reports a broken assistant for
 * a reason no log makes obvious. A hosted model is not a constant; it is
 * someone else's deployment, and it can be withdrawn between two deploys of
 * this repo.
 *
 * The default is therefore a model checked against `/v1/models` on the day it
 * was set. `meta.model` in the persona document still overrides it, which is
 * where a per-deployment choice belongs.
 */
const DEFAULTS = {
	model: "openai/gpt-oss-120b",
	temperature: 0.6,
	maxTokens: 700,
} as const;

/*
 * A flat `key: value` block, which is all the frontmatter here ever is.
 *
 * Deliberately not a YAML parser: this file has four scalar keys and reaching
 * for a dependency to read four scalars is how a package grows a supply chain.
 * A nested value would silently parse as a string, which is why the shape is
 * stated in `Persona` rather than inferred.
 */
function frontmatter(source: string): Record<string, string> {
	const match = /^---\r?\n([\s\S]*?)\r?\n---/.exec(source);
	if (!match?.[1]) return {};

	const out: Record<string, string> = {};

	for (const line of match[1].split("\n")) {
		const at = line.indexOf(":");
		if (at < 1) continue;

		out[line.slice(0, at).trim()] = line.slice(at + 1).trim();
	}

	return out;
}

/*
 * From the `## System` heading to the next heading of the same level.
 *
 * Walked line by line rather than matched with one regular expression. The
 * regex for "up to the next heading or the end of the file" needs a lookahead
 * that means two different things depending on the multiline flag, and getting
 * it subtly wrong returns an empty system message - which does not throw, does
 * not warn, and produces a model with no instructions that answers anything at
 * all. This version is longer and cannot do that.
 */
function systemSection(source: string): string {
	const lines = source.split("\n");
	const start = lines.findIndex((line) => /^##\s+System\s*$/.test(line));
	if (start < 0) return "";

	const body: string[] = [];

	for (const line of lines.slice(start + 1)) {
		if (/^##\s/.test(line)) break;
		body.push(line);
	}

	return body.join("\n").trim();
}

function number(value: string | undefined, fallback: number): number {
	const parsed = Number(value);
	return Number.isFinite(parsed) ? parsed : fallback;
}

/**
 * Read a persona file.
 *
 * The system message is the `## System` section and nothing else. Everything
 * above it is documentation for whoever opens the file, and sending it would
 * mean every note about *why* a rule exists is also an instruction - which is
 * how a prompt ends up arguing with itself.
 */
export function parsePersona(source: string): Persona {
	const meta = frontmatter(source);

	return {
		system: systemSection(source),
		model: meta.model ?? DEFAULTS.model,
		temperature: number(meta.temperature, DEFAULTS.temperature),
		maxTokens: number(meta.maxTokens, DEFAULTS.maxTokens),
	};
}

/**
 * What the model is told about where it is running.
 *
 * Appended to the system message rather than sent as a user turn, because it
 * is a fact about the situation and not something anybody asked. A user turn
 * would also be visible in the transcript, and "the reader is on a phone" is
 * not a thing the reader typed.
 *
 * The machine comes from the same table the stylesheet uses, so what the model
 * is told and what is actually drawn cannot disagree.
 */
export function situate(persona: Persona, device: string | null): string {
	if (!device) return persona.system;

	return `${persona.system}\n\nThe reader is looking at this on a ${device}.`;
}
