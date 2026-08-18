import type { Meta, StoryObj } from "../../story";
import { ModelCard } from "./model-card";
import type { ModelCardProps } from "./model-card.types";

/**
 * One asset for the whole lab, and it is ours.
 *
 * Built by `scripts/build-logo-model.mjs`, with four finishes authored as
 * `KHR_materials_variants`. Nothing here borrows a sample model belonging to
 * somebody else.
 */
const LOGO = { url: "/models/logo.glb" };

const meta: Meta<ModelCardProps> = {
	title: "Elements/Model Card",
	component: ModelCard,
	args: {
		title: "Sushindustries mark",
		description: "The logo, reconstructed and decimated to 40k triangles.",
		model: LOGO,
		href: "#mark",
	},
};

export default meta;

/** One card, as a grid cell would render it. No poster set, so the placeholder shows. */
export const Default: StoryObj<ModelCardProps> = {
	description:
		"A card is a picture by default: no WebGL context, no three.js in the bundle. The gradient is the placeholder shown when no poster is supplied.",
	height: "380px",
	render: (args) => (
		<div style={{ padding: 20, maxWidth: 360 }}>
			<ModelCard {...args} />
		</div>
	),
};

/**
 * The card the whole design exists for.
 *
 * Six cards, none of them live. Set `activateOn` on all six and this frame
 * alone opens six WebGL contexts; the lab shows three frames at once, so
 * eighteen - past the browser's cap, where it starts discarding the oldest and
 * cards go black on scroll.
 */
export const Grid: StoryObj<ModelCardProps> = {
	description:
		'Six cards at activateOn="never", which is the default and the only setting a real catalogue should use. The grid is the reason posters exist.',
	height: "760px",
	render: (args) => (
		<div
			style={{
				display: "grid",
				gap: 16,
				padding: 20,
				gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
			}}
		>
			{[
				{ ...args, title: "Sushindustries mark", model: LOGO },
				{
					...args,
					title: "The mark, white",
					description: "Flat white, normal map kept.",
					model: LOGO,
				},
				{
					...args,
					title: "The mark, black",
					description: "Flat black, normal map kept.",
					model: LOGO,
				},
				{
					...args,
					title: "A product whose name runs on well past one line of the card",
					description:
						"And a description that also runs long, to prove the two-line clamp holds the grid square when the copy will not.",
					model: LOGO,
				},
				{ ...args, title: "Short", description: undefined, model: LOGO },
				{ ...args, title: "The mark, no finish", model: LOGO },
			].map((card) => (
				<ModelCard key={card.title} {...card} />
			))}
		</div>
	),
};

/**
 * The edge that the clamp exists for.
 *
 * A long title and a long description once pushed the footer out of the card
 * and left a row of cards at three different heights.
 */
export const LongCopy: StoryObj<ModelCardProps> = {
	args: {
		title: "A product whose name runs on well past one line of the card",
		description:
			"And a description that keeps going, and going, well past the two lines the card reserves for it, which is exactly the case the clamp is here to survive.",
		footer: <strong>£1,240</strong>,
	},
	description:
		"Title clamps to one line, description to two, and both reserve their space whether or not the text fills it - so a row of cards is one height.",
	height: "400px",
	render: (args) => (
		<div style={{ display: "flex", gap: 16, padding: 20 }}>
			<div style={{ flex: 1 }}>
				<ModelCard {...args} />
			</div>
			<div style={{ flex: 1 }}>
				<ModelCard
					{...args}
					title="Short"
					description="One line."
					model={LOGO}
				/>
			</div>
		</div>
	),
};

/** Press the corner control and the still becomes a running scene. */
export const ActivateOnPress: StoryObj<ModelCardProps> = {
	args: { activateOn: "press", footer: <strong>£1,240</strong> },
	description:
		'activateOn="press" - works on touch, spends a WebGL context only on the card someone asked about. The viewer arrives in its own chunk.',
	height: "420px",
	render: (args) => (
		<div style={{ padding: 20, maxWidth: 360 }}>
			<ModelCard {...args} />
		</div>
	),
};

/**
 * Two cards live at once, to show what upgrading costs.
 *
 * `visible` releases the context on the way out as well as taking one on the
 * way in, so the live count follows the viewport rather than the scroll depth.
 */
export const ActivateOnVisible: StoryObj<ModelCardProps> = {
	args: { activateOn: "visible", variants: ["White"] },
	description:
		'activateOn="visible" - for one or two featured cards, never for a grid. Watch the model appear over the placeholder rather than replacing it.',
	height: "420px",
	render: (args) => (
		<div style={{ display: "flex", gap: 16, padding: 20 }}>
			<div style={{ flex: 1 }}>
				<ModelCard {...args} />
			</div>
			<div style={{ flex: 1 }}>
				<ModelCard {...args} title="The mark, black" variants={["Black"]} />
			</div>
		</div>
	),
};

/** A badge over the visual and a price in the footer, which is most catalogues. */
export const WithBadgeAndPrice: StoryObj<ModelCardProps> = {
	args: {
		badge: "3 finishes",
		footer: (
			<>
				<strong>£1,240</strong>
				<button type="button" className="pv-trigger">
					Add
				</button>
			</>
		),
	},
	description:
		"The footer sits above the stretched link, so its button keeps its own click while the rest of the card still navigates.",
	height: "400px",
	render: (args) => (
		<div style={{ padding: 20, maxWidth: 360 }}>
			<ModelCard {...args} />
		</div>
	),
};
