import type { ReactNode } from "react";
import type { DeviceKind } from "./device-kinds";

export interface DeviceProps {
	/** The desktop. It scrolls on its own and chains at the end. */
	children: ReactNode;
	/**
	 * Which machine to draw.
	 *
	 * Left off, the stylesheet decides from the width of the window: a phone, a
	 * tablet from 720px, a laptop from 1080px. Set it and that choice wins
	 * everywhere, which is what a Settings panel writes and what a showcase uses
	 * to put all three on one page.
	 */
	kind?: DeviceKind;
	/** Drawn behind the desktop, and never in the way of a click. */
	wallpaper?: ReactNode;
	/** Shown in the strip at the top of the screen. */
	title?: string;
	/** Also in the strip, right-aligned. A search field, a clock, a count. */
	toolbar?: ReactNode;
	/** Pinned along the bottom of the screen, below the scrolling desktop. */
	dock?: ReactNode;
}

/*
 * A machine, open, with a usable screen in it.
 *
 * It is a phone, a tablet or a laptop, and **the stylesheet decides which** -
 * `packages/atoms/devices.md` is the table of widths and `devices.css` is what
 * it compiles to. Nothing here measures anything.
 *
 * That is the load-bearing decision. A component that reads `window.innerWidth`
 * and returns one of three trees renders none of them on the server, so the
 * first paint is wrong and the correction is a visible flash; and if it guesses
 * a default, it guesses differently than the server and React throws the whole
 * hydrated tree away. Rendering every part and letting media queries hide four
 * of them costs four empty elements and is correct before a single byte of
 * JavaScript has arrived. It is also why `kind` can override it with an
 * attribute and no re-render of anything.
 *
 * The frame is flat elements laid out in 3D. Two properties do the work, and
 * which element carries which is the entire trick:
 *
 *   perspective        on the outer stage, so there is one vanishing point for
 *                      the whole machine. Put it on the body and the body gets
 *                      its own, and the deck stops agreeing with it about where
 *                      the viewer is standing.
 *   transform-style    preserve-3d, so the screen inside the body stays in the
 *                      same space rather than being flattened to a picture.
 *
 * It does not animate open. It did, on scroll, and the lid rising was a thing
 * you had to wait through before you could use what was inside it - which is
 * the wrong trade for a frame around real controls.
 *
 * The screen is a real scroll container and its contents are real controls.
 * That matters more than it sounds: a machine drawn as a picture is a picture,
 * and this one has to work with a finger on a phone, where the whole thing is
 * 320px wide.
 */
export function Device({
	children,
	kind,
	wallpaper,
	title,
	toolbar,
	dock,
}: DeviceProps): ReactNode {
	return (
		<div className="device" data-device={kind}>
			<div className="device-body">
				<div className="device-screen">
					{wallpaper ? (
						<div className="device-wallpaper" aria-hidden="true">
							{wallpaper}
						</div>
					) : null}

					{/*
					 * A strip with a name in it, and no window controls.
					 *
					 * Deliberately not three coloured dots: those are one vendor's
					 * furniture, they mean close, minimise and zoom, and none of
					 * those three things can happen here. Drawing controls that do
					 * nothing is worse than drawing none.
					 */}
					{title || toolbar ? (
						<div className="device-strip">
							{title ? <span className="device-title">{title}</span> : null}
							{toolbar ? <span className="device-tools">{toolbar}</span> : null}
						</div>
					) : null}

					{/*
					 * `data-lenis-prevent` gives scrolling inside the screen back to
					 * the browser. A smooth-scroll driver intercepts wheel and touch
					 * for the whole document and animates the page itself, so a
					 * container with its own overflow is invisible to it and a drag
					 * inside this desktop scrolls the article behind the machine.
					 * Inert for anyone not running one.
					 *
					 * It does not trap: the desktop's overscroll chains, so reaching
					 * the bottom of it carries on down the page. Somebody scrolling
					 * past should never have to find a margin beside the machine to
					 * get out of it.
					 */}
					<div className="device-desktop" data-lenis-prevent>
						{children}
					</div>

					{/*
					 * Pinned, so it stays put while the desktop scrolls under it.
					 *
					 * The dock is a direct child of the screen rather than of the
					 * scrolling desktop, so anything it opens is measured against the
					 * screen and clipped by the screen, which is the shape somebody
					 * looking at it expects. Inside the desktop it would be measured
					 * against a scrolled box and cropped by it.
					 */}
					{dock}
				</div>

				{/*
				 * The chrome that is not always there.
				 *
				 * All four are always in the DOM and each is shown or hidden by a
				 * `display` the stylesheet sets per machine. That is the same
				 * decision as above, applied to the details: a camera dot that only
				 * exists in the phone branch is a camera dot that flickers into being
				 * when somebody resizes, and a branch is a place a bug can hide.
				 */}
				<div className="device-camera" aria-hidden="true" />
				<div className="device-bar" aria-hidden="true" />
				<div className="device-hinge" aria-hidden="true" />

				{/* The back of the case. It is what gives the bezel thickness. */}
				<div className="device-back" aria-hidden="true" />
			</div>

			<div className="device-base" aria-hidden="true">
				<div className="device-deck" />
				<div className="device-pad" />
			</div>

			<div className="device-shadow" aria-hidden="true" />
		</div>
	);
}
