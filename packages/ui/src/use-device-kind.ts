import { useEffect, useState } from "react";
import { DEVICES, type DeviceKind, deviceKindFor } from "./device-kinds";

/*
 * Which machine the stylesheet is currently drawing, as a value.
 *
 * The `Device` component does not need this and must not use it - it renders
 * every machine and lets media queries choose, which is the only way to be
 * right on the server. This is for the code that has to *say* which machine it
 * is: the assistant tells the model where it is running, and a settings panel
 * says what "Automatic" currently resolves to.
 *
 * Those are both things that happen after a click, so being `null` until the
 * first effect costs nothing. That `null` is deliberate rather than a default
 * of "laptop": a default would be a claim the server cannot support, and this
 * hook's whole job is to be honest about not knowing yet.
 */

/**
 * The machine the window's width currently selects, or `null` before mount.
 *
 * @param override A chosen machine. Returned as-is, and no listener is attached.
 */
export function useDeviceKind(override?: DeviceKind): DeviceKind | null {
	const [measured, setMeasured] = useState<DeviceKind | null>(null);

	useEffect(() => {
		if (override) return;
		if (typeof window === "undefined" || !window.matchMedia) return;

		/*
		 * One `MediaQueryList` per machine, and the widest match wins - which is
		 * exactly how the cascade resolves the same queries in `devices.css`.
		 * Reading `innerWidth` instead would be one line and would disagree with
		 * the stylesheet the moment a scrollbar is involved, because a media
		 * query measures the viewport including it and `innerWidth` does not.
		 */
		const queries = DEVICES.filter((device) => device.from > 0).map(
			(device) => ({
				kind: device.kind,
				list: window.matchMedia(`(min-width: ${device.from}px)`),
			}),
		);

		function settle(): void {
			// Nothing matched means the narrowest machine, which is the same
			// answer `devices.css` gives an element that fails every query.
			let kind = deviceKindFor(0);
			for (const query of queries) {
				if (query.list.matches) kind = query.kind;
			}
			setMeasured(kind);
		}

		settle();

		for (const query of queries) query.list.addEventListener("change", settle);

		return () => {
			for (const query of queries) {
				query.list.removeEventListener("change", settle);
			}
		};
	}, [override]);

	return override ?? measured;
}
