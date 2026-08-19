import type { MarkdownBlockProps } from "@sushindustries/ui";
import { ClientOnly } from "@tanstack/react-router";
import { lazy, type ReactNode, Suspense } from "react";
import { pacedImport } from "../showcase/paced-import";
import { useNearViewport, useProductModel } from "../showcase/use-model";

/*
 * A 3D product viewer, embedded in Markdown.
 *
 *   <!-- ::start:viewer model="/models/logo.glb" variant="White" height="420" -->
 *   <!-- ::end:viewer -->
 *
 * This is the piece that makes documentation worth reading: the component
 * being described is the component on the page, loading the same asset a
 * consumer would load. A screenshot cannot go out of date because it was never
 * right in the first place.
 *
 * Four things keep it from wrecking the page it sits in:
 *
 *  - `useNearViewport` - a viewer block usually sits far down a document, and
 *    one the reader never scrolls to now costs nothing at all: no chunk, no
 *    GLB, no GL context. Work starts half a viewport before arrival.
 *  - TanStack Query owns the asset (`useProductModel`) - the GLB bytes fetch
 *    in parallel with the viewer code instead of after it, and two blocks
 *    showing one model share one download.
 *  - `lazy` through the pacer - three and R3F are ~600 kB that arrive when
 *    the browser is idle, never against the page's own paint.
 *  - `ClientOnly` and a reserved box - three cannot run on a server, and the
 *    fallback is the same height as the viewer, so SSR is safe and the prose
 *    below does not jump when the canvas mounts.
 */

const ProductViewer = lazy(() =>
	pacedImport(() => import("@sushindustries/react-product-viewer")),
);

function toNumber(value: string | undefined, fallback: number): number {
	const parsed = Number(value);
	return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export function ViewerBlock({ attributes }: MarkdownBlockProps): ReactNode {
	const { ref, near } = useNearViewport<HTMLDivElement>();
	const url = attributes.model;
	const height = toNumber(attributes.height, 420);

	// A block with no model is an authoring mistake; say so rather than
	// rendering an empty canvas that looks like a loading bug.
	if (!url) {
		return (
			<div className="viewer-frame" style={{ height }}>
				<p className="label m-0">viewer: missing `model` attribute</p>
			</div>
		);
	}

	return (
		<div className="viewer-frame" style={{ height }} ref={ref}>
			<ClientOnly fallback={<ViewerFallback />}>
				{near ? (
					<LoadedViewer url={url} attributes={attributes} />
				) : (
					<ViewerFallback />
				)}
			</ClientOnly>
		</div>
	);
}

/*
 * Mounted only once the block is near the viewport, which is what makes the
 * hooks inside it deferred: an unmounted component runs no query and triggers
 * no import.
 */
function LoadedViewer({
	url,
	attributes,
}: {
	url: string;
	attributes: MarkdownBlockProps["attributes"];
}): ReactNode {
	const gltf = useProductModel(url);

	// Held until code *and* asset are ready, so the canvas mounts with the
	// bytes already local and never shows its own loading scrim.
	if (!gltf) return <ViewerFallback />;

	const variants = attributes.variant ? [attributes.variant] : undefined;

	return (
		<Suspense fallback={<ViewerFallback />}>
			<ProductViewer
				model={{
					url,
					realLength: toNumber(attributes.realLength, 1),
				}}
				gltf={gltf}
				variants={variants}
				// Logos and objects you pick up read wrong when the orbit is
				// clamped to the horizon; things that sit on a floor do not.
				groundBound={attributes.groundBound === "true"}
				loadingLabel={attributes.label ?? "Loading model"}
			/>
		</Suspense>
	);
}

function ViewerFallback(): ReactNode {
	return (
		<div className="flex items-center justify-center h-full">
			<p className="label m-0">Loading model</p>
		</div>
	);
}
