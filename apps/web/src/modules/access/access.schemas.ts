import { z } from "zod";

/*
 * What a token is allowed to be, as constants and a schema.
 *
 * Client-safe by suffix and by contents: the mint form imports this to build
 * its checkboxes, the server function imports it to validate what the form
 * sent, and the API route imports it to describe itself. One declaration read
 * three ways, because a scope list written twice is a scope the UI offers and
 * the gate has never heard of.
 *
 * Nothing here hashes, signs or connects. That is `tokens.server.ts`.
 */

/**
 * The prefix every token carries. Three characters and an underscore.
 *
 * It exists so a leaked token is greppable. A secret scanner - GitHub's, or
 * mine - can only find a credential it can recognise, and a bare base64 string
 * is indistinguishable from every other bare base64 string in a log.
 */
export const TOKEN_PREFIX = "aj_";

/**
 * How much of a token is kept in the clear, counting the prefix.
 *
 * Eleven characters: `aj_` and eight of the secret. Enough that a list of
 * tokens can be told apart, and 48 bits short of enough to be worth guessing.
 */
export const PREFIX_LENGTH = 11;

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

/** Splits the stored column back into scopes. Space-separated, OAuth style. */
export function parseScopes(stored: string): readonly Scope[] {
	return stored.split(/\s+/).filter((one): one is Scope => one in SCOPES);
}

export const mintTokenRequest = z.object({
	/** What it is for, in the holder's words. Required, and required for a reason. */
	name: z.string().trim().min(1).max(64),

	/**
	 * At least one. A token with no scopes authenticates and authorises nothing,
	 * which is a support question rather than a security posture.
	 */
	scopes: z
		.array(z.enum(SCOPE_NAMES as [Scope, ...Scope[]]))
		.min(1)
		.max(SCOPE_NAMES.length),

	/**
	 * Null means it never expires, and the form has to say so out loud.
	 *
	 * A default of "never" would be the quiet choice and the wrong one; a
	 * default of 90 days would silently break the cron somebody set up in March.
	 * So it is asked, every time, and the answer is recorded.
	 */
	expiresInDays: z.number().int().min(1).max(3650).nullable(),
});

export type MintTokenRequest = z.infer<typeof mintTokenRequest>;

/**
 * A token as anything other than its creator ever sees it.
 *
 * No secret and no hash. This is what the studio lists, what the API returns,
 * and what a future account page would show its owner - the same shape in all
 * three places, so none of them can accidentally be the one that leaks.
 */
export interface TokenSummary {
	readonly id: string;
	readonly name: string;
	readonly prefix: string;
	readonly scopes: readonly Scope[];
	readonly createdAt: string;
	readonly expiresAt: string | null;
	readonly lastUsedAt: string | null;
	readonly revokedAt: string | null;

	/** The account it belongs to, as something a person can read. */
	readonly holder: string;

	/**
	 * Worked out here rather than left to every caller.
	 *
	 * "Is this token live" is three comparisons - revoked, expired, blocked -
	 * and a listing that renders two of them is a listing that shows a dead
	 * token as green. One field, computed once, beside the data it describes.
	 */
	readonly state: "active" | "expired" | "revoked";
}

/** The one moment the secret exists outside the holder's hands. */
export interface MintedToken {
	readonly token: string;
	readonly summary: TokenSummary;
}
