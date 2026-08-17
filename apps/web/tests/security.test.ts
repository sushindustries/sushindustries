import { beforeAll, describe, expect, inject, test } from "vitest";
import { EMBED_PROVIDERS } from "../src/modules/security/embeds";

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
