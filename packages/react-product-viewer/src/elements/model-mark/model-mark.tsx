import { lazy, Suspense } from "react";
import { useMarkSpin } from "./use-mark-spin";
import type { ModelMarkProps } from "./model-mark.types";
import type { ReactElement } from "react";

/**
 * A model at icon size: turning, uninteractive, and layered over a real icon.
 *
 * The viewer this is built on is right for a hero and wrong for a 48px square
 * in four separate ways, and each one of them looks like a different bug:
 *
 * | What | Why it is wrong here | What it looks like |
 * | --- | --- | --- |
 * | Orbit controls | The canvas takes the pointerdown, so a button around it never receives the click | An icon that spins and refuses to open |
 * | Contact shadow | A second render target, re-baked every frame while the model turns | Nothing. It just costs |
 * | Fixed camera | `fov` is *vertical*, so a square canvas has a much narrower horizontal field of view than the landscape one the camera was placed for | "The model is blurry", or "the model is not rendering" |
 * | Progress scrim | An overlay and a 4px blur, right on a white card | A grey square that appears and vanishes |
 *
 * None of those are faults in `ModelViewer`. Every one of them is correct for a
 * product on a card, which is what it was built for. They are the reason this
 * element exists rather than a note in the documentation telling everybody to
 * remember four props.
 *
 * `glyph` is layered *under* the canvas and never removed. See the prop.
 */

/*
 * Lazily, and from inside this module rather than the consumer's, so the split
 * happens whether or not they remember to ask for it. A mark that never becomes
 * live - reduced motion, a server render - never downloads three at all.
 *
 * From the element beside this one, which is now the only implementation of
 * the canvas. It briefly had to come from an older `product-viewer.tsx`,
 * because for a while there were two of them and only that one carried `fit`,
 * `controls`, `shadows` and `pivot` - the props this element exists to set.
 * That file is gone and they live here.
 */
const Viewer = lazy(async () => {
	const module = await import("../model-viewer/model-viewer");
	return { default: module.ModelViewer };
});

export function ModelMark({
	model,
	glyph,
	seconds = 14,
	motion = "spin",
	spinAnyway = false,
	className,
	style,
	label,
}: ModelMarkProps): ReactElement {
	const { modelRef, live } = useMarkSpin(seconds, spinAnyway, motion);

	return (
		/*
		 * `img` with a label, because that is what this is.
		 *
		 * The canvas contributes nothing to the accessibility tree and the glyph
		 * under it is decorative, so without a role and a name this is a hole in
		 * the page. `img` is the role that means "one thing, look at it", which
		 * is exactly right and is also what stops a screen reader walking into
		 * the SVG's children.
		 */
		<span
			className={["pv-mark", className].filter(Boolean).join(" ")}
			style={style}
			data-live={live ? "true" : "false"}
			/*
			 * The variant as an attribute, not as a second class name.
			 *
			 * `data-motion` travels with the component, cannot be applied without
			 * its base, and is visible in the props rather than in a stylesheet
			 * somebody has to find. `.pv-mark--tumble` would be none of those.
			 */
			data-motion={motion}
			role="img"
			aria-label={label}
		>
			{glyph ? (
				<span className="pv-mark__glyph" aria-hidden="true">
					{glyph}
				</span>
			) : null}

			{live ? (
				// No fallback: the glyph underneath is already showing, and a second
				// placeholder on top of it is a flicker between two states of the
				// same picture.
				<Suspense fallback={null}>
					<span className="pv-mark__canvas">
						<Viewer
							model={model}
							modelRef={modelRef}
							// Fitted to the model, because this canvas is square and the
							// default camera is placed for a landscape one.
							fit
							// Turned about its own middle. With the base on y=0 the mass
							// sits entirely above the axis, so a Y rotation swings the
							// object around the origin rather than turning it on the spot -
							// which is the mark orbiting instead of spinning.
							pivot="center"
							// A picture that happens to be lit in real time.
							controls={false}
							shadows={false}
							// No rectangle announcing the canvas, and free to be seen from
							// underneath - a mark is not a product on a floor.
							transparent
							groundBound={false}
							loadingLabel={label ?? "Loading"}
						/>
					</span>
				</Suspense>
			) : null}
		</span>
	);
}

export default ModelMark;
