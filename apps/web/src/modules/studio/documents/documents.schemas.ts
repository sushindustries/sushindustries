import { z } from "zod";
import { paging, repoPath, slug } from "../studio.schemas";

/*
 * What can be asked of the documents feature, and what can be done to it.
 *
 * One file for both, because a query and an action against the same table are
 * the same vocabulary read two ways - a `kind` means the same thing filtering
 * a list and naming what to create, and defining it twice is how they stop
 * meaning the same thing.
 */

/* ── the vocabulary ──────────────────────────────────────────────────── */

/**
 * The kinds a document can be, as a value rather than a type.
 *
 * `packages/db/src/schema.ts` has the same list as a union type; this is its
 * runtime half - an array a `<select>` is built from and a schema validates
 * against. `checkDocumentKindsAgree` in `scripts/doctor.mjs` checks them against each other,
 * because two lists is precisely the drift the doctor exists to prevent.
 */
export const DOCUMENT_KINDS = [
	"component",
	"package",
	"post",
	"page",
	"desk",
	"skill",
	"note",
	"collection",
	"task",
	"graph",
	"insight",
	"template",
	"config",
	"plugin",
	"repo",
	"source",
] as const;

/**
 * The kinds a person can author, out of the kinds that exist.
 *
 * `source` is a `.tsx` file, `repo` is a README, `note` is whatever else sits
 * in `.claude/`. All three are real documents and none is something a studio
 * should offer to create, because creating one means writing code or config
 * that belongs in an editor. What is left is what `pnpm new` already
 * scaffolds - not a coincidence, since the create action renders the same
 * templates.
 *
 * `collection` is here and is not in `DOCUMENT_KINDS`, which looks like an
 * oversight and is the honest shape. A collection is a Markdown file in
 * `content/collections/`, so the projection indexes it as a `page` like every
 * other Markdown file - it has no kind of its own because it needs none. What
 * it needs is to be *creatable*, and that is a different list.
 */
export const AUTHORABLE_KINDS = [
	"post",
	"page",
	"collection",
	"component",
	"package",
] as const;

export type AuthorableKind = (typeof AUTHORABLE_KINDS)[number];

/** Which column a document list is ordered by. */
export const DOCUMENT_SORTS = [
	"path",
	"title",
	"kind",
	"tokens",
	"words",
	"syncedAt",
] as const;

export type DocumentSort = (typeof DOCUMENT_SORTS)[number];

/* ── reading ─────────────────────────────────────────────────────────── */

export const documentsQuery = paging.extend({
	kind: z.enum(DOCUMENT_KINDS).optional(),
	slug: z.string().max(64).optional(),
	section: z.string().max(64).optional(),

	/** Substring over title, summary, path and body. Text, never syntax. */
	search: z.string().max(200).optional(),

	sort: z.enum(DOCUMENT_SORTS).default("path"),
	direction: z.enum(["asc", "desc"]).default("asc"),
});

export type DocumentsQuery = z.input<typeof documentsQuery>;
export type ParsedDocumentsQuery = z.output<typeof documentsQuery>;

/** One row in the browser. No body - that is a separate, deliberate request. */
export interface DocumentRow {
	readonly path: string;
	readonly kind: string;
	readonly slug: string | null;
	readonly section: string | null;
	readonly route: string | null;
	readonly title: string | null;
	readonly summary: string | null;
	readonly words: number;
	readonly tokens: number;
	readonly sha: string;
	readonly syncedAt: string;
}

export interface DocumentDetail extends DocumentRow {
	readonly body: string;
}

/* ── writing ─────────────────────────────────────────────────────────── */

/**
 * Every structural change, as one union.
 *
 * Discriminated on `action`, so a handler takes the whole thing and Zod
 * decides which member arrived - rather than four endpoints, four validators
 * and four chances to forget the permission check. There is one write path
 * from the studio into this repository and this is its shape.
 *
 * `edit` is the one that writes bytes, and it is bounded rather than open.
 * The path has to already be a document in the index, which means it is a file
 * this repository put there and not an arbitrary destination - so the worst a
 * caller can do is rewrite a document that already exists, which is what a
 * pull request against it would also do. What it deliberately cannot do is
 * create a file at a path of its choosing; that is `create`, and `create` only
 * ever writes a template to a path a template decides.
 *
 * That boundary is the whole safety argument, and it is worth being precise
 * about because the obvious version - a textarea posting to a path - is a
 * remote shell with a nicer font.
 */
export const documentAction = z.discriminatedUnion("action", [
	/**
	 * A new post, page, component or package, from this repo's own templates.
	 *
	 * It shells out to `pnpm new`, the same scaffolder a person runs.
	 * Reimplementing it here would be a second set of templates to keep in step
	 * with the first, and the first is the one the doctor checks.
	 */
	z.object({
		action: z.literal("create"),
		kind: z.enum(AUTHORABLE_KINDS),
		slug,
		title: z.string().min(1).max(200).optional(),
	}),

	/**
	 * The slug change: everything at one name moves to another.
	 *
	 * Every document sharing the slug moves together, because a component is
	 * five files and one name - moving `api.md` alone produces a page that is
	 * half at each. Ask for a plan first to see what breaks before it does.
	 */
	z.object({
		action: z.literal("move"),
		kind: z.enum(DOCUMENT_KINDS),
		from: slug,
		to: slug,
	}),

	/** The frontmatter, and only the frontmatter. Title, summary, or both. */
	z.object({
		action: z.literal("retitle"),
		path: repoPath,
		title: z.string().min(1).max(200).optional(),
		summary: z.string().max(400).optional(),
	}),

	/**
	 * The whole document, frontmatter included.
	 *
	 * Separate from `retitle` rather than a superset of it, and the difference
	 * is what the diff looks like. `retitle` rewrites one line and leaves every
	 * other byte alone, so a title change reviews as a title change; this
	 * replaces the file, so it reviews as whatever was actually altered. Using
	 * one action for both would make every title change look like a rewrite.
	 *
	 * `sha` is the version the editor started from. If the file has moved since
	 * - a sync ran, somebody committed, another tab saved - the write is
	 * refused rather than applied on top. That is the only protection an editor
	 * over a git repository can offer, and without it the second save silently
	 * discards the first.
	 */
	z.object({
		action: z.literal("edit"),
		path: repoPath,
		body: z.string().max(500_000),
		sha: z.string().optional(),
	}),

	/**
	 * Removal, which asks for the name twice.
	 *
	 * `confirm` must equal `slug`. Not security - anyone calling this is already
	 * past the session - but the difference between an action and an accident,
	 * and the one thing a menu item cannot express on its own.
	 */
	z.object({
		action: z.literal("remove"),
		kind: z.enum(DOCUMENT_KINDS),
		slug,
		confirm: z.string(),
	}),
]);

export type DocumentAction = z.infer<typeof documentAction>;

/** An action, plus whether to actually do it. */
export const documentActionRequest = z.object({
	action: documentAction,

	/**
	 * Default false, and that default is the interesting decision.
	 *
	 * A caller that forgets the flag gets a plan, which is a no-op that
	 * describes itself. The other default - apply unless told otherwise - means
	 * a forgotten field renames things, and there is no version of that failure
	 * anybody wants to debug from a commit log.
	 */
	apply: z.boolean().default(false),

	/** Which writer to use. Left off, the highest-priority available one. */
	via: z.enum(["local", "github"]).optional(),
});

export type DocumentActionRequest = z.infer<typeof documentActionRequest>;
