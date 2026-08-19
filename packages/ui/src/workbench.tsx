import type { ReactNode } from "react";

/*
 * A framed surface for a tool somebody works in, rather than a page they read.
 *
 * `Device` next door draws a machine - a laptop, a tablet, a phone, tilted in
 * 3D with a case and a hinge - and it is a showcase: the thing inside it is
 * being demonstrated. This is the same furniture with the machine taken off.
 * A title strip, a toolbar, a rail, a body that scrolls on its own and a
 * status line, all inside one border.
 *
 * That distinction is the reason this is not a prop on `Device`. A perspective,
 * a tilt and an aspect ratio are exactly wrong for a surface somebody is going
 * to sit in front of and use: the aspect ratio would crop real content to the
 * shape of a laptop lid, and text on a rotated plane is text that is slightly
 * blurred all day. What is worth keeping is the *layout* - the strip, the
 * scrolling body, the pinned status - and that is what is here.
 *
 * Everything is a slot and every slot is optional. A workbench with only
 * `children` is a bordered panel that scrolls, which is the smallest useful
 * version and the one most pages want.
 */

export interface WorkbenchProps {
	/** The body. Scrolls on its own; the page does not scroll with it. */
	readonly children: ReactNode;

	/** In the strip at the top. Small, monospaced, the name of the surface. */
	readonly title?: string;

	/** Also in the strip, right-aligned. Search, filters, a menu, a count. */
	readonly toolbar?: ReactNode;

	/** A column down the left of the body. Navigation, a tree, a filter list. */
	readonly rail?: ReactNode;

	/** Pinned along the bottom. Counts, a revision, when it last refreshed. */
	readonly status?: ReactNode;

	/**
	 * How tall the body is allowed to grow before it scrolls.
	 *
	 * A CSS length. Left off, the body is as tall as its content and nothing
	 * scrolls - which is right for a short table and wrong for a browser over
	 * a database, so the caller decides rather than a default guessing.
	 */
	readonly maxHeight?: string;

	/** Announced as a region with this name, for anyone navigating by landmark. */
	readonly label?: string;

	/**
	 * How much frame to draw.
	 *
	 * `machine` is the case and the sunken screen - an object sitting on the
	 * page, which is right when the workbench *is* the page's content.
	 *
	 * `panel` is one border and no case. It exists because the case is a second
	 * material, and a second material inside a first one reads as a surface
	 * floating on a surface - so a workbench inside a card, a dialog or another
	 * workbench wants this rather than the full machine.
	 *
	 * `bare` is the layout with no frame at all: the strip, the rail, the
	 * scrolling body and the status line, and nothing drawn around them. For a
	 * workbench that fills its container edge to edge, where a border would be
	 * a line against the window.
	 *
	 * All three are the same markup. Only the case and the screen change, which
	 * is what keeps the choice cosmetic rather than structural - switching
	 * variants can never move a slot or break a scroll container.
	 */
	readonly variant?: "machine" | "panel" | "bare";
}

export function Workbench({
	children,
	title,
	toolbar,
	rail,
	status,
	maxHeight,
	label,
	variant = "machine",
}: WorkbenchProps): ReactNode {
	return (
		<section
			className="workbench"
			// An attribute rather than a class, so the stylesheet selects on
			// `[data-variant="panel"]` and a caller cannot half-apply a variant by
			// passing one of its two class names.
			data-variant={variant}
			aria-label={label ?? title}
			// Set as a property rather than as a height, so the body can be
			// shorter than this and only starts scrolling when it is not.
			style={
				maxHeight
					? ({ "--workbench-body": maxHeight } as React.CSSProperties)
					: undefined
			}
		>
			{/*
			 * The case and the screen are two elements, not one with a border.
			 *
			 * That is what the device does and it is the whole reason either reads
			 * as an object: the outer element is the shell, the inner one is sunk
			 * into it with its corners a bezel smaller. A single box with a border
			 * cannot express "a panel with thickness", and the difference is most
			 * of the look.
			 */}
			<div className="workbench-screen">
				{title || toolbar ? (
					<header className="workbench-strip">
						{title ? <span className="workbench-title">{title}</span> : null}
						{toolbar ? <div className="workbench-tools">{toolbar}</div> : null}
					</header>
				) : null}

				<div className="workbench-main">
					{/*
					 * The rail is a sibling of the body rather than a block inside it,
					 * so it stays put while the body scrolls. Inside, it would scroll
					 * away - which for a list of filters is the one thing it must not
					 * do, because it is what you reach for when you have scrolled.
					 */}
					{rail ? <nav className="workbench-rail">{rail}</nav> : null}

					{/*
					 * `data-lenis-prevent` hands scrolling inside the body back to the
					 * browser. A smooth-scroll driver intercepts wheel and touch for
					 * the whole document, so without this a drag in here animates the
					 * page behind the panel instead. Inert for anyone not running one.
					 */}
					<div className="workbench-body" data-lenis-prevent>
						{children}
					</div>
				</div>

				{status ? <footer className="workbench-status">{status}</footer> : null}
			</div>
		</section>
	);
}
