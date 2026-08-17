import { embedOrigins } from "./embeds";

/*
 * The policy, assembled from what the site actually contains.
 *
 * A Content Security Policy is usually a string in a config file that nobody
 * dares change, and it goes stale the moment content moves: a page embeds
 * something new, the frame is refused, and the fix is a guess at which
 * directive was missing. The failure mode is always the same, and it is always
 * discovered by a reader.
 *
 * This one is built from the declarations the content is built from. The video
 * block points a frame at `EMBED_PROVIDERS.youtube.embed(...)`, and `frame-src`
 * is `EMBED_PROVIDERS.youtube.frame` - the same object, read twice. Adding a
 * provider adds its permission in the same commit as its URL, and a test
 * asserts every origin a block can emit appears in the header, so the two
 * cannot come apart without something going red.
 *
 * The directives below that are not about embeds are here for the same reason:
 * each names what needs it, so removing that feature is what removes the
 * permission.
 */

/** Everything the site itself talks to, beyond its own origin. */
const OWN_ORIGINS = {
	/** The star count on the nav. */
	connect: ["https://api.github.com"],
	/** "Open in StackBlitz" on component pages. */
	frame: ["https://stackblitz.com"],
} as const;

function directive(name: string, ...values: readonly string[]): string {
	return `${name} ${values.join(" ")}`;
}

export interface CspOptions {
	/**
	 * Dev needs what dev needs: Vite's HMR socket and the eval its transform
	 * pipeline uses. Both are exactly the holes an attacker would want, which
	 * is why they are a parameter rather than a permanent entry.
	 */
	readonly dev?: boolean;
}

export function contentSecurityPolicy({
	dev = false,
}: CspOptions = {}): string {
	const policy = [
		directive("default-src", "'self'"),

		/*
		 * `'unsafe-inline'`, and it is worth being straight about why.
		 *
		 * Start streams its hydration payload as inline scripts, and a nonce
		 * has to reach every one of them - the router's, the devtools', and
		 * anything a route adds - or the page simply does not boot. Until that
		 * is plumbed through, an inline allowance for scripts is the honest
		 * setting. Everything else here is tight enough that it still matters:
		 * `object-src 'none'` and `base-uri 'self'` close the two holes that
		 * turn an injection into a page takeover.
		 */
		directive(
			"script-src",
			"'self'",
			"'unsafe-inline'",
			/*
			 * `'wasm-unsafe-eval'`, because a GLB is decoded by WebAssembly.
			 *
			 * Compiling a Wasm module counts as evaluation under CSP, so a policy
			 * without this throws `CompileError: WebAssembly.instantiate()` inside
			 * the loader and the canvas mounts, sizes itself, and stays empty
			 * forever. Nothing fails loudly: the page is 200, the element is
			 * there, and the model is the only thing missing.
			 *
			 * It shipped that way, and it was invisible locally for the worst
			 * possible reason - dev adds `'unsafe-eval'`, which happens to permit
			 * Wasm too, so every viewer worked on this machine and none worked in
			 * production. Exactly what the `connect-src` note below describes,
			 * one directive up.
			 *
			 * This is the narrow form on purpose: it allows compiling Wasm and
			 * nothing else. `'unsafe-eval'` would also hand an injected string to
			 * `eval`, which is the hole this file exists to close.
			 */
			"'wasm-unsafe-eval'",
			...(dev ? ["'unsafe-eval'"] : []),
		),

		// The stylesheet is one file, but inline styles carry component state:
		// an aspect ratio, a grid minimum, a device width.
		directive("style-src", "'self'", "'unsafe-inline'"),

		directive("img-src", "'self'", "data:", "blob:", ...embedOrigins("img")),
		directive("font-src", "'self'", "data:"),
		directive("media-src", "'self'", "blob:", ...embedOrigins("media")),

		directive(
			"connect-src",
			"'self'",
			/*
			 * `blob:` because the model viewer fetches a `.glb`, wraps the bytes
			 * in an object URL and hands that to the loader, which fetches it
			 * again. Leaving it out passes every test that does not press play
			 * on a 3D viewer, and breaks every one that does - which is exactly
			 * how a policy ships broken.
			 */
			"blob:",
			...OWN_ORIGINS.connect,
			...embedOrigins("connect"),
			// Vite's HMR socket, dev only.
			...(dev ? ["ws:", "wss:"] : []),
		),

		directive(
			"frame-src",
			"'self'",
			...OWN_ORIGINS.frame,
			...embedOrigins("frame"),
		),

		/*
		 * `'self'`, not `'none'`: the archive frames this site's own preview
		 * routes, so forbidding every ancestor would blank every card on
		 * /components. Same-origin framing is the feature; anybody else's is
		 * still refused.
		 */
		directive("frame-ancestors", "'self'"),

		directive("form-action", "'self'"),
		directive("base-uri", "'self'"),
		directive("object-src", "'none'"),
		directive("worker-src", "'self'", "blob:"),
	];

	// Pointless against a dev server on http, and it breaks nothing to omit.
	if (!dev) policy.push("upgrade-insecure-requests");

	return policy.join("; ");
}

/*
 * The rest of the security headers, which are short and would otherwise each
 * grow a home of their own.
 *
 * `Permissions-Policy` is the one that matters to the video: fullscreen has to
 * be granted to the frames that ask for it, or the player's own fullscreen
 * button does nothing and the failure looks like a bug in the player.
 */
export function securityHeaders(
	options: CspOptions = {},
): Record<string, string> {
	/*
	 * Fullscreen is delegated to the frames that embed video, and to nobody
	 * else. `fullscreen=(self)` alone reads as the safe choice and is a bug:
	 * a cross-origin player can never be granted a capability the top level
	 * kept for itself, so the player's own fullscreen button would do nothing
	 * and look broken. Listing the embed origins is what makes it work while
	 * still refusing every other frame - and the list is the same declaration
	 * `frame-src` is built from.
	 */
	const players = embedOrigins("frame")
		.map((origin) => `"${origin}"`)
		.join(" ");

	/*
	 * No `Cross-Origin-Embedder-Policy`, deliberately.
	 *
	 * DevTools suggests one whenever a frame is blocked, and taking that advice
	 * here would break the site. `require-corp` refuses every cross-origin
	 * subresource that does not send `Cross-Origin-Resource-Policy`, and of the
	 * five origins this site embeds, four send no such header: Mux, TikTok,
	 * Facebook and StackBlitz. Only YouTube sends it. So the header that is
	 * supposed to stop a frame being blocked would block four of them.
	 *
	 * `credentialless` is the softer form and still strips credentials from
	 * cross-origin loads, which is exactly what the social embeds need to keep.
	 *
	 * COEP exists to buy cross-origin isolation - `SharedArrayBuffer`, precise
	 * timers, `performance.measureUserAgentSpecificMemory`. Nothing here uses
	 * any of them, so the trade is the whole embed layer for a capability the
	 * site does not want. Checked 2026-08-17; if a future feature needs
	 * isolation, the cost is re-measuring those five origins, not guessing.
	 */
	return {
		"content-security-policy": contentSecurityPolicy(options),
		"referrer-policy": "strict-origin-when-cross-origin",
		"x-content-type-options": "nosniff",
		"permissions-policy": [
			"accelerometer=()",
			"camera=()",
			"geolocation=()",
			"microphone=()",
			`fullscreen=(self ${players})`,
			"picture-in-picture=*",
		].join(", "),
	};
}
