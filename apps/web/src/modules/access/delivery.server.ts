import { SITE } from "../content/site.catalogue";
import { LINK_MINUTES, SCOPES, type Scope } from "./access.schemas";

/*
 * Getting a link to the person it was written for.
 *
 * One function with two implementations behind it, chosen by whether a mailer
 * is configured. That shape rather than "install Resend and require an API
 * key" is deliberate: the invitation feature has to be workable on a laptop
 * with no account anywhere, or it is a feature that can only be tested in
 * production, which is the same as one that is never tested.
 *
 * The two are not equivalent and the caller is told which happened. A sent
 * link is evidence the address exists and is reachable; a printed link is a
 * string somebody has to carry by hand, and it proves nothing about who ends
 * up holding it. Returning the same "ok" for both would let the interface
 * imply an assurance the second one cannot give.
 *
 * `.server.ts` because it holds an API key and talks to a third party.
 */

/**
 * Where an invitation link points.
 *
 * Here rather than in the package, because it is a route this site chose. A
 * package that built URLs would be a package that had guessed at somebody
 * else's routing.
 */
export const linkUrl = (origin: string, secret: string) =>
	`${origin}/access/${secret}`;

/** Whether anything can actually send. Both halves, or neither. */
export function mailerConfigured(): boolean {
	return Boolean(process.env.RESEND_API_KEY && process.env.RESEND_FROM);
}

export interface Delivery {
	readonly delivered: "sent" | "not-configured" | "failed";

	/** The link, when the caller has to deliver it themselves. */
	readonly url: string | null;

	readonly detail: string | null;
}

/** What the invitation says. Plain text, because a token is not a newsletter. */
function body(
	url: string,
	tokenName: string,
	scopes: readonly Scope[],
): string {
	return [
		`You have been given access to ${SITE.name}.`,
		"",
		`Collect it here, within ${LINK_MINUTES} minutes:`,
		"",
		url,
		"",
		`The link works once. It produces an API token called "${tokenName}",`,
		"which will be shown to you a single time and cannot be recovered",
		"afterwards - if you lose it, ask for another invitation.",
		"",
		"It will open:",
		...scopes.map(
			(scope) => `  - ${SCOPES[scope].title}. ${SCOPES[scope].about}`,
		),
		"",
		"If you were not expecting this, ignore it. Nothing exists until the",
		"link is used, and it stops working by itself.",
		"",
	].join("\n");
}

/**
 * Sends it, or reports honestly that it could not.
 *
 * A failure is returned rather than thrown. The invitation row is already
 * written by the time this runs, and throwing would leave the caller with a
 * live invitation and an exception - so the owner is told delivery failed and
 * handed the link, which is a worse outcome than a sent mail and a much better
 * one than a lost invitation.
 */
export async function deliver(
	url: string,
	email: string,
	tokenName: string,
	scopes: readonly Scope[],
): Promise<Delivery> {
	if (!mailerConfigured()) {
		/*
		 * Printed where the owner will see it, which on a laptop is the terminal
		 * running the server. Safe here and only here: without a mailer the link
		 * is already going to be handed over by hand, so the log is not a second
		 * place it leaks - it is the first place it exists.
		 */
		console.info(`[access] invitation for ${email}: ${url}`);

		return {
			delivered: "not-configured",
			url,
			detail:
				"No mailer is configured, so nothing was sent. Set RESEND_API_KEY and RESEND_FROM to have invitations delivered.",
		};
	}

	try {
		const response = await fetch("https://api.resend.com/emails", {
			method: "POST",
			headers: {
				authorization: `Bearer ${process.env.RESEND_API_KEY}`,
				"content-type": "application/json",
			},
			body: JSON.stringify({
				from: process.env.RESEND_FROM,
				to: [email],
				subject: `Your access to ${SITE.name}`,
				text: body(url, tokenName, scopes),
			}),
			signal: AbortSignal.timeout(8000),
		});

		if (!response.ok) {
			const said = await response.text().catch(() => "");
			return {
				delivered: "failed",
				// Handed back, so a failed send is recoverable rather than a
				// dead invitation somebody has to withdraw and recreate.
				url,
				detail: `The mailer refused with ${response.status}. ${said.slice(0, 200)}`,
			};
		}

		/*
		 * Not returned on success, and that is the point of the whole adapter:
		 * once the link is genuinely in an inbox, the only way to hold it is to
		 * hold that inbox, which is what makes redeeming it mean something.
		 */
		return { delivered: "sent", url: null, detail: null };
	} catch (error) {
		return {
			delivered: "failed",
			url,
			detail:
				error instanceof Error ? error.message : "The mailer did not answer.",
		};
	}
}
