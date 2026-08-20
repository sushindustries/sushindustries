import { randomBytes } from "node:crypto";
import type { InviteRequest, MintRequest } from "@sushindustries/access";
import {
	invite,
	preview,
	redeem,
	withdraw,
} from "@sushindustries/access/invites.server";
import {
	accountForLogin,
	mint,
	revoke,
} from "@sushindustries/access/tokens.server";
import { getDb } from "@sushindustries/db/client";
import { accounts, apiTokens, eq, magicLinks } from "@sushindustries/db/schema";
import { afterAll, describe, expect, inject, it } from "vitest";

/*
 * The gate, checked against the endpoints it is a gate for.
 *
 * These mint real tokens into the database the built server is reading, then
 * ask that server what it thinks of them over HTTP. Nothing is stubbed,
 * because the failure this suite exists to catch is not a wrong branch in
 * `verify()` - it is an endpoint that was never wired to the scope it needed,
 * and a unit test of the verifier would pass with every route left open.
 *
 * Skipped without a DATABASE_URL rather than failed. A checkout with no
 * database can still run every other suite, and a test that cannot run is not
 * evidence of anything - but it says so out loud rather than passing green.
 */

const base = () => inject("baseUrl");

const LOGIN = `test-access-${randomBytes(6).toString("hex")}`;

/** A JSON-RPC initialize, which is the smallest thing `/mcp` will act on. */
const INITIALIZE = JSON.stringify({
	jsonrpc: "2.0",
	id: 1,
	method: "initialize",
	params: {
		protocolVersion: "2026-07-28",
		capabilities: {},
		clientInfo: { name: "access.test", version: "0" },
	},
});

function ask(
	path: string,
	token: string | null,
	init: RequestInit = {},
): Promise<Response> {
	return fetch(`${base()}${path}`, {
		...init,
		headers: {
			"content-type": "application/json",
			accept: "application/json, text/event-stream",
			...(token ? { authorization: `Bearer ${token}` } : {}),
			...init.headers,
		},
	});
}

async function tokenFor(overrides: Partial<MintRequest> = {}): Promise<string> {
	const account = await accountForLogin(LOGIN, "owner");
	const minted = await mint(
		{
			name: "access.test",
			scopes: ["docs:read"],
			expiresInDays: null,
			...overrides,
		},
		account,
	);
	return minted.token;
}

describe.skipIf(!process.env.DATABASE_URL)("the bearer gate", () => {
	afterAll(async () => {
		// Cascades to the tokens. A suite that leaves credentials behind in a
		// database is a suite that mints a live key every time it runs.
		await getDb().delete(accounts).where(eq(accounts.githubLogin, LOGIN));
	});

	it("refuses /mcp with no token, and says how to sign in", async () => {
		const response = await ask("/mcp", null, {
			method: "POST",
			body: INITIALIZE,
		});

		expect(response.status).toBe(401);
		expect(response.headers.get("www-authenticate")).toMatch(/^Bearer/);
	});

	it("refuses a token that was never minted", async () => {
		const response = await ask(
			"/mcp",
			`aj_${randomBytes(32).toString("base64url")}`,
			{ method: "POST", body: INITIALIZE },
		);

		expect(response.status).toBe(401);
	});

	it("accepts a minted token on the scope it carries", async () => {
		const token = await tokenFor();
		const response = await ask("/mcp", token, {
			method: "POST",
			body: INITIALIZE,
		});

		expect(response.status).not.toBe(401);
		expect(response.status).toBeLessThan(500);
	});

	/*
	 * The assertion this suite is really for.
	 *
	 * `docs:read` is what a token handed to an agent carries, and
	 * `/api/v1/studio/workflows` spawns processes against the checkout. Before
	 * scopes existed these were one shared secret and this request would have
	 * succeeded - so if this ever goes green as a 200, a read token has become a
	 * remote shell.
	 */
	it("refuses a read token on an endpoint that runs things", async () => {
		const token = await tokenFor({ scopes: ["docs:read"] });
		const response = await ask("/api/v1/studio/workflows", token, {
			method: "POST",
			body: JSON.stringify({ id: "sync", confirm: true }),
		});

		expect(response.status).toBe(401);
	});

	it("accepts the same request from a token that carries the scope", async () => {
		const token = await tokenFor({ scopes: ["workflows:run"] });
		const response = await ask("/api/v1/studio/workflows", token, {
			method: "POST",
			body: JSON.stringify({ id: "no-such-workflow", confirm: true }),
		});

		// 400, because there is no such workflow - which is the endpoint
		// answering rather than the gate refusing, and that is the point.
		expect(response.status).toBe(400);
	});

	it("stops accepting a token the moment it is revoked", async () => {
		const account = await accountForLogin(LOGIN, "owner");
		const minted = await mint(
			{
				name: "access.test revoke",
				scopes: ["docs:read"],
				expiresInDays: null,
			},
			account,
		);

		const before = await ask("/mcp", minted.token, {
			method: "POST",
			body: INITIALIZE,
		});
		expect(before.status).not.toBe(401);

		await revoke(minted.summary.id);

		const after = await ask("/mcp", minted.token, {
			method: "POST",
			body: INITIALIZE,
		});
		expect(after.status).toBe(401);
	});

	it("refuses a token that has expired", async () => {
		const account = await accountForLogin(LOGIN, "owner");
		const minted = await mint(
			{ name: "access.test expiry", scopes: ["docs:read"], expiresInDays: 1 },
			account,
		);

		// Moved into the past rather than waiting a day for it.
		await getDb()
			.update(apiTokens)
			.set({ expiresAt: new Date(Date.now() - 1000) })
			.where(eq(apiTokens.id, minted.summary.id));

		const response = await ask("/mcp", minted.token, {
			method: "POST",
			body: INITIALIZE,
		});

		expect(response.status).toBe(401);
	});
});

