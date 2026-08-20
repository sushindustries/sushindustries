import { createServerFn } from "@tanstack/react-start";
import { accessInvites } from "./access.server";

/*
 * The two calls a stranger is allowed to make.
 *
 * Everything else in this domain is owner-only and lives behind a session
 * check in `modules/studio/invites`. These two are the exception by design -
 * the person collecting a token is exactly the person who is not signed in -
 * so they are in their own file, where the absence of `requireSession` is a
 * property of the file rather than an omission in the middle of one.
 *
 * The link itself is the credential. There is nothing else to authenticate
 * with, and nothing else to check: holding an unspent link is the whole of the
 * authorisation, which is why the link is short-lived, single-use and hashed
 * at rest.
 *
 * No listing, no lookup by email, no "resend". Each of those would let
 * somebody with an address learn something about whether an invitation exists,
 * and there is nothing to gain from answering that question.
 */

/** Validates the shape only. Whether the key means anything is the DB's answer. */
function keyFrom(input: unknown): { key: string } {
	const { key } = (input ?? {}) as { key?: unknown };
	if (typeof key !== "string" || key.length === 0 || key.length > 128) {
		throw new Error("That is not an invitation link.");
	}
	return { key };
}

/**
 * What this link would produce, without spending it.
 *
 * Null for expired, withdrawn, already collected and never-existed alike. One
 * answer for four causes, deliberately: distinguishing them would tell whoever
 * is asking whether a link was real, which is the one thing a stranger holding
 * a wrong key should not learn.
 */
export const previewInvite = createServerFn({ method: "GET" })
	.validator(keyFrom)
	.handler(async ({ data }) => accessInvites.preview(data.key));

/**
 * Spends the link and returns the token, once.
 *
 * POST, and not because of a convention. A GET here would be redeemed by every
 * mail scanner, link preview and antivirus that touches the inbox this was
 * sent to - the recipient would arrive at a page telling them their one-time
 * link had already been used, and it would be true.
 */
export const redeemInvite = createServerFn({ method: "POST" })
	.validator(keyFrom)
	.handler(async ({ data }) => accessInvites.redeem(data.key));
