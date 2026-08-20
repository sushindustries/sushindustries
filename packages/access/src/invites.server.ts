import { createHash } from "node:crypto";
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
} from "./index.ts";
import type { AccessStore, InviteRow } from "./store.ts";
import { newSecret, tokens } from "./tokens.server.ts";

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

const hashOf = (secret: string) =>
	createHash("sha256").update(secret).digest("hex");

function stateOf(row: InviteRow): InviteState {
	if (row.redeemedAt) return "collected";
	if (row.revokedAt) return "withdrawn";
	if (row.expiresAt.getTime() <= Date.now()) return "expired";
	return "waiting";
}

function summarise(row: InviteRow): InviteSummary {
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

/** Everything the invitation half does, bound to one store. */
export interface Invites {
	invite(request: InviteRequest, invitedBy: string | null): Promise<NewInvite>;
	list(): Promise<readonly InviteSummary[]>;
	withdraw(id: string): Promise<InviteSummary | null>;
	preview(secret: string): Promise<InvitePreview | null>;
	redeem(secret: string): Promise<MintedToken | null>;
}

/** Binds the invitation operations to a store. */
export function invites(store: AccessStore): Invites {
	/**
	 * Records an invitation and hands back the secret that redeems it.
	 *
	 * Recorded before it can possibly be delivered, and the order is the
	 * decision: a link that went out and was never written down is a credential
	 * the system cannot see, list or withdraw. This way the worst case is an
	 * invitation nobody received, which is visible in a listing and fixable by
	 * withdrawing it.
	 */
	async function invite(
		request: InviteRequest,
		invitedBy: string | null,
	): Promise<NewInvite> {
		const secret = newSecret(LINK_PREFIX);

		const row = await store.insertInvite({
			email: request.email.trim().toLowerCase(),
			hash: hashOf(secret),
			prefix: secret.slice(0, PREFIX_LENGTH),
			tokenName: request.tokenName,
			scopes: joinScopes(request.scopes),
			tokenDays: request.expiresInDays,
			invitedBy,
			expiresAt: new Date(Date.now() + LINK_MINUTES * 60 * 1000),
		});

		if (!row) throw new Error("The invitation was not written.");

		return { summary: summarise(row), secret };
	}

	/** Every invitation, newest first. Never a hash, and never a secret. */
	async function list(): Promise<readonly InviteSummary[]> {
		const rows = await store.invites();
		return rows.map(summarise);
	}

	/**
	 * Withdraws one that has not been collected.
	 *
	 * The token it produced is a separate thing with its own revocation; taking
	 * back the invitation after the fact would be theatre.
	 */
	async function withdraw(id: string): Promise<InviteSummary | null> {
		await store.withdrawInvite(id, new Date());

		const row = await store.inviteById(id);
		return row ? summarise(row) : null;
	}

	/**
	 * What this link would produce, without spending it.
	 *
	 * The reason redemption should never be a GET. A link sent to a person is
	 * followed by things that are not that person - mail scanners, link
	 * previews, the antivirus in a mail client - and every one of them would
	 * consume a single-use credential before the recipient ever saw it.
	 */
	async function preview(secret: string): Promise<InvitePreview | null> {
		if (!secret.startsWith(LINK_PREFIX)) return null;

		const row = await store.liveInviteByHash(hashOf(secret));
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
	 * `claimInvite` is the whole concurrency story, and it is the store's
	 * contract that it be a single conditional write - so a double-click, a
	 * retried request and a scanner racing the recipient all produce one token
	 * and one winner. Nothing is minted on the losing path.
	 */
	async function redeem(secret: string): Promise<MintedToken | null> {
		if (!secret.startsWith(LINK_PREFIX)) return null;

		const hash = hashOf(secret);

		/*
		 * One transaction, and the reason is narrow. `claimInvite` is already
		 * atomic on its own, so the race between two redeemers is settled
		 * whether or not this is here. What the transaction buys is the crash:
		 * without it, a failure between claiming and minting spends a
		 * single-use link and produces nothing, and there is no way back - the
		 * link is marked redeemed and the holder has no token.
		 *
		 * Everything inside uses `tx`, not `store`. A statement that reaches
		 * for the outer store escapes the transaction and will not roll back,
		 * which is the one mistake this shape exists to make hard.
		 */
		return await store.transaction(async (tx) => {
			const claimed = await tx.claimInvite(hash, new Date());
			if (!claimed) return null;

			const inner = tokens(tx);

			/*
			 * The account is created here, keyed on the address the invitation
			 * was sent to. This is the moment that address means something:
			 * whoever is holding this secret received it there, which is the
			 * only proof of an email address this package ever collects - and
			 * the reason it is collected at the redemption rather than at the
			 * invitation.
			 */
			const account = await inner.accountForEmail(claimed.email, "magic-link");

			const minted = await inner.mint(
				{
					name: claimed.tokenName,
					scopes: splitScopes(claimed.scopes),
					expiresInDays: claimed.tokenDays,
				},
				account,
			);

			await tx.linkInviteToken(claimed.id, minted.summary.id);

			return minted;
		});
	}

	return { invite, list, withdraw, preview, redeem };
}
