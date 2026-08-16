import type { ReactNode } from "react";

export interface LaptopProps {
	/** What is on the screen. */
	children: ReactNode;
	/** Drawn behind the screen's contents. */
	wallpaper?: ReactNode;
	/** Shown in the strip at the top of the screen. */
	title?: string;
	/** Also in the strip, right-aligned. A search field, a clock, a count. */
	toolbar?: ReactNode;
	/** Pinned along the bottom of the screen, below the scrolling desktop. */
	dock?: ReactNode;
}

/*
 * A laptop, open, with a usable screen in it.
 *
 * The frame is three flat elements laid out in 3D: a lid tilted very slightly
 * back, a deck raked away from the viewer, and a soft contact shadow that stops
 * the whole thing floating. Two properties do the work, and which element
 * carries which is the entire trick:
 *
 *   perspective        on the outer stage, so there is one vanishing point for
 *                      the whole machine. Put it on the lid and the lid gets
 *                      its own, and the base stops agreeing with it about where
 *                      the viewer is standing.
 *   transform-style    preserve-3d, so the screen inside the lid stays in the
 *                      same space rather than being flattened to a picture.
 *
 * It does not animate open. It did, on scroll, and the lid rising was a thing
 * you had to wait through before you could use what was inside it - which is
 * the wrong trade for a frame around real controls. A laptop that is already
 * open is a laptop you can start reading.
 *
 * The screen is a real scroll container and its contents are real controls.
 * That matters more than it sounds: a laptop drawn as a picture is a picture,
 * and this one has to work with a finger on a phone, where the whole thing is
 * 320px wide.
 */
export function Laptop({
	children,
	wallpaper,
	title,
	toolbar,
	dock,
}: LaptopProps): ReactNode {
	return (
		<div className="laptop">
			<div className="laptop-lid">
				<div className="laptop-screen">
					{wallpaper ? (
						<div className="laptop-wallpaper" aria-hidden="true">
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
						<div className="laptop-strip">
							{title ? <span className="laptop-title">{title}</span> : null}
							{toolbar ? (
								<span className="flex items-center gap-2 min-w-0">
									{toolbar}
								</span>
							) : null}
						</div>
					) : null}

					{/*
					 * `data-lenis-prevent` gives scrolling inside the screen back to
					 * the browser. A smooth-scroll driver intercepts wheel and touch
					 * for the whole document and animates the page itself, so a
					 * container with its own overflow is invisible to it and a drag
					 * inside this desktop scrolls the article behind the laptop.
					 * Inert for anyone not running one.
					 *
					 * It does not trap: the desktop's overscroll chains, so reaching
					 * the bottom of it carries on down the page. Somebody scrolling
					 * past should never have to find a margin beside the laptop to
					 * get out of it.
					 */}
					<div className="laptop-desktop" data-lenis-prevent>
						{children}
					</div>

					{/* Pinned, so it stays put while the desktop scrolls under it. */}
					{dock}
				</div>

				{/* The back of the lid, visible while it is still closing. */}
				<div className="laptop-back" aria-hidden="true" />
			</div>

			<div className="laptop-base" aria-hidden="true">
				<div className="laptop-deck" />
				<div className="laptop-pad" />
			</div>

			<div className="laptop-shadow" aria-hidden="true" />
		</div>
	);
}
