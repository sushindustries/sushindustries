import { randomBytes } from "node:crypto";
import { getDb } from "@sushindustries/db/client";
import { accounts, apiTokens, eq } from "@sushindustries/db/schema";
import { afterAll, describe, expect, inject, it } from "vitest";
import type { MintTokenRequest } from "../src/modules/access/access.schemas";
import {
	accountForLogin,
	mint,
	revoke,
} from "../src/modules/access/tokens.server";

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

async function tokenFor(
	overrides: Partial<MintTokenRequest> = {},
): Promise<string> {
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
