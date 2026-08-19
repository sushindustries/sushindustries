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
	/*
	 * On the server, load immediately.
	 *
	 * The note above used to claim this queue never runs on the server because
	 * nothing calls it before mount. That is wrong: `React.lazy` invokes its
	 * loader while rendering, and rendering happens on the server first. So
	 * every paced import queued itself into a queue whose only start signal is
	 * `requestIdleCallback`, which does not exist there - and the render sat
	 * waiting for a promise nothing would ever resolve.
	 *
	 * The symptom was every 3D preview and every archive card for a 3D
	 * component hanging until the request timed out. `/preview/product-viewer`
	 * took 25 seconds and returned nothing, while a preview with no paced
	 * import returned in 15 milliseconds.
	 *
	 * Both reasons for pacing are browser-only anyway: there is no first paint
	 * to protect and no WebGL context to lose.
	 */
	if (typeof window === "undefined") return load();

	arm();

	return new Promise<T>((resolve, reject) => {
		queue.addItem(() => load().then(resolve, reject));
	});
}
