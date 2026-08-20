/*
 * Scoped API tokens and single-use invitations, as shapes.
 *
 * This entry is client-safe and deliberately thin: types, four constants and
 * two string functions. It is what a form, a table or a route may import
 * without dragging a Postgres client into a browser bundle - the same split
 * `@sushindustries/db` makes between `schema` and `client.server`, for the
 * same reason.
 *
 * What is *not* here is as deliberate. This package has no idea what a scope
 * means. It stores the strings it is given, compares them, and hands them
 * back; whether `docs:read` is a real permission with a title and a
 * description is a question about one application's vocabulary, and an
 * application that had to fork this package to add a scope would be a package
 * that had guessed.
 *
 * Nor does it send anything. `invite()` returns the secret and stops there,
 * because the message that carries a link is somebody's copy, in somebody's
 * voice, through somebody's provider.
 */

/** The prefix a minted token carries. Three characters and an underscore. */
export const TOKEN_PREFIX = "aj_";

/** The prefix an invitation link carries. Distinguishable from a token's. */
export const LINK_PREFIX = "aji_";

/**
 * How much of a secret is kept in the clear, counting the prefix.
 *
 * Eleven characters: the prefix and eight of the secret. Enough that a list of
 * credentials can be told apart, and far short of enough to be worth guessing.
 * It exists so a leaked secret is greppable - a scanner can only find a
 * credential it can recognise, and a bare base64 string is indistinguishable
 * from every other bare base64 string in a log.
 */
export const PREFIX_LENGTH = 11;

/** How long an invitation link is worth anything. Fifteen minutes. */
export const LINK_MINUTES = 15;

/**
 * A scope, as far as this package is concerned.
 *
 * A string. The application that uses this decides which strings exist and
 * what each one opens; here they are opaque values that are stored, split on
 * whitespace, and compared for equality.
 */
export type Scope = string;

/** Whether a credential is usable, and if not, why not. */
export type TokenState = "active" | "expired" | "revoked";

/** Where an invitation has got to. One field, so a listing cannot render two. */
export type InviteState = "waiting" | "collected" | "expired" | "withdrawn";

/**
 * A token as anything other than its creator ever sees it.
 *
 * No secret and no hash. This is what a listing shows, what an API returns and
 * what a holder's own page would render - the same shape in all three, so none
 * of them can accidentally be the one that leaks.
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
	 * Worked out once, here, rather than left to every caller.
	 *
	 * "Is this live" is three comparisons - revoked, expired, holder blocked -
	 * and a listing that renders two of them shows a dead credential as green.
	 */
	readonly state: TokenState;
}

/** The one moment a secret exists outside the holder's hands. */
export interface MintedToken {
	readonly token: string;
	readonly summary: TokenSummary;
}

/** What to mint. Scopes are whatever the caller's vocabulary says they are. */
export interface MintRequest {
	readonly name: string;
	readonly scopes: readonly Scope[];

	/** Null means it does not expire, which is a decision rather than a default. */
	readonly expiresInDays: number | null;
}

/** What a verified request turns out to be holding. */
export interface Bearer {
	readonly tokenId: string;
	readonly accountId: string;
	readonly scopes: readonly Scope[];
	readonly holder: string;
}

/** An invitation as a listing shows it. Never the link, and never a hash. */
export interface InviteSummary {
	readonly id: string;
	readonly email: string;
	readonly prefix: string;
	readonly tokenName: string;
	readonly scopes: readonly Scope[];
	readonly createdAt: string;
	readonly expiresAt: string;
	readonly redeemedAt: string | null;
	readonly state: InviteState;

	/** Set once collected, so a listing can point at what it produced. */
	readonly tokenId: string | null;
}

/** What to invite somebody to collect. */
export interface InviteRequest {
	readonly email: string;
	readonly tokenName: string;
	readonly scopes: readonly Scope[];

	/** The lifetime of the token they collect. Not of the link. */
	readonly expiresInDays: number | null;
}

/**
 * A new invitation: the record, and the secret that redeems it.
 *
 * The secret is returned rather than sent, and that is the seam this package
 * stops at. Whoever called this decides whether it goes into an email, a chat
 * message or a terminal - and whichever it is, the copy is theirs.
 */
export interface NewInvite {
	readonly summary: InviteSummary;
	readonly secret: string;
}

/**
 * What a visitor is told about a link before they redeem it.
 *
 * Deliberately thin. This is rendered to whoever holds the URL, which is
 * whoever has the message and anything that reads it - so it carries what is
 * needed to decide to press the button and nothing worth intercepting: no
 * address, no invitation id, no idea who sent it.
 */
export interface InvitePreview {
	readonly tokenName: string;
	readonly scopes: readonly Scope[];
	readonly expiresInDays: number | null;
}

/** The stored column, back into scopes. Space-separated, in the OAuth style. */
export function splitScopes(stored: string): readonly Scope[] {
	return stored.split(/\s+/).filter(Boolean);
}

/** Scopes, back into the stored column. */
export function joinScopes(scopes: readonly Scope[]): string {
	return scopes.join(" ");
}
