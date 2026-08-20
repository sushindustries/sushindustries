import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { openSession } from "../../access/github-auth.server";
import { getHubBars, type HubBarValue } from "./hub.server";

/*
 * The hub chart's numbers, for the browser.
 *
 * One server function for one chart, which is the whole feature - there is no
 * read layer worth naming behind it because the read is a single statement.
 *
 * The session is checked here rather than in the route, because a server
 * function is an HTTP endpoint whether or not a route calls it.
 */
export const readHubBars = createServerFn({ method: "GET" }).handler(
	async (): Promise<readonly HubBarValue[]> => {
		if (!openSession(getRequest())) throw new Error("Not signed in.");
		return getHubBars();
	},
);
