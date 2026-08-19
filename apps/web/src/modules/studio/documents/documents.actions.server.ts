import { createHash } from "node:crypto";
import { SITE } from "../../content/site.catalogue";
import type { WriteResult } from "../studio.schemas";
import { type Writer, writerFor } from "../writers/writers.server";
import type {
	DocumentAction,
	DocumentActionRequest,
} from "./documents.schemas";
import {
	getDocument as getDocumentByPath,
	getDocumentsBySlug,
	getDocumentsLinkingTo,
} from "./documents.server";

/*
 * The documents feature, writing.
 *
 * Every structural change the studio can make goes through `runDocumentAction`
 * and nothing else. One entry point rather than four exported verbs, because
 * the things that must happen around a write - parse, plan, check what breaks,
 * pick a writer, report what happened - are the same for all four, and four
 * exports means four places to leave one of them out.
 *
 * The shape of every action is the same:
 *
 *   1. work out which files it touches, from the projection
 *   2. work out what it breaks, from the projection
 *   3. build a batch of writes and deletes
 *   4. hand the batch to a writer, or not, depending on `apply`
 *
 * Step 4 is why a plan and a commit are the same code path. A dry run that
 * takes a different route through the function is a dry run that can disagree
 * with what actually happens, which is the one thing it exists not to do.
 *
 * The projection is read here rather than the filesystem, and that is a real
 * trade with a real cost: the projection is as old as the last `sync`, so a
 * file added since is invisible to a plan. It buys the same answer from a
 * laptop and from a container with no checkout, which is what makes the studio
 * work in production at all. `syncedAt` is on every screen for this reason.
 *
 * `.server.ts` because it writes to a repository.
 */

