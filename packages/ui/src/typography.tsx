import type { ReactNode } from "react";

/*
 * The type scale, as components rather than as memory.
 *
 * The scale itself lives in atoms - `--t-h1` through `--t-xs`, the `.h*`,
 * `.label` and `.prose` classes. What kept going wrong was not the scale but
 * the reaching for it: every page re-decided which class a heading takes and
 * whether the eyebrow above it is a `.label`, and two pages decided
 * differently. These components are that decision made once, so a page
 * composed from them cannot disagree with the next one about what a title is.
 *
 * The heading level and the visual size are separate on purpose: `as` is the
 * document outline, `size` is the look. Outlines are for readers of
 * structure - screen readers, the doc aside - and they break the moment a
 * page picks its `h3` because it wanted the smaller font.
 */

type HeadingTag = "h1" | "h2" | "h3" | "h4";

export interface HeadingProps {
	/** Position in the document outline. */
	as?: HeadingTag;
	/** Visual size, defaulting to the tag's own. */
	size?: "h1" | "h2" | "h3";
	children: ReactNode;
}

export function Heading({
	as = "h2",
	size,
	children,
}: HeadingProps): ReactNode {
	const Tag = as;
	return <Tag className={`${size ?? as} m-0 text-balance`}>{children}</Tag>;
}

export interface LabelProps {
	children: ReactNode;
}

/** The eyebrow: mono, small caps, quiet. One per section, above the title. */
export function Label({ children }: LabelProps): ReactNode {
	return <p className="label m-0">{children}</p>;
}

export interface LeadProps {
	children: ReactNode;
}

/** The paragraph under a title: dimmed, measured, never full-width. */
export function Lead({ children }: LeadProps): ReactNode {
	return <p className="mt-3 fg-dim max-w-prose text-pretty">{children}</p>;
}
