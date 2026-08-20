import { useEffect, useState } from "react";

/*
 * How the studio writes numbers and dates, once.
 *
 * Every panel here is rendered on the server with data the loader put in the
 * query cache, then hydrated on the client with the same data - so anything
 * the two sides would format differently is a hydration mismatch waiting for
 * the first visitor whose browser is not set to the server's locale. A bare
 * `toLocaleString()` is exactly that: Node says `1,234`, a Polish browser
 * says `1 234`, and React throws the server's tree away.
 *
 * So the locale and the time zone are pinned. `en-US` because the rest of
 * the studio's copy is English; UTC because it is the only zone both sides
 * are guaranteed to agree on. This is an owner's dashboard, not a visitor's
 * page - the point is that it hydrates, not that it flatters the reader's
 * region settings.
 */

const LOCALE = "en-US";

const INTEGER = new Intl.NumberFormat(LOCALE);

const DATE = new Intl.DateTimeFormat(LOCALE, {
	year: "numeric",
	month: "short",
	day: "numeric",
	timeZone: "UTC",
});

const DATE_TIME = new Intl.DateTimeFormat(LOCALE, {
	year: "numeric",
	month: "short",
	day: "numeric",
	hour: "2-digit",
	minute: "2-digit",
	timeZone: "UTC",
});

/** `1,234`. The same on both sides of the wire. */
export const number = (value: number): string => INTEGER.format(value);

/** `Aug 21, 2026`, in UTC, or a dash for nothing. */
export const date = (value: string | null): string =>
	value ? DATE.format(new Date(value)) : "-";

/** `Aug 21, 2026, 09:14 PM`, in UTC, or a dash for nothing. */
export const dateTime = (value: string | null): string =>
	value ? DATE_TIME.format(new Date(value)) : "-";

/**
 * How long ago, in the largest unit that is still true - and hydration-safe.
 *
 * "Ago" needs a clock, and the server's clock at render time is not the
 * client's clock at hydration time: a request that takes long enough to
 * cross a minute boundary renders `3m ago` on one side and `4m ago` on the
 * other. So the clock is not read during the first render at all. The server
 * and the hydrating client both print a placeholder, agree, and then the
 * client alone starts the clock after it has mounted.
 *
 * A hook rather than a function for exactly that reason: it has to know
 * whether it is mounted yet, and only a hook can.
 */
export function useAgo(iso: string | null): string {
	const [now, setNow] = useState<number | null>(null);

	useEffect(() => {
		setNow(Date.now());
	}, []);

	if (!iso) return "never";
	if (now === null) return "…";

	const minutes = Math.floor((now - Date.parse(iso)) / 60_000);
	if (minutes < 1) return "just now";
	if (minutes < 60) return `${minutes}m ago`;
	if (minutes < 60 * 24) return `${Math.floor(minutes / 60)}h ago`;
	return `${Math.floor(minutes / (60 * 24))}d ago`;
}
