import { useQuery, useQueryClient } from "@tanstack/react-query";
import { type RefObject, useEffect, useRef, useState } from "react";
import type { GLTF } from "three-stdlib";
import { pacedImport } from "./paced-import";

/*
 * The model asset, owned by TanStack Query instead of drei.
 *
 * Before this, the GLB could not start downloading until the ~600 kB viewer
 * chunk had downloaded, parsed, *and* mounted a canvas - drei's `useGLTF`
 * lives inside that chunk, so code and asset arrived in series. Here the two
 * halves are split by what they cost:
 *
 *  - the *bytes* are fetched with plain `fetch`, which depends on nothing and
 *    costs no main-thread time, so it starts the moment the query is enabled;
 *  - the *code* that parses them goes through `pacedImport`, the same queue
 *    that holds every heavy chunk back until the browser reports idle - so
 *    first paint still wins, exactly as before.
 *
 * By the time the pacer releases the parser, the bytes are usually already
 * local. Query also dedupes: three viewers of one GLB on a page are one
 * download, and one parse.
 *
 * The query key matches `productModelKey` from
 * `@sushindustries/react-product-viewer/query`, because that package's
 * `disposeModelCacheEntries` recognises entries by that key and frees the GPU
 * memory when Query evicts one - GPU buffers are not garbage-collected, so
 * without the subscription an eviction frees the JavaScript and leaks the
 * textures. Everything that reaches three is imported dynamically only:
 * statically it would land in the initial bundle, which is precisely the LCP
 * damage this module exists to prevent.
 */

/** Clients whose caches already dispose GPU memory on eviction. */
const wired = new WeakSet<object>();

export function useProductModel(url: string, enabled = true): GLTF | undefined {
	const client = useQueryClient();

	const { data } = useQuery({
		queryKey: ["product-model", url],
		enabled,
		// A parsed GLB at a given URL does not go stale on a timer; it changes
		// when the asset is republished, which is an invalidation, not an expiry.
		staleTime: Number.POSITIVE_INFINITY,
		// Shorter than Query's default, mirroring the package's own reasoning:
		// a stale JSON entry costs kilobytes of heap, a stale model costs every
		// texture and vertex buffer of something nobody is looking at.
		gcTime: 120_000,
		retry: 1,
		queryFn: async ({ signal }) => {
			const [blobUrl, { loadProductModel }] = await Promise.all([
				fetch(url, { signal }).then(async (response) => {
					if (!response.ok) {
						throw new Error(`${url} answered ${response.status}`);
					}
					return URL.createObjectURL(await response.blob());
				}),
				pacedImport(() => import("@sushindustries/product-viewer")),
			]);

			/*
			 * Wired here, after the heavy chunk is already resident, because the
			 * `query` entry imports the loader and importing it any earlier would
			 * sneak three past the pacer. The check-and-add is synchronous, so
			 * concurrent queries cannot both wire it.
			 */
			if (!wired.has(client)) {
				wired.add(client);
				const { disposeModelCacheEntries } = await import(
					"@sushindustries/react-product-viewer/query"
				);
				disposeModelCacheEntries(client);
			}

			/*
			 * The blob URL trick lets `loadProductModel` keep owning parse
			 * semantics without a new package API: GLTFLoader sniffs the binary
			 * header, so the extensionless URL is fine, and the GLB is
			 * self-contained so nothing resolves relative to it.
			 */
			try {
				return await loadProductModel(blobUrl, { signal });
			} finally {
				URL.revokeObjectURL(blobUrl);
			}
		},
	});

	return data;
}

/*
 * True once the element has been near the viewport, and never false again.
 *
 * For viewers sitting far down a document: a canvas nobody scrolls to should
 * cost nothing, not even a queued chunk download. "Near" rather than
 * "visible" - the margin starts the work half a viewport early, so by the
 * time the reader arrives the model is usually already there. Latching
 * matters: a viewer that unloads when scrolled past would re-run its whole
 * entrance on the way back up.
 */
export function useNearViewport<T extends HTMLElement>(
	margin = "50% 0px",
): { ref: RefObject<T | null>; near: boolean } {
	const ref = useRef<T | null>(null);
	const [near, setNear] = useState(false);

	useEffect(() => {
		const node = ref.current;
		if (!node || near) return;

		// No observer means a browser old enough that deferring is the risk.
		if (!("IntersectionObserver" in window)) {
			setNear(true);
			return;
		}

		const observer = new IntersectionObserver(
			(entries) => {
				if (entries.some((entry) => entry.isIntersecting)) {
					setNear(true);
					observer.disconnect();
				}
			},
			{ rootMargin: margin },
		);

		observer.observe(node);
		return () => observer.disconnect();
	}, [margin, near]);

	return { ref, near };
}
