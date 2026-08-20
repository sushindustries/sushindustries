import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { openSession } from "../../content/github-auth.server";
import { type StudioReport, studioReport } from "./overview.server";

/*
 * The loader-facing half of the studio.
 *
 * `/studio` has a component, so it is in the client bundle, and both
 * `github-auth.server.ts` and `studio.server.ts` are deny-listed there by
 * their suffix. Import protection failed the build when the route reached for
 * them directly, which is the check working rather than an obstacle: a route
 * that can import the session signer can leak it.
 *
 * So this is the bridge, and it is the case the convention describes - the
 * answer differs per visitor and per moment, which is exactly when a server
 * function is right and a build-time glob is not.
 *
 * The session is checked here rather than in the route, because a check that
 * runs anywhere the client can reach is not a check. What crosses back is a
 * report and a login, and never the cookie or the key that signed it.
 */

export interface StudioView {
	readonly login: string;
	readonly report: StudioReport;

	/**
	 * Where to send somebody who is not signed in.
	 *
	 * Carried on the same reply rather than worked out by the route, because
	 * the route is in the client bundle and the answer depends on two things
	 * only the server can see: an environment variable, and the host the
	 * request actually arrived on.
	 */
	readonly signInHref: string;
}

/**
 * Which door to offer somebody who is not signed in.
 *
 * The same two conditions `/auth/dev` itself enforces, asked rather than
 * assumed. Sending a visitor on a laptop to `/auth/github` was the bug this
 * fixes: this repo's OAuth app has one callback URL and it points at the
 * deployment, so the GitHub round trip cannot complete from localhost - the
 * page bounced to a sign-in that could never finish, and the only way in was
 * to know `/auth/dev` existed and type it.
 *
 * The door does not open here. `/auth/dev` re-checks both conditions itself,
 * because a link is a suggestion and a route is a gate.
 */
function signInHref(request: Request): string {
	if (!process.env.DEV_SIGNIN) return "/auth/github";

	const { hostname } = new URL(request.url);
	const local =
		hostname === "localhost" ||
		hostname === "127.0.0.1" ||
		hostname === "[::1]";

	return local ? "/auth/dev" : "/auth/github";
}

/**
 * The report, for whoever is signed in, or where to sign in for whoever is not.
 *
 * A destination rather than an error, so the route can redirect. Throwing here
 * would mean a visitor who has simply not signed in yet meets an error page,
 * which is the wrong thing to show somebody who has done nothing wrong.
 */
export const readStudio = createServerFn({ method: "GET" }).handler(
	async (): Promise<StudioView | { readonly signInHref: string }> => {
		const request = getRequest();
		const session = openSession(request);

		if (!session) return { signInHref: signInHref(request) };

		return {
			login: session.login,
			report: await studioReport(),
			signInHref: signInHref(request),
		};
	},
);
