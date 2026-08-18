import { PostHogProvider, usePostHog } from "@posthog/react";
import { Consent } from "@sushindustries/ui";
import { type ReactNode, useSyncExternalStore } from "react";

/*
 * Page measurement, gated on a spoken yes.
 *
 * PostHog boots opted out and stays dark until the visitor answers the
 * `Consent` bar - `opt_out_capturing_by_default` means "pending" and "no"
 * are the same silence, and only an explicit yes starts the pageview stream.
 * The answer persists in localStorage, so the question is asked once.
 *
 * `persistence: "localStorage"` on purpose: this is one origin with no
 * subdomains to share state across, so PostHog sets no cookies at all. The
 * legal pages get to say "no cookies" and mean it literally.
 *
 * Vite exposes the public key and same-origin relay to the browser. The relay
 * (see `nitro.config.ts`) keeps the CSP at `connect-src 'self'`.
 */

const TOKEN = import.meta.env.VITE_POSTHOG_KEY;
const API_HOST = import.meta.env.VITE_POSTHOG_HOST;

const OPTIONS = {
	api_host: API_HOST,
	/*
	 * `api_host` is the same-origin relay, so this names the real dashboard -
	 * without it, PostHog's toolbar and debug links point at `/ingest`.
	 */
	ui_host: "https://eu.posthog.com",
	defaults: "2026-05-30",
	persistence: "localStorage",
	opt_out_capturing_by_default: true,
	capture_exceptions: {
		capture_unhandled_errors: true,
		capture_unhandled_rejections: true,
		capture_console_errors: false,
	},
} as const;

export function Measure({ children }: { children: ReactNode }): ReactNode {
	/*
	 * Unconfigured means dark, never broken. The site renders every page from
	 * Markdown inlined at build time; a counter is decoration, and a
	 * decoration that can take down the page - or the dev server - is a worse
	 * trade than a page with no counter on it. The warning is for the
	 * developer wondering where the numbers went.
	 */
	if (!TOKEN || !API_HOST) {
		if (import.meta.env.DEV) {
			console.warn(
				"VITE_POSTHOG_KEY / VITE_POSTHOG_HOST unset - nothing is measured.",
			);
		}
		return children;
	}

	return (
		<PostHogProvider apiKey={TOKEN} options={OPTIONS}>
			{children}
			<MeasureConsent />
		</PostHogProvider>
	);
}

/*
 * `useSyncExternalStore` with a server snapshot of "answered", so the server
 * renders no bar and the client's first paint agrees with it - the bar
 * appears after hydration only where the stored status says the question is
 * still open. A consent bar that flashes at somebody who already declined is
 * the question being un-asked.
 */
function MeasureConsent(): ReactNode {
	const posthog = usePostHog();

	const status = useSyncExternalStore(
		(onChange) => {
			window.addEventListener("ph-consent", onChange);
			return () => window.removeEventListener("ph-consent", onChange);
		},
		() => posthog.get_explicit_consent_status(),
		() => "denied" as const,
	);

	const answer = (granted: boolean) => {
		if (granted) posthog.opt_in_capturing();
		else posthog.opt_out_capturing();
		window.dispatchEvent(new Event("ph-consent"));
	};

	return (
		<Consent
			open={status === "pending"}
			onAccept={() => answer(true)}
			onDecline={() => answer(false)}
		>
			I count page views to see what is worth writing more of. No cookies,
			nothing personal, nothing sold - the numbers stay boring. Details in the{" "}
			<a href="/p/privacy" className="fg-accent">
				privacy note
			</a>
			.
		</Consent>
	);
}
