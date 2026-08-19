/*
 * The two themes, and the cookie they live in.
 *
 * `.schemas.ts` because both the server and the client need every value here
 * and neither may import the other's module. The server reads the cookie out
 * of a request header; the browser writes it with `document.cookie`. One file
 * means the name, the max-age and the allowed values cannot drift between the
 * two halves - which is the failure that produces a theme that saves and never
 * loads back.
 */

export const THEMES = ["light", "dark"] as const;

export type Theme = (typeof THEMES)[number];

export const THEME_COOKIE = "sushi-theme";

/**
 * A year.
 *
 * Long, because this is a preference and not a session: somebody who chose dark
 * in March should not be handed light in April because a number expired. It is
 * not `Infinity` because browsers cap cookie lifetimes anyway, and a value
 * pretending otherwise is a value that lies in a code review.
 */
export const THEME_MAX_AGE = 60 * 60 * 24 * 365;

/**
 * The site's answer when nobody has chosen.
 *
 * Light, and *not* `prefers-color-scheme`. That is the whole difficulty with
 * theming a server-rendered page: the server cannot see a media query, so a
 * default of "whatever the reader's system says" is a default the first byte
 * cannot honour. It would mean rendering light, then correcting to dark after
 * hydration, which is precisely the flash a cookie exists to avoid.
 *
 * `Settings` offers System, and choosing it writes a cookie like any other
 * choice - so the preference becomes something the server *can* see. The
 * difference is that the reader opted into one paint of the wrong theme, once,
 * instead of everybody getting it on every visit.
 */
export const DEFAULT_THEME: Theme = "light";

/** A value from anywhere, narrowed. Anything unrecognised is the default. */
export function asTheme(value: string | undefined | null): Theme {
	return THEMES.includes(value as Theme) ? (value as Theme) : DEFAULT_THEME;
}

/**
 * The cookie header, parsed for one name.
 *
 * Written out rather than pulled from a dependency: this reads a single
 * documented header format for a single key, and a cookie parser is the kind of
 * dependency that arrives for four lines and stays for years.
 */
export function readThemeCookie(header: string | undefined): Theme {
	if (!header) return DEFAULT_THEME;

	for (const part of header.split(";")) {
		const at = part.indexOf("=");
		if (at < 0) continue;

		if (part.slice(0, at).trim() !== THEME_COOKIE) continue;
		return asTheme(decodeURIComponent(part.slice(at + 1).trim()));
	}

	return DEFAULT_THEME;
}
