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
}

/**
 * The report, for whoever is signed in, or null for whoever is not.
 *
 * Null rather than an error, so the route can redirect to sign-in. Throwing
 * here would mean a visitor who has simply not signed in yet meets an error
 * page, which is the wrong thing to show somebody who has done nothing wrong.
 */
export const readStudio = createServerFn({ method: "GET" }).handler(
	async (): Promise<StudioView | null> => {
		const session = openSession(getRequest());
		if (!session) return null;

		return { login: session.login, report: await studioReport() };
	},
);
