import type { ReactNode } from "react";
import { Reveal } from "./reveal";

export interface SectionProps {
	/** Anchor target, so a nav can link straight to it. */
	id?: string;
	/** The small monospace kicker above the heading. */
	label?: string;
	title: string;
	children: ReactNode;
}

/*
 * A page section: kicker, heading, body — with the heading and the body
 * revealing separately so the section resolves top-down rather than arriving
 * as one block.
 *
 * The 80ms offset is the whole trick. It is too short to read as a sequence
 * and just long enough to stop the two halves landing on the same frame.
 */
export function Section({
	id,
	label,
	title,
	children,
}: SectionProps): ReactNode {
	return (
		<section id={id} className="section">
			<div className="container">
				<Reveal>
					{label ? <p className="label m-0">{label}</p> : null}
					<h2 className="h2 mt-3 text-balance">{title}</h2>
				</Reveal>

				<div className="mt-6">
					<Reveal delay={80}>{children}</Reveal>
				</div>
			</div>
		</section>
	);
}
