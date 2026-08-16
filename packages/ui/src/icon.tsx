import type { ReactNode } from "react";

/*
 * Generated from `packages/ui/glyphs.md`. Do not edit by hand.
 *
 * The set lives in Markdown because that is where each drawing can carry the
 * reason for it, and it is generated into a component because a library cannot
 * read a Markdown file at runtime without stopping being installable.
 *
 * Add a glyph with `pnpm new glyph <name>`, then `pnpm doctor --fix`.
 */

export type IconName =
	| "cube"
	| "package"
	| "note"
	| "layers"
	| "motion"
	| "grid"
	| "text"
	| "book"
	| "rule"
	| "chevron";

export interface IconProps {
	name: IconName;
	/** Matches the surrounding text size by default. */
	size?: number;
	className?: string;
}

const PATHS: Record<IconName, ReactNode> = {
	// An isometric cube. The 3D viewer.
	cube: (
		<>
			<path d="M12 2.5 21 7v10l-9 4.5L3 17V7z" />
			<path d="M3 7l9 4.5L21 7" />
			<path d="M12 11.5v10" />
		</>
	),
	// A taped box seen from above.
	package: (
		<>
			<path d="M3 7.5 12 3l9 4.5v9L12 21l-9-4.5z" />
			<path d="M7.5 5.25 16.5 9.75V18" />
		</>
	),
	// A page with a folded corner and two lines of writing.
	note: (
		<>
			<path d="M5 3h9l5 5v13H5z" />
			<path d="M14 3v5h5" />
			<path d="M9 13h6M9 17h4" />
		</>
	),
	// Two stacked plates. Components, which are things on things.
	layers: (
		<>
			<path d="M12 3 3 8l9 5 9-5z" />
			<path d="M3 13.5 12 18.5l9-5" />
		</>
	),
	// An arc with a leading dot: something travelling, not something spinning.
	motion: (
		<>
			<path d="M3 17c4-9 14-9 18 0" />
			<path d="M20 14.5a2 2 0 1 1-4 0 2 2 0 0 1 4 0" />
		</>
	),
	// Four cells. Layout, and what the Grid component does.
	grid: (
		<>
			<path d="M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z" />
		</>
	),
	// Ragged lines. Prose, which is what content means here.
	text: (
		<>
			<path d="M4 6h16M4 11h12M4 16h14M4 21h8" />
		</>
	),
	// An open book. Docs.
	book: (
		<>
			<path d="M4 4h6a3 3 0 0 1 3 3v13a2.5 2.5 0 0 0-2.5-2.5H4z" />
			<path d="M20 4h-6a3 3 0 0 0-3 3v13a2.5 2.5 0 0 1 2.5-2.5H20z" />
		</>
	),
	// A gap held open between two rules. The Spacer, drawn as the thing it inserts.
	rule: (
		<>
			<path d="M4 6h16M4 18h16" />
			<path d="M12 10v4" />
		</>
	),
	// Down. Rotated by CSS wherever it needs to point elsewhere.
	chevron: (
		<>
			<path d="M6 9.5 12 15l6-5.5" />
		</>
	),
};

export function Icon({ name, size = 16, className }: IconProps): ReactNode {
	return (
		<svg
			className={className}
			width={size}
			height={size}
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="1.5"
			strokeLinecap="round"
			strokeLinejoin="round"
			// Decorative: every icon here sits beside its own text label.
			aria-hidden="true"
			focusable="false"
		>
			{PATHS[name]}
		</svg>
	);
}
