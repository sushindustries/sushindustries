import { createHash } from "node:crypto";
import type { WriteResult } from "../../studio.schemas";
import type { Writer } from "../../writers/writers.server";

/*
 * What every action needs, and nothing any single one owns.
 *
 * The five planners were one 497-line file, which measurement rather than
 * taste flagged: it was the largest file in the studio and the only one with
 * more than three functions. Splitting it one-file-per-action makes the shape
 * obvious - each file is a question ("what does moving a slug touch?") and its
 * whole answer - and leaves this, which is the part they genuinely share.
 *
 * The test for what belongs here: **two planners use it.** A helper only
 * `create` needs lives with `create`, because a shared module that collects
 * everything is the file the split was undoing.
 */

export interface Plan {
	readonly changes: WriteResult["changes"];
	readonly breaks: WriteResult["breaks"];
	readonly writes: readonly { path: string; text: string }[];
	readonly deletes: readonly string[];
	readonly message: string;
	readonly commitMessage: string;
}
/** Where each authorable kind's files live, as a path with the slug in it. */
export const TEMPLATES = {
	post: { template: "post", target: "apps/web/content/posts/{slug}.md" },
	page: { template: "page", target: "apps/web/content/pages/{slug}.md" },
	collection: {
		template: "collection",
		target: "apps/web/content/collections/{slug}.md",
	},
	component: {
		template: "component-index",
		target: "packages/ui/docs/{slug}/index.md",
	},
	package: {
		template: "package-readme",
		target: "packages/{slug}/README.md",
	},
} as const;
/**
 * Kinds a rename can be trusted with, and the ones it cannot.
 *
 * A post or a page is one Markdown file whose name is its slug, so moving it
 * is moving a file. A component is a source file, five docs, a registry entry
 * and every import of it; a package is a directory, a workspace entry, a
 * Dockerfile line and a dependency in whatever depends on it. Renaming the
 * documents of either would leave the code at the old name and the prose at
 * the new one, which is worse than not renaming - it looks done.
 *
 * So this refuses, and says which files it would have missed. A refusal that
 * names the work is a refusal somebody can act on; `pnpm new` plus a delete is
 * the honest path for the other two, and the plan says so.
 */
export const MOVABLE = new Set(["post", "page", "desk"]);
/**
 * The content hash, computed the same way `sync` computes the one it stores.
 *
 * Same algorithm, same encoding, so an editor holding a `sha` from the
 * projection can compare it against a file on disk and get a meaningful
 * answer. Two hashes of the same bytes that disagree because one of them
 * hashed a trimmed string is the kind of bug that only shows up as a save
 * being refused for no visible reason.
 */
export const sha256 = (value: string) =>
	createHash("sha256").update(value).digest("hex");
/** `{token}` substitution, the same one `scripts/templates.mjs` uses. */
export const fill = (text: string, tokens: Record<string, string>) =>
	text.replace(/\{(\w+)\}/g, (whole, key) => tokens[key] ?? whole);
/** `doc-aside` → `Doc Aside`. */
export const titleCase = (value: string) =>
	value
		.split("-")
		.map((word) => word[0]?.toUpperCase() + word.slice(1))
		.join(" ");
/**
 * A template, read through the writer rather than off the disk.
 *
 * This is what lets `create` work in production. `scripts/new.mjs` reads
 * `templates/` with `node:fs`, which is correct for the command a person runs
 * and useless in a container that has no repository in it - so the templates
 * are fetched the same way everything else is fetched, and there is still only
 * one set of them.
 *
 * The `<!-- template ... -->` header is stripped, exactly as the script does,
 * which is why a template file is a working preview of its own output.
 */
export async function readTemplate(
	writer: Writer,
	name: string,
): Promise<string> {
	const raw = await writer.read(`templates/${name}.md`);
	if (!raw) throw new Error(`No template called ${name}.`);

	return raw.replace(/^<!--\s*template\n[\s\S]*?-->\n/, "");
}
/**
 * Rewrites the frontmatter of a document, and only the frontmatter.
 *
 * A line-level edit rather than a YAML parse and re-serialise. Parsing would
 * reformat the whole block - quoting, key order, the comment above `image:` -
 * turning a one-word title change into a diff nobody can review. Touching the
 * one line means the diff is the change.
 */
export function setFrontmatter(
	text: string,
	fields: Record<string, string | undefined>,
): string {
	const end = text.indexOf("\n---", 4);
	if (!text.startsWith("---\n") || end === -1) {
		throw new Error("That document has no frontmatter to change.");
	}

	let block = text.slice(4, end);

	for (const [key, value] of Object.entries(fields)) {
		if (value === undefined) continue;

		// Quoted only when it has to be. A colon or a leading quote turns a
		// scalar into something YAML reads as structure.
		const safe = /^[^"'\s][^:#]*$/.test(value) ? value : JSON.stringify(value);
		const line = `${key}: ${safe}`;
		const pattern = new RegExp(`^${key}:.*$`, "m");

		block = pattern.test(block)
			? block.replace(pattern, line)
			: `${block}\n${line}`;
	}

	return `---\n${block}${text.slice(end)}`;
}
/** What a document's route would be. Used to work out what a move breaks. */
export const routeFor = (kind: string, value: string) =>
	kind === "post"
		? `/posts/${value}`
		: kind === "page"
			? `/p/${value}`
			: kind === "component"
				? `/components/${value}`
				: kind === "package"
					? `/packages/${value}`
					: null;
