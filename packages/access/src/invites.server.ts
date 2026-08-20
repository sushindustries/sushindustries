import { createHash } from "node:crypto";
import { getDb } from "@sushindustries/db/client";
import {
	and,
	desc,
	eq,
	isNull,
	type MagicLink,
	magicLinks,
	sql,
} from "@sushindustries/db/schema";
import {
	type InvitePreview,
	type InviteRequest,
	type InviteState,
	type InviteSummary,
	joinScopes,
	LINK_MINUTES,
	LINK_PREFIX,
	type MintedToken,
	type NewInvite,
	PREFIX_LENGTH,
	splitScopes,
} from "./index";
import { accountForEmail, mint, newSecret } from "./tokens.server";

/*
 * Invitations: creating them, listing them, and the one that matters -
 * redeeming exactly once.
 *
 * An invitation is a short-lived credential that produces a long-lived one, so
 * everything here exists to keep that trade honest:
 *
 *   - the link's secret is hashed at rest, like a token's
 *   - redemption is a conditional UPDATE, so two callers cannot both win
 *   - the token is minted *inside* that redemption, so a caller that lost the
 *     race produces nothing at all rather than a second token
 *   - a preview says what a link would produce without consuming it, because
 *     a flow that redeems on GET is one a link-prefetcher redeems for you
 *
 * Nothing here sends anything. `invite()` returns the secret and stops; what
 * carries it, and in whose words, is the caller's.
 */

const db = () => getDb();

const hashOf = (secret: string) =>
	createHash("sha256").update(secret).digest("hex");

function stateOf(row: MagicLink): InviteState {
	if (row.redeemedAt) return "collected";
	if (row.revokedAt) return "withdrawn";
	if (row.expiresAt.getTime() <= Date.now()) return "expired";
	return "waiting";
}

function summarise(row: MagicLink): InviteSummary {
	return {
		id: row.id,
		email: row.email,
		prefix: row.prefix,
		tokenName: row.tokenName,
		scopes: splitScopes(row.scopes),
		createdAt: row.createdAt.toISOString(),
		expiresAt: row.expiresAt.toISOString(),
		redeemedAt: row.redeemedAt?.toISOString() ?? null,
		state: stateOf(row),
		tokenId: row.tokenId,
	};
}

/**
 * Records an invitation and hands back the secret that redeems it.
 *
 * Recorded before it can possibly be delivered, and the order is the decision:
 * a link that went out and was never written down is a credential the system
 * cannot see, list or withdraw. This way the worst case is an invitation
 * nobody received, which is visible in a listing and fixable by withdrawing
 * it.
 */
export async function invite(
	request: InviteRequest,
	invitedBy: string | null,
): Promise<NewInvite> {
	const secret = newSecret(LINK_PREFIX);

	const [row] = await db()
		.insert(magicLinks)
		.values({
			email: request.email.trim().toLowerCase(),
			hash: hashOf(secret),
			prefix: secret.slice(0, PREFIX_LENGTH),
			tokenName: request.tokenName,
			scopes: joinScopes(request.scopes),
			tokenDays: request.expiresInDays,
			invitedBy,
			expiresAt: new Date(Date.now() + LINK_MINUTES * 60 * 1000),
		})
		.returning();

	if (!row) throw new Error("The invitation was not written.");

	return { summary: summarise(row), secret };
}

/** Every invitation, newest first. Never a hash, and never a secret. */
export async function listInvites(): Promise<readonly InviteSummary[]> {
	const rows = await db()
		.select()
		.from(magicLinks)
		.orderBy(desc(magicLinks.createdAt));

	return rows.map(summarise);
}

/**
 * Withdraws one that has not been collected.
 *
 * `where redeemed_at is null` as well as the id, so withdrawing something
 * already collected is a no-op rather than a row that reads as both. The token
 * it produced is a separate thing with its own revocation; taking back the
 * invitation after the fact would be theatre.
 */
export async function withdraw(id: string): Promise<InviteSummary | null> {
	await db()
		.update(magicLinks)
		.set({ revokedAt: new Date() })
		.where(
			and(
				eq(magicLinks.id, id),
				isNull(magicLinks.redeemedAt),
				isNull(magicLinks.revokedAt),
			),
		);

	const [row] = await db()
		.select()
		.from(magicLinks)
		.where(eq(magicLinks.id, id))
		.limit(1);

	return row ? summarise(row) : null;
}

/**
 * What this link would produce, without spending it.
 *
 * The reason redemption should never be a GET. A link sent to a person is
 * followed by things that are not that person - mail scanners, link previews,
 * the antivirus in a mail client - and every one of them would consume a
 * single-use credential before the recipient ever saw it.
 */
export async function preview(secret: string): Promise<InvitePreview | null> {
	if (!secret.startsWith(LINK_PREFIX)) return null;

	const [row] = await db()
		.select()
		.from(magicLinks)
		.where(
			and(
				eq(magicLinks.hash, hashOf(secret)),
				isNull(magicLinks.redeemedAt),
				isNull(magicLinks.revokedAt),
			),
		)
		.limit(1);

	if (!row || row.expiresAt.getTime() <= Date.now()) return null;

	return {
		tokenName: row.tokenName,
		scopes: splitScopes(row.scopes),
		expiresInDays: row.tokenDays,
	};
}

/**
 * Spends the link and mints the token, or refuses.
 *
 * The first statement is the whole concurrency story. `UPDATE ... WHERE
 * redeemed_at IS NULL ... RETURNING` claims the row and reports whether this
 * caller was the one that claimed it, in a single atomic step - so a
 * double-click, a retried request and a scanner racing the recipient all
 * produce one token and one winner. Reading the row first and updating second
 * would look identical in every test written by one person clicking once.
 *
 * The expiry is inside the same WHERE for the same reason: checked in the
 * statement that claims, not in an `if` standing beside it.
 */
export async function redeem(secret: string): Promise<MintedToken | null> {
	if (!secret.startsWith(LINK_PREFIX)) return null;

	const [claimed] = await db()
		.update(magicLinks)
		.set({ redeemedAt: new Date() })
		.where(
			and(
				eq(magicLinks.hash, hashOf(secret)),
				isNull(magicLinks.redeemedAt),
				isNull(magicLinks.revokedAt),
				sql`${magicLinks.expiresAt} > now()`,
			),
		)
		.returning();

	if (!claimed) return null;

	/*
	 * The account is created here, keyed on the address the invitation was sent
	 * to. This is the moment that address means something: whoever is holding
	 * this secret received it there, which is the only proof of an email
	 * address this package ever collects - and the reason it is collected at
	 * the redemption rather than at the invitation.
	 */
	const account = await accountForEmail(claimed.email, "magic-link");

	const minted = await mint(
		{
			name: claimed.tokenName,
			scopes: splitScopes(claimed.scopes),
			expiresInDays: claimed.tokenDays,
		},
		account,
	);

	/*
	 * Recorded after the fact, and a failure here is deliberately not fatal.
	 * The token exists and the holder is about to be shown it; losing the link
	 * between the two rows costs a join in a listing, where throwing would tell
	 * somebody their collection failed while a live token sat in the table.
	 */
	await db()
		.update(magicLinks)
		.set({ tokenId: minted.summary.id })
		.where(eq(magicLinks.id, claimed.id))
		.catch(() => {});

	return minted;
}
