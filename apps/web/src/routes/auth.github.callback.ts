import { createFileRoute } from "@tanstack/react-router";
import {
	completeSignIn,
	sessionCookie,
} from "../modules/access/github-auth.server";
import { originFrom } from "../modules/registry/registry.server";

/*
 * Where GitHub sends you back.
 *
 * Checks the state it handed out, exchanges the code for a login, and either
 * sets a session or says no. The refusal is deliberately the same for "GitHub
 * refused" and "you are not the owner": distinguishing them tells a stranger
 * which logins exist.
 */
export const Route = createFileRoute("/auth/github/callback")({
	server: {
		handlers: {
			GET: async ({ request }) => {
				const url = new URL(request.url);
				const code = url.searchParams.get("code");
				const state = url.searchParams.get("state");

				const expected = request.headers
					.get("cookie")
					?.split(";")
					.map((part) => part.trim())
					.find((part) => part.startsWith("sushi-oauth-state="))
					?.slice("sushi-oauth-state=".length);

				/*
				 * The state check is what stops somebody handing you a link that
				 * signs you into their session. Missing is as bad as wrong.
				 */
				if (!code || !state || !expected || state !== expected) {
					return new Response("Sign-in could not be completed.", {
						status: 400,
						headers: { "content-type": "text/plain; charset=utf-8" },
					});
				}

				const origin = originFrom(request);
				const login = await completeSignIn(code, origin);

				if (!login) {
					return new Response("Not authorised.", {
						status: 403,
						headers: { "content-type": "text/plain; charset=utf-8" },
					});
				}

				const secure = origin.startsWith("https");
				const headers = new Headers({ location: "/studio" });
				headers.append("set-cookie", sessionCookie(login, secure));
				// The state cookie has done its job and should not outlive it.
				headers.append(
					"set-cookie",
					`sushi-oauth-state=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure ? "; Secure" : ""}`,
				);

				return new Response(null, { status: 302, headers });
			},
		},
	},
});
