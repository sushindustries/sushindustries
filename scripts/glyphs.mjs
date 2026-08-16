/*
 * `packages/ui/glyphs.md` in, `packages/ui/src/icon.tsx` out.
 *
 * The icon set is a table in Markdown because that is where it is readable and
 * where the reason for each drawing can sit beside it. It is a generated
 * component because a library cannot read a Markdown file at runtime without
 * stopping being installable.
 *
 * The doctor regenerates and compares, so editing `icon.tsx` by hand is a
 * change that gets reverted rather than a change that sticks.
 *
 * Paths only, no other SVG element. A circle is written as a path like
 * anything else. That constraint is why this file is short.
 */

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

export const GLYPH_SOURCE = "packages/ui/glyphs.md";
export const GLYPH_OUTPUT = "packages/ui/src/icon.tsx";

/** Every row of the glyph table, in file order. */
export function readGlyphs() {
	const body = readFileSync(join(root, GLYPH_SOURCE), "utf8");
	const glyphs = [];

	for (const line of body.split("\n")) {
		if (!line.startsWith("|")) continue;

		const cells = line
			.split("|")
			.slice(1, -1)
			.map((cell) => cell.trim());

		if (cells.length < 3) continue;

		const [name, paths, why] = cells;

		// The header row and its `| --- |` underline.
		if (name === "Name" || /^-+$/.test(name)) continue;

		glyphs.push({
			name,
			paths: [...paths.matchAll(/`([^`]*)`/g)]
				.map(([, d]) => d)
				.filter(Boolean),
			why,
		});
	}

	return glyphs;
}

export function renderIconComponent(glyphs) {
	const union = glyphs.map((glyph) => `\t| "${glyph.name}"`).join("\n");

	const entries = glyphs
		.map((glyph) => {
			const paths = glyph.paths
				.map((d) => `\t\t\t<path d="${d}" />`)
				.join("\n");

			// Quoted only when it has to be, so the output survives the formatter.
			const key = /^[A-Za-z_$][\w$]*$/.test(glyph.name)
				? glyph.name
				: `"${glyph.name}"`;

			return `\t// ${glyph.why}\n\t${key}: (\n\t\t<>\n${paths}\n\t\t</>\n\t),`;
		})
		.join("\n");

	return `import type { ReactNode } from "react";

/*
 * Generated from \`${GLYPH_SOURCE}\`. Do not edit by hand.
 *
 * The set lives in Markdown because that is where each drawing can carry the
 * reason for it, and it is generated into a component because a library cannot
 * read a Markdown file at runtime without stopping being installable.
 *
 * Add a glyph with \`pnpm new glyph <name>\`, then \`pnpm doctor --fix\`.
 */

export type IconName =
${union};

export interface IconProps {
	name: IconName;
	/** Matches the surrounding text size by default. */
	size?: number;
	className?: string;
}

const PATHS: Record<IconName, ReactNode> = {
${entries}
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
`;
}
