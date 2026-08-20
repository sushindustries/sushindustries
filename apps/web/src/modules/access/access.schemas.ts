import {
	type Scope as AnyScope,
	type InviteSummary,
	LINK_MINUTES,
} from "@sushindustries/access";
import { z } from "zod";

/*
 * What a scope means here, and what a form is allowed to ask for.
 *
 * `@sushindustries/access` stores scopes, compares them and hands them back,
 * and deliberately has no idea what any of them opens. That question is this
 * site's, and this file is the answer: the four strings that exist, what each
 * one is called, and which endpoints it lets through.
 *
 * Everything a browser needs comes from here or from the package's own
 * client-safe entry - the mint form builds its checkboxes from `SCOPES`, the
 * server functions validate against these schemas, and the API route describes
 * itself from the same table. A scope list written twice is a scope the
 * interface offers and the gate has never heard of.
 *
 * Nothing here hashes, signs or connects.
 */

export { LINK_MINUTES };

/**
 * The scopes that exist, and what each one actually opens.
 *
 * Four, and the split that matters is the last two: this deployment has write
 * endpoints. `/api/v1/studio/documents` edits files in the repository and
 * `/api/v1/studio/workflows` runs commands against a checkout, both over HTTP,
 * both behind the same bearer the read endpoints use. Before this table that
 * was one shared secret, which meant every holder of it could rewrite a post -
 * so the read-only scope is the useful thing here, and it is what a token
 * handed to an agent should carry.
 *
 * The rule for adding one: a scope arrives with the endpoint that checks it,
 * never before. A scope nothing enforces is a permission granted by writing it
 * down, which is worse than one that does not exist, because it reads like a
 * control.
 */
export const SCOPES = {
	"docs:read": {
		title: "Read the index",
		about:
			"The `/mcp` tools and the `/graphql` endpoint: documents, references, and what the repository contains. Everything this opens is also public at /llms.txt.",
	},
	"studio:read": {
		title: "Read the report",
		about:
			"`/studio/report` and the `/api/v1/studio` endpoints, as JSON - counts, staleness, the graph, and which workflows this deployment can run. Reading only.",
	},
	"documents:write": {
		title: "Change documents",
		about:
			"Create, edit, rename and delete through `/api/v1/studio/documents`. This writes files to the repository and opens commits. Give it to yourself, not to an agent you are not watching.",
	},
	"workflows:run": {
		title: "Run workflows",
		about:
			"Start a sync, a schema regeneration or a reference refresh through `/api/v1/studio/workflows`. Spawns processes on the deployment.",
	},
} as const;

export type Scope = keyof typeof SCOPES;

export const SCOPE_NAMES = Object.keys(SCOPES) as readonly Scope[];

/**
 * The scopes on a stored credential that this site still recognises.
 *
 * The package hands back whatever strings were saved, which is the honest
 * thing for it to do: a scope removed from the table above does not vanish
 * from the tokens that already carry it. This narrows to the ones that can be
 * described, so a listing showing titles never looks one up and finds nothing.
 */
export function knownScopes(scopes: readonly AnyScope[]): readonly Scope[] {
	return scopes.filter((one): one is Scope => one in SCOPES);
}

/** How long a token may last, as the handful of answers anybody actually gives. */
export const LIVES = [
	{ label: "30 days", days: 30 },
	{ label: "90 days", days: 90 },
	{ label: "A year", days: 365 },
	{ label: "Never expires", days: null },
] as const;

const scopeList = z
	.array(z.enum(SCOPE_NAMES as [Scope, ...Scope[]]))
	.min(1)
	.max(SCOPE_NAMES.length);

const lifetime = z.number().int().min(1).max(3650).nullable();

/*
 * The inferred types of these two schemas are deliberately not exported.
 *
 * They would be a second name for `MintRequest` and `InviteRequest` in
 * `@sushindustries/access`, which is what the handlers actually pass them to -
 * and two names for one shape is how a field gets added to the one nobody is
 * importing. What a validator produces has to satisfy the package's type, and
 * the compiler checks that at the call site without a re-export.
 */
export const mintTokenRequest = z.object({
	/** What it is for, in the holder's words. Required, and required for a reason. */
	name: z.string().trim().min(1).max(64),

	/**
	 * At least one. A token with no scopes authenticates and authorises nothing,
	 * which is a support question rather than a security posture.
	 */
	scopes: scopeList,

	/**
	 * Null means it never expires, and the form has to say so out loud.
	 *
	 * A default of "never" would be the quiet choice and the wrong one; a
	 * default of 90 days would silently break the cron somebody set up in March.
	 * So it is asked, every time, and the answer is recorded.
	 */
	expiresInDays: lifetime,
});

/*
 * There is deliberately no "email me a link" endpoint anywhere in this site.
 * An invitation is created by the signed-in owner, so there is no way for a
 * stranger to make this deployment send mail to an address of their choosing -
 * the abuse surface every public magic-link form has is absent by construction
 * rather than defended with a rate limiter.
 */
export const inviteRequest = z.object({
	/**
	 * Lower-cased here rather than at the database, so the value that is stored
	 * and the value that is compared come out of the same expression.
	 */
	email: z
		.string()
		.trim()
		.toLowerCase()
		.email("That does not look like an email address.")
		.max(254),

	/** What the token they collect will be called, in a list of tokens. */
	tokenName: z.string().trim().min(1).max(64),

	scopes: scopeList,

	/** The lifetime of the token they collect. Not of the link. */
	expiresInDays: lifetime,
});

/**
 * What creating an invitation returns to the studio.
 *
 * `url` is present only when nothing sent it. With a mailer configured the
 * link goes to the address and never comes back through this response, which
 * is the arrangement that makes redemption evidence the address was real; with
 * no mailer it has to be handed over by whoever created it, and the studio says
 * plainly that this proves nothing about who receives it.
 */
export interface Invited {
	readonly summary: InviteSummary;
	readonly url: string | null;
	readonly delivered: "sent" | "not-configured" | "failed";

	/** Why delivery failed, when it did. Shown to the owner, never to a visitor. */
	readonly detail: string | null;
}
