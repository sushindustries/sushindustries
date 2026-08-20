import {
	accountForLogin,
	list,
	mint,
	revoke,
} from "@sushindustries/access/tokens.server";
import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { mintTokenRequest } from "../../access/access.schemas";
import { openSession } from "../../access/github-auth.server";

/*
 * The bridge between the browser and the access domain.
 *
 * The same shape as every other studio feature, and the session check matters
 * more here than anywhere else in the studio: a server function is an HTTP
 * endpoint whether or not a route calls it, and these three mint, list and
 * revoke the credentials that open `/mcp`. A guard in the loader would protect
 * the page and leave the mint reachable by anyone who read the bundle.
 *
 * There is no `readStudioToken`. A secret that can be fetched again is a secret
 * with two chances to leak, and the mint already returns the only copy.
 */

function requireSession(): string {
	const session = openSession(getRequest());
	if (!session) throw new Error("Not signed in.");
	return session.login;
}

/** Every token, as summaries. Never a secret, and never a hash. */
export const listStudioTokens = createServerFn({ method: "GET" }).handler(
	async () => {
		requireSession();
		return list();
	},
);

/**
 * Mints one and returns it once.
 *
 * POST, because it creates a credential. The account is the signed-in login's,
 * created on first mint - which is what makes this work against an empty table
 * on a laptop, with no seeding step nobody would remember to run.
 */
export const mintStudioToken = createServerFn({ method: "POST" })
	.validator((input: unknown) => mintTokenRequest.parse(input ?? {}))
	.handler(async ({ data }) => {
		const login = requireSession();
		const account = await accountForLogin(login, "owner");
		return mint(data, account);
	});

/** Takes one away. Returns what it became, so the list can show it struck out. */
export const revokeStudioToken = createServerFn({ method: "POST" })
	.validator((input: unknown) => {
		const { id } = (input ?? {}) as { id?: unknown };
		if (typeof id !== "string" || id.length === 0) {
			throw new Error("A token id is required.");
		}
		return { id };
	})
	.handler(async ({ data }) => {
		requireSession();
		return revoke(data.id);
	});
