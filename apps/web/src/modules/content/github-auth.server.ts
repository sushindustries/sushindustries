import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { REPO_SLUG } from "./repo";

/*
 * Signing in with GitHub, for the one page that needs to know who you are.
 *
 * The rest of this site knows nothing about visitors and should keep it that
 * way. `/studio` is the exception: it shows the state of a production database
 * and the answer to "who may look at that" is one person, so it needs a name
 * rather than a shared secret.
 *
 * GitHub's web flow rather than a library. It is a redirect, a code exchange
 * and one API call, all of which are already in this file - and an auth
 * dependency is a thing to keep patched forever in exchange for saving forty
 * lines. There is no user table and no password anywhere: GitHub says who you
 * are, this checks that against one login, and the answer lives in a signed
 * cookie until it expires.
 *
 * `.server.ts` because it holds the client secret and signs cookies.
 */

const COOKIE = "sushi-studio";

/** Eight hours. Long enough for a day's work, short enough to not be a key. */
const MAX_AGE = 8 * 60 * 60;

/** Who is allowed in. The repository owner, and nobody else. */
const OWNER = REPO_SLUG.split("/")[0] ?? "";

export interface Session {
	readonly login: string;
	readonly expires: number;
}

/**
 * Whether GitHub sign-in is configured at all.
 *
 * Both halves or neither. A client id with no secret produces a redirect that
 * lands on a callback which cannot complete, which is a worse failure than not
 * offering the button.
 */
export function githubConfigured(): boolean {
	return Boolean(
		process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET,
	);
}

/**
 * The key cookies are signed with.
 *
 * Falls back to the bearer token, which is already a high-entropy secret this
 * deployment holds. A separate variable would be better hygiene and one more
 * thing to set; reusing it means sign-in works the moment GitHub is configured
 * rather than after a third variable somebody forgot.
 */
function signingKey(): string {
	const key = process.env.SESSION_SECRET ?? process.env.MCP_AUTH_TOKEN;
	if (!key)
		throw new Error("No SESSION_SECRET or MCP_AUTH_TOKEN to sign with.");
	return key;
}

const sign = (value: string) =>
	createHmac("sha256", signingKey()).update(value).digest("base64url");

/** A cookie value: the payload, and a signature over it. */
function seal(session: Session): string {
	const payload = Buffer.from(JSON.stringify(session)).toString("base64url");
	return `${payload}.${sign(payload)}`;
}

/**
 * The session in a cookie, or null.
 *
 * Signature first, then expiry. Checking expiry first would mean reading a
 * timestamp out of a payload nobody has verified yet, which is trusting the
 * value to tell you whether to trust it.
 */
export function openSession(request: Request): Session | null {
	const raw = request.headers
		.get("cookie")
		?.split(";")
		.map((part) => part.trim())
		.find((part) => part.startsWith(`${COOKIE}=`))
		?.slice(COOKIE.length + 1);

	if (!raw) return null;

	const [payload, signature] = raw.split(".");
	if (!payload || !signature) return null;

	const expected = sign(payload);
	const a = Buffer.from(signature);
	const b = Buffer.from(expected);
	if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

	try {
		const session = JSON.parse(
			Buffer.from(payload, "base64url").toString("utf8"),
		) as Session;
		return session.expires > Date.now() ? session : null;
	} catch {
		return null;
	}
}

/** Where to send somebody who is not signed in, plus the state to check later. */
export function authorizeUrl(origin: string): { url: string; state: string } {
	const state = randomBytes(16).toString("base64url");
	const url = new URL("https://github.com/login/oauth/authorize");
	url.searchParams.set("client_id", process.env.GITHUB_CLIENT_ID ?? "");
	url.searchParams.set("redirect_uri", `${origin}/auth/github/callback`);
	// No scopes. The only question asked is "who are you", and the public
	// profile answers it - a token that can read repositories would be a
	// larger thing to hold for no extra information.
	url.searchParams.set("scope", "");
	url.searchParams.set("state", state);
	return { url: url.toString(), state };
}

/**
 * Exchanges the code for a login, and decides whether that login may enter.
 *
 * Returns null for both "GitHub refused" and "not the owner", deliberately:
 * telling an unknown visitor which of the two happened is telling them whether
 * a login exists and is one step of an enumeration nobody needs to be handed.
 */
export async function completeSignIn(
	code: string,
	origin: string,
): Promise<string | null> {
	const token = await fetch("https://github.com/login/oauth/access_token", {
		method: "POST",
		headers: { accept: "application/json", "content-type": "application/json" },
		body: JSON.stringify({
			client_id: process.env.GITHUB_CLIENT_ID,
			client_secret: process.env.GITHUB_CLIENT_SECRET,
			code,
			redirect_uri: `${origin}/auth/github/callback`,
		}),
		signal: AbortSignal.timeout(8000),
	})
		.then((response) => response.json() as Promise<{ access_token?: string }>)
		.catch(() => null);

	if (!token?.access_token) return null;

	const user = await fetch("https://api.github.com/user", {
		headers: {
			authorization: `Bearer ${token.access_token}`,
			accept: "application/vnd.github+json",
			"user-agent": "sushindustries-studio",
		},
		signal: AbortSignal.timeout(8000),
	})
		.then((response) => response.json() as Promise<{ login?: string }>)
		.catch(() => null);

	const login = user?.login;
	if (!login || login.toLowerCase() !== OWNER.toLowerCase()) return null;

	return login;
}

/** The `Set-Cookie` that signs somebody in. */
export function sessionCookie(login: string, secure: boolean): string {
	const value = seal({ login, expires: Date.now() + MAX_AGE * 1000 });

	/*
	 * `Lax` rather than `Strict`: the sign-in journey ends on a redirect back
	 * from github.com, and a Strict cookie is not sent on that navigation - so
	 * the session would be set and then invisible on the page it lands on.
	 */
	return [
		`${COOKIE}=${value}`,
		"Path=/",
		"HttpOnly",
		"SameSite=Lax",
		`Max-Age=${MAX_AGE}`,
		secure ? "Secure" : "",
	]
		.filter(Boolean)
		.join("; ");
}

/** The `Set-Cookie` that signs somebody out. */
export const clearCookie = (secure: boolean) =>
	[
		`${COOKIE}=`,
		"Path=/",
		"HttpOnly",
		"SameSite=Lax",
		"Max-Age=0",
		secure ? "Secure" : "",
	]
		.filter(Boolean)
		.join("; ");
