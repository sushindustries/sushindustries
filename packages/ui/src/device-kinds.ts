/*
 * Generated from `packages/atoms/devices.md`. Do not edit by hand.
 *
 * The same widths `devices.css` compiles into media queries, in a form the
 * client can read. Nothing here draws anything: it exists so that code which
 * has to *name* the current machine - the assistant telling a model where it is
 * running, a settings panel listing what you can pick - agrees with the
 * stylesheet by construction instead of by memory.
 *
 * Add a machine by adding a row to the table, then `pnpm doctor --fix`.
 */

export type DeviceKind = "phone" | "tablet" | "laptop";

export interface DeviceProfile {
	readonly kind: DeviceKind;
	/** For a menu. Capitalised, one word. */
	readonly label: string;
	/** The `min-width` this machine takes over at. The first is always 0. */
	readonly from: number;
	/** The widest it is ever drawn, as a CSS length. */
	readonly width: string;
	/** The shape of its screen, as an `aspect-ratio` value. */
	readonly aspect: string;
	/** How many icons wide its desktop is. */
	readonly columns: number;
}

/**
 * Narrowest first, which is also the order the media queries are written in.
 *
 * Typed as a non-empty tuple, so `DEVICES[0]` is a `DeviceProfile` rather than
 * a `DeviceProfile | undefined`. That first entry is the fallback everywhere -
 * it is the machine with no lower bound, so it is what a browser that matches
 * no query gets and what a server render assumes - and having to null-check the
 * one element that is guaranteed to exist is a check that teaches the reader
 * the wrong thing. The doctor rejects a table with no rows, which is what makes
 * this true rather than asserted.
 */
export const DEVICES: readonly [DeviceProfile, ...DeviceProfile[]] = [
	// Held, so it is nearly face on. A phone tilted like a laptop reads as a phone falling over.
	{
		kind: "phone",
		label: "Phone",
		from: 0,
		width: "22rem",
		aspect: "3 / 6",
		columns: 3,
	},
	// Propped, so a little more rake than a phone and a lot less than a laptop. The 3:4 slab is the shape that says tablet without a keyboard under it.
	{
		kind: "tablet",
		label: "Tablet",
		from: 720,
		width: "40rem",
		aspect: "3 / 4",
		columns: 5,
	},
	// A long lens, because the machine should look like it is being looked at rather than photographed from six inches away.
	{
		kind: "laptop",
		label: "Laptop",
		from: 1080,
		width: "60rem",
		aspect: "16 / 10.4",
		columns: 7,
	},
];

export const DEVICE_KINDS: readonly DeviceKind[] = DEVICES.map(
	(device) => device.kind,
);

/**
 * The media query a machine takes over at, for `matchMedia`.
 *
 * The widest matching query wins, exactly as the cascade resolves it - so this
 * is only useful walked from the end, which is what `deviceKindFor` does.
 */
export function deviceQuery(kind: DeviceKind): string {
	const device = DEVICES.find((entry) => entry.kind === kind);

	return device && device.from > 0 ? `(min-width: ${device.from}px)` : "all";
}

/** Which machine a viewport of this width is, without touching the DOM. */
export function deviceKindFor(width: number): DeviceKind {
	// The first row has no lower bound, so it is what nothing-matched means.
	let found: DeviceKind = "phone";

	for (const device of DEVICES) {
		if (width >= device.from) found = device.kind;
	}

	return found;
}
