import { type ReactNode, useEffect, useState } from "react";

export interface ClockProps {
	/**
	 * How often to re-read the time, in milliseconds.
	 *
	 * A clock showing minutes has no reason to tick every second: fifteen
	 * seconds is close enough that the displayed minute is never wrong for long,
	 * and it is four wake-ups a minute instead of sixty.
	 */
	every?: number;
	/** Passed straight to `Intl.DateTimeFormat`. */
	options?: Intl.DateTimeFormatOptions;
	/** Shown until the first client render. */
	placeholder?: string;
}

const DEFAULT: Intl.DateTimeFormatOptions = {
	weekday: "short",
	hour: "2-digit",
	minute: "2-digit",
};

/*
 * The reader's own day and time, in the reader's own place.
 *
 * `Intl.DateTimeFormat` with no locale and no time zone uses the browser's,
 * which is the reader's - so this is local time and a local weekday without
 * asking anybody for a location, sending anything anywhere, or being wrong for
 * whoever happens to be furthest from the server.
 *
 * **It renders nothing on the server, deliberately.** A server has its own
 * clock and its own zone, and rendering a time there means the markup says one
 * thing and the first client render says another - a hydration mismatch, which
 * React answers by discarding the tree and rebuilding it. On a page whose
 * controls are inside that tree, the cost of a mismatch is every button briefly
 * not working, which is a very high price for a clock.
 *
 * So the first paint is the placeholder, on both sides, and the time arrives on
 * the effect afterwards. `suppressHydrationWarning` is not used and is not
 * needed: there is no mismatch to suppress.
 */
export function Clock({
	every = 15_000,
	options = DEFAULT,
	placeholder = "--:--",
}: ClockProps): ReactNode {
	const [now, setNow] = useState<string | null>(null);

	/*
	 * `options` is an object literal at most call sites, so it has a new
	 * identity on every render. Keyed on its contents, or the effect below tears
	 * down and rebuilds its interval on every render of the page.
	 */
	const shape = JSON.stringify(options);

	useEffect(() => {
		const format = new Intl.DateTimeFormat(undefined, JSON.parse(shape));

		function tick(): void {
			setNow(format.format(new Date()));
		}

		tick();
		const timer = window.setInterval(tick, every);
		return () => window.clearInterval(timer);
	}, [every, shape]);

	return (
		<time className="clock mono text-xs" dateTime={now ?? undefined}>
			{now ?? placeholder}
		</time>
	);
}
