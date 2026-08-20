import { type ReactNode, useEffect, useId, useState } from "react";
import type { DocHeading } from "./headings.ts";

export interface DocAsideProps {
	/** The list to render. Collect it in a route loader, not in the component. */
	headings: readonly DocHeading[];
	/** Heading on desktop, button text on mobile. */
	label?: string;
	/** Renders nothing below this count. One heading is not a contents list. */
	minHeadings?: number;
	/**
	 * Rendered under the contents list: feedback buttons, a copy action,
	 * whatever the page wants within reach of a reader who is already here.
	 */
	footer?: ReactNode;
}

/*
 * The on-page table of contents, at three sizes.
 *
 *   desktop  a sticky rail beside the prose
 *   tablet   the same rail, narrower
 *   mobile   a collapsed row that opens on tap
 *
 * The collapse is a checkbox and a label, not React state. That is the whole
 * design: a contents list is the first thing a reader reaches for on a phone,
 * and one built from state does not work until hydration - on a long document
 * that is exactly when it is least likely to have happened yet. The same
 * markup is a static list on desktop, because CSS hides the control instead of
 * the component rendering something different.
 *
 * The only JavaScript here is the active-heading highlight, and it degrades to
 * "nothing highlighted", which costs the reader nothing.
 */
export function DocAside({
	headings,
	label = "On this page",
	minHeadings = 2,
	footer,
}: DocAsideProps): ReactNode {
	const active = useActiveHeading(headings);
	const toggleId = useId();

	if (headings.length < minHeadings) return null;

	return (
		<aside className="doc-aside" data-lenis-prevent>
			{/*
			 * Checkbox before the label so `:checked ~` can reach the list. It is
			 * focusable and announced; only its default appearance is hidden.
			 */}
			<input
				id={toggleId}
				type="checkbox"
				className="doc-aside-toggle sr-only"
			/>

			<label className="doc-aside-summary" htmlFor={toggleId}>
				<span className="label m-0">{label}</span>
				<span className="doc-aside-chevron" aria-hidden="true">
					›
				</span>
			</label>

			<nav aria-label={label}>
				<ul className="doc-aside-list">
					{headings.map((heading) => (
						<li key={heading.id}>
							<a
								href={`#${heading.id}`}
								className="doc-aside-link"
								data-active={heading.id === active}
								aria-current={heading.id === active ? "location" : undefined}
							>
								{heading.text}
							</a>
						</li>
					))}
				</ul>
			</nav>

			{footer ? <div className="doc-aside-footer">{footer}</div> : null}
		</aside>
	);
}

/*
 * Which heading the reader is currently under.
 *
 * Computed from scroll position rather than an IntersectionObserver, for one
 * specific reason: the last heading. An observer with a top-band root margin
 * never fires for it, because a short final section means the page runs out of
 * scroll before that heading ever reaches the band - so the last item in the
 * list could never highlight, no matter how far you scrolled.
 *
 * Reading positions directly makes that case expressible: at the bottom of the
 * document the last heading is what you are looking at, whether or not it
 * crossed the line. Everything above it is "the last heading that has passed
 * the top quarter of the viewport", which is the same rule the observer was
 * approximating.
 *
 * `getBoundingClientRect` per heading on scroll is a layout read, so the whole
 * thing is rAF-throttled and only ever touches the handful of h2s in the list.
 */
function useActiveHeading(headings: readonly DocHeading[]): string | undefined {
	const [active, setActive] = useState<string>();

	useEffect(() => {
		if (headings.length === 0) return;

		let frame = 0;

		function compute(): void {
			frame = 0;

			const threshold = window.innerHeight * 0.25;
			let current = headings[0]?.id;

			for (const heading of headings) {
				const element = document.getElementById(heading.id);
				if (!element) continue;

				if (element.getBoundingClientRect().top <= threshold) {
					current = heading.id;
				}
			}

			/*
			 * Within a couple of pixels of the end. The tolerance matters: zoom
			 * levels and sub-pixel layout mean the equality almost never lands
			 * exactly, and without it the last heading stays unreachable.
			 */
			const scrolledToEnd =
				window.innerHeight + window.scrollY >=
				document.documentElement.scrollHeight - 4;

			if (scrolledToEnd) current = headings[headings.length - 1]?.id;

			setActive(current);
		}

		function onScroll(): void {
			if (frame) return;
			frame = requestAnimationFrame(compute);
		}

		compute();
		window.addEventListener("scroll", onScroll, { passive: true });
		window.addEventListener("resize", onScroll, { passive: true });

		return () => {
			if (frame) cancelAnimationFrame(frame);
			window.removeEventListener("scroll", onScroll);
			window.removeEventListener("resize", onScroll);
		};
	}, [headings]);

	return active;
}