/*
 * Invitations, and the property the whole design rests on.
 *
 * A link is a short-lived credential that produces a long-lived one, so the
 * question that matters is not "does redeeming work" - it is "can redeeming
 * happen twice". These run against the same database the built server reads,
 * and the concurrency test fires the redemptions together rather than in
 * sequence, because a sequential pair passes against an implementation that
 * reads the row and then updates it, which is exactly the implementation this
 * is here to rule out.
 */
describe.skipIf(!process.env.DATABASE_URL)("invitations", () => {
	const EMAIL = `invited-${randomBytes(6).toString("hex")}@example.test`;

	afterAll(async () => {
		await getDb().delete(magicLinks).where(eq(magicLinks.email, EMAIL));
		await getDb().delete(accounts).where(eq(accounts.email, EMAIL));

		/*
		 * And the owner account this block creates to send the invitations from.
		 *
		 * The gate suite above cleans up the same login, but its `afterAll` has
		 * already run by the time this block starts - so every run left one
		 * `test-access-*` row behind, and they were sitting in the database in
		 * plain sight the first time anybody opened Drizzle Studio.
		 */
		await getDb().delete(accounts).where(eq(accounts.githubLogin, LOGIN));
	});

	/** Creates one and digs the secret back out of the returned URL. */
	async function invited(
		overrides: Partial<InviteRequest> = {},
	): Promise<{ key: string; id: string }> {
		const owner = await accountForLogin(LOGIN, "owner");
		const result = await invite(
			{
				email: EMAIL,
				tokenName: "invited agent",
				scopes: ["docs:read"],
				expiresInDays: null,
				...overrides,
			},
			owner.id,
		);

		// The package hands back the secret and sends nothing, which is the
		// seam: delivery is the application's, and a test that had to stub a
		// mailer to check a redemption would be testing the wrong layer.
		expect(result.secret).toMatch(/^aji_/);

		return { key: result.secret, id: result.summary.id };
	}

	it("previews without spending the link", async () => {
		const { key } = await invited();

		const first = await preview(key);
		expect(first?.tokenName).toBe("invited agent");

		// Twice, because a preview that consumed the link would make every mail
		// scanner in the world a denial of service against invitations.
		const second = await preview(key);
		expect(second?.tokenName).toBe("invited agent");
	});

	it("mints a token carrying the scopes the invitation chose", async () => {
		const { key } = await invited({
			scopes: ["studio:read"],
			tokenName: "reporter",
		});

		const minted = await redeem(key);
		expect(minted?.summary.name).toBe("reporter");
		expect(minted?.summary.scopes).toStrictEqual(["studio:read"]);

		// And the token actually works on the endpoint that scope names.
		const response = await fetch(`${base()}/studio/report`, {
			headers: { authorization: `Bearer ${minted?.token}` },
		});
		expect(response.status).toBe(200);
	});

	it("refuses the second redemption of one link", async () => {
		const { key } = await invited();

		expect(await redeem(key)).not.toBeNull();
		expect(await redeem(key)).toBeNull();
	});

	/*
	 * The one that would catch a read-then-write implementation.
	 *
	 * Both redemptions are in flight before either resolves, so a version that
	 * checked `redeemed_at` in JavaScript and updated afterwards would let both
	 * see null and mint two tokens from one invitation.
	 */
	it("mints once even when redeemed twice at the same moment", async () => {
		const { key } = await invited();

		const [a, b] = await Promise.all([redeem(key), redeem(key)]);
		const won = [a, b].filter((one) => one !== null);

		expect(won).toHaveLength(1);
	});

	it("refuses a link that has expired", async () => {
		const { key, id } = await invited();

		await getDb()
			.update(magicLinks)
			.set({ expiresAt: new Date(Date.now() - 1000) })
			.where(eq(magicLinks.id, id));

		expect(await preview(key)).toBeNull();
		expect(await redeem(key)).toBeNull();
	});

	it("refuses a link that was withdrawn", async () => {
		const { key, id } = await invited();

		await withdraw(id);

		expect(await preview(key)).toBeNull();
		expect(await redeem(key)).toBeNull();
	});

	it("refuses a key that was never issued", async () => {
		expect(
			await redeem(`aji_${randomBytes(32).toString("base64url")}`),
		).toBeNull();
		expect(await redeem("not-even-the-right-shape")).toBeNull();
	});
});
