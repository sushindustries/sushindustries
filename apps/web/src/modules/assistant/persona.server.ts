import { parsePersona } from "@sushindustries/assistant";
import source from "@sushindustries/assistant/persona?raw";
import type { createGroqText } from "@tanstack/ai-groq";

/*
 * The persona, read once at build time.
 *
 * `?raw` inlines the Markdown into the bundle, which is the same thing the
 * post and package catalogues do: the content is static, public and identical
 * for every visitor, so reading it from disk per request would be a filesystem
 * call to answer a question the bundler already answered.
 *
 * `.server.ts` because it has no business in the client bundle. It is not
 * secret - it ships in the package and is one jailbreak away from being quoted
 * back anyway - but sending a system prompt to every visitor of every page is
 * a kilobyte spent on nothing, and the boundary is easier to keep than to
 * re-argue later.
 */
const parsed = parsePersona(source);

/*
 * The model name, checked against the ones Groq actually serves.
 *
 * `createGroqText` takes a union rather than a string, which is the adapter
 * doing this repo a favour: `model:` in `persona.md` is free text, and a typo
 * in it would otherwise be a 404 from Groq at the first message somebody sent
 * rather than an error at build time.
 *
 * The cast is the boundary between a Markdown file and a typed API, and the
 * check below is what makes it honest - it is a cast that has been verified,
 * not a cast that has been asserted.
 */
const MODELS = [
	"llama-3.1-8b-instant",
	"llama-3.3-70b-versatile",
] as const satisfies readonly GroqModel[];

type GroqModel = Parameters<typeof createGroqText>[0];

function model(name: string): GroqModel {
	const found = MODELS.find((known) => known === name);

	if (!found) {
		throw new Error(
			`persona.md names the model "${name}", which is not one of: ${MODELS.join(", ")}`,
		);
	}

	return found;
}

export const persona = { ...parsed, model: model(parsed.model) };

export { situate } from "@sushindustries/assistant";
