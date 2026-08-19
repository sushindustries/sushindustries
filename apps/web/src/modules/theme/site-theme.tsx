import { ThemeToggle } from "@sushindustries/ui";
import { useRouter } from "@tanstack/react-router";
import { type ReactNode, useCallback, useState } from "react";
import {
	asTheme,
	THEME_COOKIE,
	THEME_MAX_AGE,
	type Theme,
} from "./theme.schemas";

/*
 * This site's theme switcher: the control, wired to a cookie and the document.
 *
 * Three steps on every change, and the order is the point.
 *
 *   1. the attribute, so the page repaints this frame
 *   2. the cookie, so the *server* renders it correctly next time
 *   3. React state, so the control shows what was pressed
 *
 * Doing 1 before 2 is what makes it feel instant: writing the cookie and
 * reloading would be simpler and would put a white flash between the click and
 * the result. Doing 2 at all is what makes the *next* visit correct in the
 * first byte, which is the thing `localStorage` cannot do.
 */

export interface SiteThemeProps {
	/** What the server rendered, so the first client render agrees with it. */
	readonly initial: Theme;
}

const OPTIONS = [
	{ id: "light", label: "Light", icon: "sun" },
	{ id: "dark", label: "Dark", icon: "moon" },
] as const;

/**
 * The cookie string, built in one place.
 *
 * `SameSite=Lax` because this is a display preference that has to survive
 * somebody following a link *to* the site. `Strict` would drop it on exactly
 * that navigation and hand them the default theme once, which is the flash
 * this whole design exists to prevent.
 *
 * `Secure` only over HTTPS, or the cookie is silently rejected on
 * `http://localhost` and the preference never persists in development.
 *
 * Written with `document.cookie` rather than the Cookie Store API that biome
 * suggests. Cookie Store is the better interface and it is not available in
 * Safari or Firefox, so using it would mean a feature test and two code paths
 * to set one string - and the fallback path would be this line anyway.
 */
function writeCookie(theme: Theme): string {
	const secure = window.location.protocol === "https:" ? "; Secure" : "";
	return `${THEME_COOKIE}=${theme}; Path=/; Max-Age=${THEME_MAX_AGE}; SameSite=Lax${secure}`;
}

export function SiteTheme({ initial }: SiteThemeProps): ReactNode {
	/*
	 * Seeded from the server's answer rather than read from the document.
	 *
	 * Reading `document.documentElement` during render would be a client-only
	 * value in a server-rendered tree - React would render one thing on the
	 * server and another on the client, throw the tree away, and every control
	 * on the page would briefly stop working. The server already knows; it hands
	 * the answer down.
	 */
	const [theme, setTheme] = useState<Theme>(initial);
	const router = useRouter();

	const choose = useCallback(
		(id: string) => {
			const next = asTheme(id);

			/*
			 * The attribute first, so the paint happens now.
			 *
			 * `data-theme` on `<html>` is what the stylesheet selects on, and
			 * changing it is a repaint rather than a re-render - no component
			 * anywhere subscribes to the theme, which is exactly why a whole site
			 * can change colour without React knowing.
			 */
			document.documentElement.dataset.theme = next;

			// biome-ignore lint/suspicious/noDocumentCookie: see below
			document.cookie = writeCookie(next);

			setTheme(next);

			/*
			 * The router is told, so anything the server rendered against the old
			 * theme is asked for again. Nothing on this site is theme-dependent on
			 * the server today, and this is one line that stops that from becoming
			 * a bug the first time something is.
			 */
			void router.invalidate();
		},
		[router],
	);

	return <ThemeToggle options={OPTIONS} value={theme} onChange={choose} />;
}
