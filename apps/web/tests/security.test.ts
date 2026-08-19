import { EMBED_PROVIDERS } from "@sushindustries/http";
import { beforeAll, describe, expect, inject, it, test } from "vitest";
import { SITE } from "../src/modules/content/site.catalogue";

/*
 * The policy, checked against the content it is a policy for.
 *
 * A Content Security Policy is only ever wrong in one direction that anybody
 * notices: too tight, and a frame the site genuinely embeds is refused. The
 * reader sees "refused to connect" and nobody sees anything at all until they
 * do. So rather than asserting a string somebody typed, these read the embed
 * declarations the blocks build their URLs from and require the served header
 * to cover every one of them.
 *
 * That is what makes the arrangement hold: adding a provider without adding
 * its origin fails here, in the same commit, rather than on a page months
 * later.
 */

let headers: Headers;

beforeAll(async () => {
	const response = await fetch(`${inject("baseUrl")}/p/markdown`);
	expect(response.status).toBe(200);
	headers = response.headers;
});

function policy(): string {
	const header = headers.get("content-security-policy");
	expect(header, "no Content-Security-Policy on a document response").not.toBe(
		null,
	);
	return header ?? "";
}

function readDirective(name: string): string {
	const found = policy()
		.split(";")
		.map((part) => part.trim())
		.find((part) => part.startsWith(`${name} `));

	expect(found, `the policy has no ${name}`).toBeTruthy();
	return found ?? "";
}

describe("the content security policy", () => {
	test("allows every frame the blocks can point at", () => {
		const frameSrc = readDirective("frame-src");

		const missing = Object.values(EMBED_PROVIDERS)
			.filter((provider) => provider.frame)
			.filter((provider) => !frameSrc.includes(provider.frame ?? ""))
			.map((provider) => `${provider.id}: ${provider.frame} not in frame-src`);

		expect(missing).toStrictEqual([]);
	});

	test("allows every still and stream those providers fetch", () => {
		const imgSrc = readDirective("img-src");
		const connectSrc = readDirective("connect-src");
		const mediaSrc = readDirective("media-src");

		const missing: string[] = [];
		for (const provider of Object.values(EMBED_PROVIDERS)) {
			for (const origin of provider.img ?? []) {
				if (!imgSrc.includes(origin)) missing.push(`img-src: ${origin}`);
			}
			for (const origin of provider.connect ?? []) {
				if (!connectSrc.includes(origin)) {
					missing.push(`connect-src: ${origin}`);
				}
			}
			for (const origin of provider.media ?? []) {
				if (!mediaSrc.includes(origin)) missing.push(`media-src: ${origin}`);
			}
		}

		expect(missing).toStrictEqual([]);
	});

	test("lets a GLB decode, because that is WebAssembly", () => {
		/*
		 * Compiling a Wasm module counts as evaluation under CSP, so a
		 * `script-src` without this throws inside the loader and every 3D
		 * viewer is an empty canvas - a 200 response, a canvas of the right
		 * size, and no model. It shipped that way, and dev hid it: dev adds
		 * `'unsafe-eval'`, which permits Wasm too, so it worked on the machine
		 * it was written on and nowhere else.
		 *
		 * The second assertion is the point of the first. `'unsafe-eval'` would
		 * also make this pass, and would hand an injected string to `eval`.
		 */
		const scriptSrc = readDirective("script-src");

		expect(scriptSrc).toContain("'wasm-unsafe-eval'");
		expect(scriptSrc).not.toContain("'unsafe-eval'");
	});

	test("closes the directives an injection would use", () => {
		expect(readDirective("object-src")).toContain("'none'");
		expect(readDirective("base-uri")).toContain("'self'");
		expect(readDirective("form-action")).toContain("'self'");
		expect(readDirective("default-src")).toContain("'self'");
	});

	test("keeps same-origin framing, which the archive needs", () => {
		/*
		 * `frame-ancestors 'self'` rather than 'none': every card on
		 * /components is this site framing its own preview route. 'none' would
		 * blank all of them, which is how a policy tightened in good faith
		 * takes out a page nobody thought to check.
		 */
		expect(readDirective("frame-ancestors")).toContain("'self'");
		expect(readDirective("frame-ancestors")).not.toContain("*");
	});

	test("delegates fullscreen to the players, and nothing else to anyone", () => {
		const permissions = headers.get("permissions-policy") ?? "";

		// A cross-origin player cannot be granted what the top level kept, so
		// the embed origins have to be named or the fullscreen button is inert.
		for (const provider of Object.values(EMBED_PROVIDERS)) {
			if (!provider.frame) continue;
			expect(permissions).toContain(provider.frame);
		}

		for (const capability of ["camera=()", "microphone=()", "geolocation=()"]) {
			expect(permissions).toContain(capability);
		}
	});

	test("ships the short headers too", () => {
		expect(headers.get("x-content-type-options")).toBe("nosniff");
		expect(headers.get("referrer-policy")).toBe(
			"strict-origin-when-cross-origin",
		);
	});
});

/*
 * The development sign-in is a door, and this is the lock.
 *
 * `/auth/dev` issues a session without GitHub, which is right on a laptop and
 * catastrophic anywhere else. It is closed by two conditions - not production,
 * and localhost - and this asserts the first one, because that is the one the
 * deployed image relies on. If this ever goes green for the wrong reason, the
 * route should be deleted rather than repaired.
 */
describe("the development sign-in", () => {
	it("does not exist unless DEV_SIGNIN is set", async () => {
		const previous = process.env.DEV_SIGNIN;
		process.env.DEV_SIGNIN = undefined;
		delete process.env.DEV_SIGNIN;

		try {
			const { Route } = await import("../src/routes/auth.dev");
			const handler = Route.options.server?.handlers?.GET;
			expect(handler).toBeDefined();

			const response = await (
				handler as (context: { request: Request }) => Response
			)({
				request: new Request("http://localhost:3000/auth/dev"),
			});

			expect(response.status).toBe(404);
			expect(response.headers.get("set-cookie")).toBeNull();
		} finally {
			if (previous !== undefined) process.env.DEV_SIGNIN = previous;
		}
	});

	it("is closed to a host that is not localhost, even when it is set", async () => {
		const previous = process.env.DEV_SIGNIN;
		process.env.DEV_SIGNIN = "1";

		try {
			const { Route } = await import("../src/routes/auth.dev");
			const handler = Route.options.server?.handlers?.GET;

			const response = await (
				handler as (context: { request: Request }) => Response
			)({
				// The deployment's own origin, read from the catalogue rather than
				// typed: the point of the assertion is "not localhost", and a second
				// copy of the domain here would outlive a rename of the first.
				request: new Request(`${SITE.url}/auth/dev`),
			});

			expect(response.status).toBe(404);
			expect(response.headers.get("set-cookie")).toBeNull();
		} finally {
			if (previous === undefined) delete process.env.DEV_SIGNIN;
			else process.env.DEV_SIGNIN = previous;
		}
	});
});
