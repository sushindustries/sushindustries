import type { ReactNode } from "react";
import { Icon, type IconName } from "./icon.tsx";

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
	/**
	 * A glyph before the words.
	 *
	 * An eyebrow is four or five uppercase characters at the smallest size on
	 * the page, which is the hardest thing on it to scan. A glyph gives the
	 * section a shape that is recognisable before the word is read, and on a
	 * page of several sections that is the difference between a list of
	 * headings and a set of places.
	 *
	 * Optional, because an eyebrow with nothing meaningful to draw is better
	 * with no glyph than with a decorative one.
	 */
	icon?: IconName;
}

/** The eyebrow: mono, small caps, quiet. One per section, above the title. */
export function Label({ children, icon }: LabelProps): ReactNode {
	return (
		<p className="label m-0">
			{/*
			 * `aria-hidden`: the glyph repeats the word beside it, and a screen
			 * reader announcing both reads the section name twice.
			 */}
			{icon ? <Icon name={icon} size={12} aria-hidden="true" /> : null}
			{children}
		</p>
	);
}

export interface LeadProps {
	children: ReactNode;
}

/** The paragraph under a title: dimmed, measured, never full-width. */
export function Lead({ children }: LeadProps): ReactNode {
	return <p className="mt-3 fg-dim max-w-prose text-pretty">{children}</p>;
}

export interface TextProps {
	children: ReactNode;
	/** Body sizes from the scale. */
	size?: "xs" | "sm" | "md" | "lg";
	/** How loud: default ink, dimmed, or faint. */
	tone?: "default" | "dim" | "faint";
	/** Render as a span for inline use. */
	inline?: boolean;
}

/** Body copy on the scale. The variant that exists so ad-hoc font-size does not. */
export function Text({
	children,
	size = "md",
	tone = "default",
	inline,
}: TextProps): ReactNode {
	const toneClass =
		tone === "dim" ? " fg-dim" : tone === "faint" ? " fg-faint" : "";
	const className = `m-0 text-${size}${toneClass}`;

	if (inline) return <span className={className}>{children}</span>;
	return <p className={className}>{children}</p>;
}
