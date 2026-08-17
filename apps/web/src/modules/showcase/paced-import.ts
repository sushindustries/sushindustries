import { AsyncQueuer } from "@tanstack/react-pacer";

/*
 * Heavy imports, queued behind the page that needs to paint first.
 *
 * three + R3F is ~600 kB of JavaScript and a WebGL context per canvas. Left
 * alone, every `lazy(() => import(...))` on a page starts fetching the moment
 * it mounts - during hydration, in competition with the LCP image and the
 * fonts - and a page with several viewers boots several GL contexts at once,
 * which is exactly the "THREE.WebGLRenderer: Context Lost" crash.
 *
 * Two rules, one queue:
 *
 *  - nothing starts until the browser reports idle (with a timeout, because
 *    `requestIdleCallback` on a busy page can starve), so first paint wins;
 *  - `concurrency: 1` - viewers arrive one at a time rather than as a stampede.
 *
 * Module-level on purpose: one queue for the whole app is the point, and the
 * queue never runs on the server because nothing calls this before mount.
 */
const queue = new AsyncQueuer<() => Promise<unknown>>((task) => task(), {
	concurrency: 1,
	started: false,
});

let armed = false;

function arm(): void {
	if (armed) return;
	armed = true;

	const start = (): void => {
		queue.start();
	};

	if ("requestIdleCallback" in window) {
		window.requestIdleCallback(start, { timeout: 2500 });
	} else {
		setTimeout(start, 1200);
	}
}

/** `lazy(() => pacedImport(() => import("...")))` - same shape, later start. */
export function pacedImport<T>(load: () => Promise<T>): Promise<T> {
	arm();

	return new Promise<T>((resolve, reject) => {
		queue.addItem(() => load().then(resolve, reject));
	});
}
