import type { ReactNode } from "react";

/** Steps on the spacing scale. Not pixels: there is no arbitrary value here. */
export type Space = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export interface GridProps {
	children?: ReactNode;
	/**
	 * Narrowest a column may get before the grid drops one.
	 *
	 * The whole layout, in one number. `auto-fit` plus `minmax` works out the
	 * column count from the space available, so there is no breakpoint to write
	 * and no count to keep in step with a media query.
	 */
	min?: string;
	/** A step on the scale, rendered as `data-gap`. Between rows as well as columns. */
	gap?: Space;
	/** Fixed column count, for the cases where content really is paired. */
	columns?: 2 | 3 | 4;
	className?: string;
}

/*
 * A responsive grid with no breakpoints in it.
 *
 * `repeat(auto-fit, minmax(<min>, 1fr))` is the entire mechanism. Columns fit
 * as many as will fit at `min` wide and share the remainder, so the same grid
 * is four across on a desktop and one across at 320 without anybody writing
 * either number down.
 *
 * The reason to prefer that over a media query is not brevity. A media query
 * asks about the viewport, and a grid three levels inside a sidebar does not
 * care about the viewport - it cares about the width it was given. This asks
 * the right question.
 *
 * `columns` overrides it when the content is genuinely paired: a before and an
 * after that reflow to one column stop being a comparison.
 */
export function Grid({
	children,
	min = "16rem",
	gap = 4,
	columns,
	className,
}: GridProps): ReactNode {
	return (
		<div
			className={className ? `grid-auto ${className}` : "grid-auto"}
			data-gap={gap}
			data-columns={columns}
			style={{ "--grid-min": min } as React.CSSProperties}
		>
			{children}
		</div>
	);
}