/** Where each authorable kind's files live, as a path with the slug in it. */
const TEMPLATES = {
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
const MOVABLE = new Set(["post", "page", "desk"]);

/**
 * The content hash, computed the same way `sync` computes the one it stores.
 *
 * Same algorithm, same encoding, so an editor holding a `sha` from the
 * projection can compare it against a file on disk and get a meaningful
 * answer. Two hashes of the same bytes that disagree because one of them
 * hashed a trimmed string is the kind of bug that only shows up as a save
 * being refused for no visible reason.
 */
const sha256 = (value: string) =>
	createHash("sha256").update(value).digest("hex");

/** `{token}` substitution, the same one `scripts/templates.mjs` uses. */
const fill = (text: string, tokens: Record<string, string>) =>
	text.replace(/\{(\w+)\}/g, (whole, key) => tokens[key] ?? whole);

/** `doc-aside` → `Doc Aside`. */
const titleCase = (value: string) =>
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
async function readTemplate(writer: Writer, name: string): Promise<string> {
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
function setFrontmatter(
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
const routeFor = (kind: string, value: string) =>
	kind === "post"
		? `/posts/${value}`
		: kind === "page"
			? `/p/${value}`
			: kind === "component"
				? `/components/${value}`
				: kind === "package"
					? `/packages/${value}`
					: null;

/* ── the actions ─────────────────────────────────────────────────────── */

interface Plan {
	readonly changes: WriteResult["changes"];
	readonly breaks: WriteResult["breaks"];
	readonly writes: readonly { path: string; text: string }[];
	readonly deletes: readonly string[];
	readonly message: string;
	readonly commitMessage: string;
}

async function planCreate(
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

async function planMove(
	writer: Writer,
	action: Extract<DocumentAction, { action: "move" }>,
): Promise<Plan> {
	if (!MOVABLE.has(action.kind)) {
		throw new Error(
			`A ${action.kind} is more than its documents - a source file, a registry entry, a workspace member and every import of it - and moving only the prose would leave the code at the old name. Scaffold the new one with \`pnpm new ${action.kind} ${action.to}\` and remove the old one deliberately.`,
		);
	}

	const found = await getDocumentsBySlug(action.kind, action.from);
	if (found.length === 0) {
		throw new Error(`No ${action.kind} called ${action.from}.`);
	}

	const clash = await getDocumentsBySlug(action.kind, action.to);
	if (clash.length > 0) {
		throw new Error(`There is already a ${action.kind} called ${action.to}.`);
	}

	const writes: { path: string; text: string }[] = [];
	const deletes: string[] = [];
	/*
	 * Mutable here, readonly in the result. `WriteResult["changes"]` is a
	 * readonly array because nothing downstream may edit a plan, and the place
	 * it is *built* is the one place that has to - so the element type is
	 * borrowed and the array is not.
	 */
	const changes: WriteResult["changes"][number][] = [];

	for (const document of found) {
		const to = document.path.replaceAll(action.from, action.to);
		const text = await writer.read(document.path);
		if (text === null) {
			throw new Error(
				`${document.path} is in the index but not in the repository. Run \`pnpm sushindustries sync\` and try again.`,
			);
		}

		writes.push({ path: to, text });
		deletes.push(document.path);
		changes.push({ path: document.path, effect: "moved", to });
	}

	/*
	 * What the old route was, and who pointed at it.
	 *
	 * Reported rather than rewritten. Editing every linking document to point
	 * at the new name would be the helpful version and is the wrong call here:
	 * a link inside a code fence, inside a quotation, or in a sentence about
	 * the old name would be rewritten too, and a rename that silently edits
	 * fourteen other files is a rename nobody can review.
	 */
	const old = routeFor(action.kind, action.from);
	const breaks = old
		? [{ route: old, linkedFrom: await getDocumentsLinkingTo(old) }]
		: [];

	return {
		changes,
		breaks,
		writes,
		deletes,
		message: `Moves ${found.length} file${found.length === 1 ? "" : "s"} from ${action.from} to ${action.to}.`,
		commitMessage: `refactor(${action.kind}): rename ${action.from} to ${action.to}`,
	};
}

async function planRetitle(
	writer: Writer,
	action: Extract<DocumentAction, { action: "retitle" }>,
): Promise<Plan> {
	const text = await writer.read(action.path);
	if (text === null) throw new Error(`No file at ${action.path}.`);

	const next = setFrontmatter(text, {
		title: action.title,
		summary: action.summary,
	});

	if (next === text) {
		return {
			changes: [],
			breaks: [],
			writes: [],
			deletes: [],
			message: "Nothing to change - it already says that.",
			commitMessage: "",
		};
	}

	return {
		changes: [{ path: action.path, effect: "changed" }],
		breaks: [],
		writes: [{ path: action.path, text: next }],
		deletes: [],
		message: `Rewrites the frontmatter of ${action.path}.`,
		commitMessage: `docs: retitle ${action.path}`,
	};
}

/**
 * The whole document, replaced.
 *
 * Two guards, and both matter. The path has to be a document the projection
 * knows about, so this cannot create a file somewhere of the caller's
 * choosing - that is `create`, and `create` only writes templates to paths a
 * template decides. And the `sha` the editor started from has to still be the
 * `sha` on disk, so a save cannot land on top of a change nobody has seen.
 *
 * The sha check compares against the *file*, not against the projection. The
 * projection is as old as the last sync and would happily agree with an editor
 * that is also out of date, which is exactly the case the check exists for.
 */
async function planEdit(
	writer: Writer,
	action: Extract<DocumentAction, { action: "edit" }>,
): Promise<Plan> {
	const known = await getDocumentByPath(action.path);
	if (!known) {
		throw new Error(
			`${action.path} is not a document in the index. Create it with \`create\` - this only rewrites what already exists.`,
		);
	}

	const current = await writer.read(action.path);
	if (current === null) {
		throw new Error(
			`${action.path} is in the index but not in the repository. Run \`pnpm sushindustries sync\` and try again.`,
		);
	}

	if (action.sha && sha256(current) !== action.sha) {
		throw new Error(
			"That file has changed since this editor opened it. Reload before saving, or the change you cannot see is the one that disappears.",
		);
	}

	if (current === action.body) {
		return {
			changes: [],
			breaks: [],
			writes: [],
			deletes: [],
			message: "Nothing to change - it already says that.",
			commitMessage: "",
		};
	}

	/*
	 * How much moved, in lines. A byte count is a number nobody can picture,
	 * and "changed 3 lines" against "changed 240" is the difference between a
	 * typo fix and a rewrite - which is the thing worth knowing before pressing
	 * apply.
	 */
	const before = current.split("\n");
	const after = action.body.split("\n");
	const touched =
		Math.abs(before.length - after.length) +
		before.filter((line, at) => at < after.length && line !== after[at]).length;

	return {
		changes: [{ path: action.path, effect: "changed" }],
		breaks: [],
		writes: [{ path: action.path, text: action.body }],
		deletes: [],
		message: `Rewrites ${action.path}. ${touched} line${touched === 1 ? "" : "s"} differ.`,
		commitMessage: `docs: edit ${action.path}`,
	};
}

async function planRemove(
	_writer: Writer,
	action: Extract<DocumentAction, { action: "remove" }>,
): Promise<Plan> {
	if (action.confirm !== action.slug) {
		throw new Error(
			"Type the slug again to confirm. This is the one action nothing undoes for you.",
		);
	}

	if (!MOVABLE.has(action.kind)) {
		throw new Error(
			`A ${action.kind} is more than its documents, and deleting only the prose would leave the code with nothing describing it. Remove it deliberately, in an editor, where the compiler can tell you what broke.`,
		);
	}

	const found = await getDocumentsBySlug(action.kind, action.slug);
	if (found.length === 0)
		throw new Error(`No ${action.kind} called ${action.slug}.`);

	const old = routeFor(action.kind, action.slug);

	return {
		changes: found.map((document) => ({
			path: document.path,
			effect: "removed" as const,
		})),
		breaks: old
			? [{ route: old, linkedFrom: await getDocumentsLinkingTo(old) }]
			: [],
		writes: [],
		deletes: found.map((document) => document.path),
		message: `Removes ${found.length} file${found.length === 1 ? "" : "s"}, and ${SITE.url}${old ?? ""} with them.`,
		commitMessage: `chore(${action.kind}): remove ${action.slug}`,
	};
}

/* ── the one entry point ─────────────────────────────────────────────── */

/**
 * Plans an action, and applies it if asked to.
 *
 * Throws with a sentence rather than returning an error shape. Every caller -
 * the server function, the API route, the graph - already turns a thrown error
 * into its own protocol's failure, and an `ok: false` union would mean each of
 * them handling both. The sentences are written to be shown to a person as
 * they are.
 */
export async function runDocumentAction(
	request: DocumentActionRequest,
): Promise<WriteResult> {
	const writer = writerFor(request.via);
	if (!writer) {
		throw new Error(
			"Nothing here can write. Set GITHUB_WRITE_TOKEN to commit, or STUDIO_LOCAL_WRITES to edit a checkout on this machine.",
		);
	}

	/*
	 * A switch rather than a chain of ternaries.
	 *
	 * It was a chain, and the fifth action is what made it worth changing: at
	 * four it is dense and at five it is a shape you have to count brackets to
	 * read. A switch over the discriminant also narrows the union member by
	 * member, so each planner receives its own action type without a cast -
	 * which the chain achieved only because the last branch happened to be
	 * whatever was left, and stopped being true the moment a case was added
	 * before it.
	 */
	const action = request.action;
	const plan = await (async () => {
		switch (action.action) {
			case "create":
				return planCreate(writer, action);
			case "move":
				return planMove(writer, action);
			case "retitle":
				return planRetitle(writer, action);
			case "edit":
				return planEdit(writer, action);
			case "remove":
				return planRemove(writer, action);
		}
	})();

	if (!request.apply || plan.changes.length === 0) {
		return {
			action: action.action,
			applied: false,
			writer: writer.name,
			changes: plan.changes,
			breaks: plan.breaks,
			commit: null,
			message: plan.message,
		};
	}

	const { commit } = await writer.apply({
		message: plan.commitMessage,
		writes: plan.writes,
		deletes: plan.deletes,
	});

	return {
		action: action.action,
		applied: true,
		writer: writer.name,
		changes: plan.changes,
		breaks: plan.breaks,
		commit,
		/*
		 * The projection is now behind the repository, and saying so is the
		 * honest end of every write. `sync` is what closes the gap, and a studio
		 * that pretended the two were in step would show stale rows with no
		 * explanation for them.
		 */
		message: `${plan.message} Run \`pnpm sushindustries sync\` to bring the index up to date.`,
	};
}
