import type { ReactNode } from "react";

export type IconName = "cube" | "package" | "note" | "layers";

export interface IconProps {
	name: IconName;
	/** Matches the surrounding text size by default. */
	size?: number;
	className?: string;
}

/*
 * A tiny line-icon set, drawn rather than installed.
 *
 * Four glyphs at one stroke weight is a few hundred bytes; an icon package is
 * a dependency, a build step and a tree-shaking question. `currentColor` means
 * they inherit whatever the label beside them is doing, including its hover
 * and focus states, which is the part a sprite sheet gets wrong.
 */
const PATHS: Record<IconName, ReactNode> = {
	// An isometric cube - the 3D viewer.
	cube: (
		<>
			<path d="M12 2.5 21 7v10l-9 4.5L3 17V7z" />
			<path d="M3 7l9 4.5L21 7" />
			<path d="M12 11.5v10" />
		</>
	),
	package: (
		<>
			<path d="M3 7.5 12 3l9 4.5v9L12 21l-9-4.5z" />
			<path d="M7.5 5.25 16.5 9.75V18" />
		</>
	),
	note: (
		<>
			<path d="M5 3h9l5 5v13H5z" />
			<path d="M14 3v5h5" />
			<path d="M9 13h6M9 17h4" />
		</>
	),
	layers: (
		<>
			<path d="M12 3 3 8l9 5 9-5z" />
			<path d="M3 13.5 12 18.5l9-5" />
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
