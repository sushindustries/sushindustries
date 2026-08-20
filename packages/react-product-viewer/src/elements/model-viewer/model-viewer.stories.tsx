import type { Meta, StoryObj } from "../../story";
import { ModelViewer } from "./model-viewer";
import type { ModelViewerProps } from "./model-viewer.types";

/**
 * Every story renders the same asset.
 *
 * One model across the whole lab, and it is ours: authored rather than
 * borrowed, exported with its four
 * finishes authored as `KHR_materials_variants`. Nothing here depends on a
 * sample asset belonging to somebody else, which is what makes this repository
 * safe to make public without an attribution audit.
 */
const LOGO = { url: "/models/logo.glb" };

const meta: Meta<ModelViewerProps> = {
	title: "Elements/Model Viewer",
	component: ModelViewer,
	args: { model: LOGO },
};

export default meta;

/** The ordinary case: a viewer someone opened, where the wheel is theirs to zoom with. */
export const Default: StoryObj<ModelViewerProps> = {
	description:
		'scroll="zoom", the default. Suits a dialog or a stage - anywhere the visitor arrived deliberately.',
	height: "480px",
};

/**
 * The one that matters for a hero.
 *
 * A viewer in the flow of a document must not eat the wheel, or the page has a
 * region a visitor cannot scroll past. Scroll inside this frame: the page moves
 * and the model does not.
 */
export const PageScroll: StoryObj<ModelViewerProps> = {
	args: { scroll: "page" },
	description:
		'scroll="page" - the wheel scrolls the document. Scroll over the model: the page moves past it instead of zooming. This is what a hero needs, and on a phone it is the difference between a page that scrolls and one that does not.',
	height: "620px",
	render: (args) => (
		<article>
			<div style={{ height: 360 }}>
				<ModelViewer {...args} />
			</div>
			<div style={{ padding: "24px", maxWidth: "62ch" }}>
				<h2 style={{ margin: "0 0 8px", fontSize: "18px" }}>
					Scroll back up into the model
				</h2>
				<p style={{ margin: 0, lineHeight: 1.6, color: "#566270" }}>
					The page keeps scrolling. With the default <code>scroll="zoom"</code>{" "}
					the wheel would be captured up there, and at phone width - where the
					canvas spans the viewport - this paragraph would be unreachable.
				</p>
			</div>
		</article>
	),
};

/**
 * The compromise, and the same one an embedded map makes.
 *
 * Scrolling past does not capture; holding a modifier zooms. The hint appears
 * only on the scroll that did nothing, which is the one moment it is worth
 * reading.
 */
export const ModifierZoom: StoryObj<ModelViewerProps> = {
	args: { scroll: "modifier" },
	description:
		'scroll="modifier" - the wheel scrolls the page and zooms only while ctrl or cmd is held. Scroll once without the key to see the hint appear and time itself out.',
	height: "480px",
};

/** The four finishes, authored into the asset rather than tinted at runtime. */
export const FinishWhite: StoryObj<ModelViewerProps> = {
	args: { variants: ["White"] },
	description:
		"KHR_materials_variants swaps the whole material, not a colour. White keeps the normal map, so the relief survives - a flat colour with no normals collapses the logo into a silhouette.",
	height: "480px",
};

export const FinishBlack: StoryObj<ModelViewerProps> = {
	args: { variants: ["Black"] },
	height: "480px",
};

export const FinishNothing: StoryObj<ModelViewerProps> = {
	args: { variants: ["Nothing"] },
	description:
		'"Nothing" drops every map including the normal, on purpose: it is the finish for showing form with no surface treatment at all.',
	height: "480px",
};

/**
 * A variant the asset does not carry.
 *
 * `applyVariant` cannot tell "no such variant" from "nothing to change", so a
 * configurator offering a finish the GLB has never heard of looks like it works
 * and silently does nothing. This story is what that failure looks like.
 */
export const UnknownVariant: StoryObj<ModelViewerProps> = {
	args: { variants: ["Brushed brass"] },
	description:
		"Renders the default material and changes nothing. Use missingVariants() at build time to catch this before a customer does.",
	height: "480px",
};

/** A grid square means something only when the model declares a real length. */
export const WithGrid: StoryObj<ModelViewerProps> = {
	args: { model: { ...LOGO, realLength: 1.9 }, grid: true },
	description:
		"realLength puts the scene in the caller's units, so one grid square is one unit. Without it the grid is decoration at an arbitrary scale.",
	height: "480px",
};

/** Right for something you pick up; wrong for something that sits on a floor. */
export const Unbounded: StoryObj<ModelViewerProps> = {
	args: { groundBound: false },
	description:
		"groundBound={false} lets the camera pass under the object. The default clamps the orbit just above the horizon, because a product sitting on a ground plane looks broken from beneath it.",
	height: "480px",
};
