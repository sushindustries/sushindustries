import type { CSSProperties, ReactNode } from "react";

/*
 * A word that types itself, one character at a time, in the syntax palette.
 *
 * There is no JavaScript in this at all, and that is the point. The obvious
 * build is a `useState` counter and a `setInterval`, which costs a re-render
 * per character, cannot render on the server, and shows the whole string for
 * one frame before the effect runs. This renders the final markup once and
 * lets CSS decide when each character becomes visible, so the server and the
 * client agree, the animation survives JavaScript being off, and the cost is
 * the same whether the word is five characters or fifty.
 *
 * The colour cycles through `--syn-*`, the CLI's own palette. Those are the
 * only hues checked against the terminal slab rather than against paper: all
 * nine clear 4.5:1 on `--code-bg`, where the page's accent manages 2.71:1.
 */
export interface TypedMarkProps {
	/** The word. Rendered per character, so keep it short. */
	readonly text: string;
	/**
	 * Where in the colour cycle to begin.
	 *
	 * Two marks on one page starting at the same hue read as a repeat rather
	 * than as a set, and this is what makes them differ without a second
	 * palette.
	 */
	readonly offset?: number;
	readonly className?: string;
	/**
	 * What a screen reader announces.
	 *
	 * Every character is its own element here, and left alone a screen reader
	 * would spell the word out. The characters are hidden and this is read
	 * instead, so the mark is a word to everybody.
	 */
	readonly label?: string;
}

export function TypedMark({
	text,
	offset = 0,
	className,
	label,
}: TypedMarkProps): ReactNode {
	return (
		<span className={className ? `typed ${className}` : "typed"}>
			<span className="sr-only">{label ?? text}</span>
			{[...text].map((character, index) => (
				<span
					// biome-ignore lint/suspicious/noArrayIndexKey: position IS the identity here - the list never reorders, and the index is also the animation's place in the cycle
					key={index}
					className="typed-char"
					style={{ "--i": index + offset } as CSSProperties}
					aria-hidden="true"
				>
					{/* A space would collapse; the mark keeps its gaps. */}
					{character === " " ? " " : character}
				</span>
			))}
		</span>
	);
}
