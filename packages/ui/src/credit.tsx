import type { ReactNode } from "react";

export interface CreditProps {
	/** The project's own name, spelled the way its authors spell it. */
	name: string;
	/** Who made it. Shown so authorship is never ambiguous. */
	by: string;
	href: string;
	/** What it does *here*. One line, present tense. */
	role: string;
}

/*
 * A dependency, credited.
 *
 * This exists because a portfolio that lists what it is built with, in the
 * same visual language as what it built, quietly takes credit for both. The
 * author line is not decoration — it is the part that makes the distinction
 * legible, so it is required rather than optional.
 */
export function Credit({ name, by, href, role }: CreditProps): ReactNode {
	return (
		<a
			className="credit"
			href={href}
			target="_blank"
			rel="noopener noreferrer"
			title={`${name} — ${by}`}
		>
			<span className="flex items-center justify-between gap-3">
				<span className="font-semibold">{name}</span>
				<span className="label shrink-0">{by}</span>
			</span>
			<span className="fg-faint text-sm">{role}</span>
		</a>
	);
}
