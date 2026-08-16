import { skillSchema } from "@sushindustries/assistant";
import { toolDefinition } from "@tanstack/ai";
import { z } from "zod";
import { boundSkills } from "./skills.server";

/*
 * Skills, as TanStack AI tools.
 *
 * One adapter, in one place. `skills.server.ts` knows what this site can do and
 * `packages/assistant` knows what a skill is; neither imports TanStack AI, so
 * neither has an opinion about which SDK is on the wire. This file is the only
 * thing that would change to move to a different one.
 *
 * The input schema is built from the Markdown table rather than hand-written in
 * Zod. That is the whole reason the skills are Markdown: the description a
 * model reads to fill an argument sits beside the argument, in prose, in a file
 * anybody can review - and it cannot drift from the schema because it *is* the
 * schema.
 */

/** A skill's parameter table as the Zod object TanStack AI wants. */
function inputSchema(schema: ReturnType<typeof skillSchema>): z.ZodTypeAny {
	const shape: Record<string, z.ZodTypeAny> = {};

	for (const [name, property] of Object.entries(schema.properties)) {
		const base =
			property.type === "number"
				? z.number()
				: property.type === "boolean"
					? z.boolean()
					: z.string();

		/*
		 * `.describe()` is not decoration. It is what lands in the JSON Schema
		 * the provider sees, and it is the only thing telling the model what to
		 * put in this argument - a parameter with a name and no description is a
		 * parameter filled by guessing.
		 */
		const described = base.describe(property.description);

		shape[name] = schema.required.includes(name)
			? described
			: described.optional();
	}

	return z.object(shape);
}

export const chatTools = boundSkills.map(({ skill, run }) =>
	toolDefinition({
		name: skill.name,
		description: skill.summary,
		inputSchema: inputSchema(skillSchema(skill)),
	}).server(async (args) => {
		const result = await run(args as Record<string, string | number | boolean>);

		/*
		 * Always an object, never a bare null.
		 *
		 * A tool that returns null gives the model nothing to reason about, and
		 * the reliable failure is that it calls the same tool again with the same
		 * arguments. `{ result: null }` is a fact it can report.
		 */
		return { result: result ?? null };
	}),
);
