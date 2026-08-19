import type { Writer } from "../../writers/writers.server";
import type { DocumentAction } from "../documents.schemas";
import {
	fill,
	type Plan,
	readTemplate,
	TEMPLATES,
	titleCase,
} from "./shared.server";

/*
 * Creating something, from this repository's own templates.
 *
 * It renders the same files `pnpm new` renders, read through the writer rather
 * than off the disk - which is what lets it work in production, where there is
 * no checkout for `node:fs` to read.
 *
 * The one thing it refuses is overwriting. A create that lands on an existing
 * file is a create that silently became an edit, and the caller asked for
 * neither.
 */

export async function planCreate(
	writer: Writer,
	action: Extract<DocumentAction, { action: "create" }>,
): Promise<Plan> {
	const shape = TEMPLATES[action.kind];
	const target = fill(shape.target, { slug: action.slug });

	if (await writer.read(target)) {
		throw new Error(`${target} already exists. Pick another slug.`);
	}

	const body = fill(await readTemplate(writer, shape.template), {
		slug: action.slug,
		title: action.title ?? titleCase(action.slug),
		pascal: titleCase(action.slug).replaceAll(" ", ""),
		date: new Date().toISOString().slice(0, 10),
	});

	return {
		changes: [{ path: target, effect: "added" }],
		breaks: [],
		writes: [{ path: target, text: body }],
		deletes: [],
		message: `Creates ${target} from the ${shape.template} template.`,
		commitMessage: `feat(${action.kind}): add ${action.slug}`,
	};
}
