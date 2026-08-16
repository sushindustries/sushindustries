import { Card, Reveal, ScrollSpin, Section } from "@sushindustries/ui";
import { lazy, type ReactNode, Suspense } from "react";
import { PlaceholderMark } from "../chrome/placeholder-mark";

/*
 * The live examples, one per showcase id.
 *
 * Each entry is the smallest honest use of the component — small enough to
 * read at a glance, real enough that it would work if pasted. `source` is that
 * same example as text, kept beside the element rather than derived from it:
 * generating source from JSX is a compiler, and hand-writing it is two lines.
 *
 * They are only ever rendered inside the preview route, in an iframe, so a
 * demo that mounts something heavy costs nothing on the documentation page.
 */

const ProductViewer = lazy(
	() => import("@sushindustries/react-product-viewer"),
);

export interface Demo {
	/** The full example, shown in the showcase frame at real size. */
	readonly element: ReactNode;
	/**
	 * A compact, centred version for archive cards.
	 *
	 * Cards are 16:9 thumbnails. Several demos are deliberately taller than the
	 * viewport — a scroll effect has to be scrollable to be demonstrated — and
	 * dropping one of those into a thumbnail produces a scrollbar and a corner
	 * of a component instead of a picture of it. The poster is what the card
	 * shows; it falls back to `element` when the two can be the same.
	 */
	readonly poster?: ReactNode;
	readonly source: string;
	readonly language: string;
}

export const DEMOS: Readonly<Record<string, Demo>> = {
	"scroll-spin": {
		poster: <PlaceholderMark />,
		element: (
			<div style={{ minHeight: "160vh", paddingBlock: "10vh" }}>
				<ScrollSpin revolutions={1.5} tilt={10}>
					<PlaceholderMark />
				</ScrollSpin>
				<p className="label text-center mt-6">Scroll the frame</p>
			</div>
		),
		source: `<ScrollSpin revolutions={1.5} tilt={10}>
	<img src="/mark.svg" alt="" />
</ScrollSpin>`,
		language: "tsx",
	},

	reveal: {
		poster: (
			<Card title="I arrive on scroll">
				<p className="m-0 fg-dim text-sm">Fades and rises once, then stays.</p>
			</Card>
		),
		element: (
			<div style={{ minHeight: "160vh", paddingBlock: "40vh" }}>
				<Reveal>
					<Card title="I arrive on scroll">
						<p className="m-0 fg-dim text-sm">
							Fades and rises once, then stays.
						</p>
					</Card>
				</Reveal>
			</div>
		),
		source: `<Reveal delay={80}>
	<Card title="I arrive on scroll" />
</Reveal>`,
		language: "tsx",
	},

	card: {
		element: (
			<div className="card-grid">
				<Card title="With meta" meta="v0.1.0">
					<p className="m-0 fg-dim text-sm">Body goes here.</p>
				</Card>
				<Card title="As a link" href="https://tanstack.com" />
			</div>
		),
		source: `<Card title="With meta" meta="v0.1.0">
	<p>Body goes here.</p>
</Card>

<Card title="As a link" href="https://tanstack.com" />`,
		language: "tsx",
	},

	section: {
		element: (
			<Section id="demo" label="Label" title="A section heading">
				<p className="fg-dim m-0">
					The kicker and the heading reveal 80ms before this does.
				</p>
			</Section>
		),
		source: `<Section id="work" label="Work" title="A section heading">
	<p>Body content.</p>
</Section>`,
		language: "tsx",
	},

	"product-viewer": {
		element: (
			<Suspense
				fallback={<p className="label text-center">Loading the mark</p>}
			>
				<ProductViewer
					model={{ url: "/models/logo.glb", realLength: 1 }}
					loadingLabel="Loading the mark"
				/>
			</Suspense>
		),
		source: `const ProductViewer = lazy(
	() => import("@sushindustries/react-product-viewer"),
);

<Suspense fallback={null}>
	<ProductViewer model={{ url: "/models/logo.glb", realLength: 1 }} />
</Suspense>`,
		language: "tsx",
	},
};

export function findDemo(id: string): Demo | undefined {
	return DEMOS[id];
}
