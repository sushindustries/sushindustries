import type { MarkdownBlockProps } from "@sushindustries/ui";
import { ClientOnly } from "@tanstack/react-router";
import { lazy, type ReactNode, Suspense } from "react";
import { pacedImport } from "../showcase/paced-import";

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
 * Three things keep it from wrecking the page it sits in:
 *
 *  - `lazy` - three and R3F are ~600 kB. They are fetched when a document that
 *    actually uses this block is rendered, and never otherwise.
 *  - `ClientOnly` - three cannot run on a server. Rendering it during SSR is
 *    not slow, it is a crash.
 *  - a reserved box - the fallback is the same height as the viewer, so the
 *    prose below it does not jump when the canvas mounts.
 */

const ProductViewer = lazy(() =>
	pacedImport(() => import("@sushindustries/react-product-viewer")),
);

function toNumber(value: string | undefined, fallback: number): number {
	const parsed = Number(value);
	return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export function ViewerBlock({ attributes }: MarkdownBlockProps): ReactNode {
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

	const variants = attributes.variant ? [attributes.variant] : undefined;

	return (
		<div className="viewer-frame" style={{ height }}>
			<ClientOnly fallback={<ViewerFallback />}>
				<Suspense fallback={<ViewerFallback />}>
					<ProductViewer
						model={{
							url,
							realLength: toNumber(attributes.realLength, 1),
						}}
						variants={variants}
						// Logos and objects you pick up read wrong when the orbit is
						// clamped to the horizon; things that sit on a floor do not.
						groundBound={attributes.groundBound === "true"}
						loadingLabel={attributes.label ?? "Loading model"}
					/>
				</Suspense>
			</ClientOnly>
		</div>
	);
}

function ViewerFallback(): ReactNode {
	return (
		<div className="flex items-center justify-center h-full">
			<p className="label m-0">Loading model</p>
		</div>
	);
}
