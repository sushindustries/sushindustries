import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { type Invited, inviteRequest } from "../../access/access.schemas";
import { accessInvites, accessTokens } from "../../access/access.server";
import { deliver, linkUrl } from "../../access/delivery.server";
import { openSession } from "../../access/github-auth.server";
import { originFrom } from "../../registry/registry.server";

/*
 * The bridge between the browser and invitations, and the one place the two
 * halves of this feature are joined.
 *
 * `@sushindustries/access` records the invitation and hands back a secret. It
 * does not know where a link points or what an email should say, and it should
 * not - those are this site's route and this site's voice. So the composition
 * happens here, in eleven lines, and both halves stay replaceable.
 *
 * All three are owner-only, and the session check is in each of them rather
 * than in the route: a server function is an HTTP endpoint whether or not a
 * page calls it, and this one causes mail to be sent.
 *
 * Redeeming is not here. That is the one part a stranger performs, so it lives
 * in `modules/access/access.functions.ts`, where the absence of a session check
 * is a property of the file rather than an omission in the middle of one.
 */

function requireSession(): string {
	const session = openSession(getRequest());
	if (!session) throw new Error("Not signed in.");
	return session.login;
}

/** Every invitation, with what became of it. */
export const listStudioInvites = createServerFn({ method: "GET" }).handler(
	async () => {
		requireSession();
		return accessInvites.list();
	},
);

/**
 * Records one, then tries to send it.
 *
 * The origin comes from the request rather than from a variable, so a link
 * created on a laptop points at that laptop and one created in production
 * points at production. A configured base URL would be a third place this
 * deployment's address is written down, and the two that already exist
 * disagree often enough.
 */
export const sendStudioInvite = createServerFn({ method: "POST" })
	.validator((input: unknown) => inviteRequest.parse(input ?? {}))
	.handler(async ({ data }): Promise<Invited> => {
		const login = requireSession();
		const owner = await accessTokens.accountForLogin(login, "owner");

		const made = await accessInvites.invite(data, owner.id);
		const sent = await deliver(
			linkUrl(originFrom(getRequest()), made.secret),
			data.email,
			data.tokenName,
			data.scopes,
		);

		return {
			summary: made.summary,
			url: sent.url,
			delivered: sent.delivered,
			detail: sent.detail,
		};
	});

/** Withdraws one that has not been collected yet. */
export const withdrawStudioInvite = createServerFn({ method: "POST" })
	.validator((input: unknown) => {
		const { id } = (input ?? {}) as { id?: unknown };
		if (typeof id !== "string" || id.length === 0) {
			throw new Error("An invitation id is required.");
		}
		return { id };
	})
	.handler(async ({ data }) => {
		requireSession();
		return accessInvites.withdraw(data.id);
	});
