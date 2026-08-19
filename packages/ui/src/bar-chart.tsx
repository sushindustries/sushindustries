import { barX, barY, defineChart } from "@tanstack/charts";
import { Chart } from "@tanstack/react-charts";
import { scaleBand, scaleLinear } from "d3-scale";
import { type ReactNode, useMemo } from "react";

/*
 * A bar chart of one measure across a handful of categories.
 *
 * TanStack Charts is a grammar - marks, channels, scales - and that is the
 * right shape for a charting library and the wrong shape for a call site that
 * wants "these rows, by this field". So this is the narrow door: two
 * accessors, a direction, a height. Anything that needs a second series, a
 * stack or a time axis has outgrown this and should use `defineChart`
 * directly, which is why the library is a dependency rather than something
 * hidden behind a wrapper.
 *
 * The scales come from d3, which is what the library expects: `defineChart`
 * requires an axis per channel a mark declares, and an axis is a d3 scale
 * factory it infers a domain for. `d3-scale` is already a dependency of
 * `@tanstack/charts`, so naming it here costs a line in `package.json` and no
 * extra bytes - and the alternative, guessing at a scale-less spec, does not
 * type-check because the requirement is not optional.
 *
 * Colour comes from the stylesheet, not from a palette here. `--chart-fill` is
 * read off the rendered element, so a chart flips with the theme like
 * everything else and there is no colour written down twice - the one thing a
 * charting library will always get wrong for you, because it cannot know about
 * `data-theme`.
 *
 * Horizontal by default, and that is the useful default rather than the
 * conventional one: these categories are words - `component`, `reference_pages`
 * - and words on a vertical axis are read straight across, where the same
 * words under a vertical bar chart are rotated forty-five degrees or
 * truncated.
 */

export interface BarChartDatum {
	/** The category. Drawn as the axis label, so keep it short. */
	readonly label: string;

	/** The measure. */
	readonly value: number;
}

/**
 * The fills a bar can take, in order.
 *
 * Six, from the site's own category tones, so a chart is visibly the same
 * palette as the nav and the badges rather than a second colour scheme that
 * happens to live on the same page. They are custom properties rather than
 * hex, which is what makes them flip with the theme - a chart is the surface
 * where a hard-coded colour is most obvious, because a whole bar goes the
 * wrong way rather than a one-pixel border.
 *
 * Assigned by position, not by name: a chart cannot know what its categories
 * mean, and a lookup from category to colour would be a mapping every caller
 * had to supply. Position gives distinct neighbours, which is the whole job.
 */
const FILLS = [
	"var(--tone-content-ink)",
	"var(--tone-motion-ink)",
	"var(--tone-layout-ink)",
	"var(--tone-docs-ink)",
	"var(--tone-3d-ink)",
	"var(--accent-dim)",
] as const;

export interface BarChartProps {
	readonly rows: readonly BarChartDatum[];

	/** Announced to screen readers, and never drawn. Required, like a caption. */
	readonly label: string;

	/**
	 * One sentence for anyone who cannot see it, saying what the shape shows.
	 *
	 * A chart's alt text is the finding, not the data - "source files are two
	 * thirds of the index" rather than "a bar chart with nine bars". The table
	 * beside it is where the numbers are.
	 */
	readonly description?: string;

	/** `bar` runs left to right, `column` bottom to top. */
	readonly direction?: "bar" | "column";

	/**
	 * One colour per category, cycled from the site's tones.
	 *
	 * Off by default, and that default is the honest one: colour on a single
	 * series carries no information - the axis already says which bar is which,
	 * so colouring them differently is decoration that looks like meaning.
	 *
	 * Turn it on when the categories are the subject rather than the scale, so
	 * a reader is comparing *kinds* rather than reading a ranking. That is the
	 * case for "tokens per kind" and not for "the ten most viewed pages".
	 */
	readonly colorByCategory?: boolean;

	readonly height?: number;
}

/*
 * There is no `format` prop, and there was one for about an hour.
 *
 * It existed to reformat axis ticks, then the axes moved to the library's own
 * scales - which draw their own ticks - and it became a prop that took a
 * function and ignored it. A prop that does nothing is worse than a missing
 * one: a caller passes it, reads the chart, and concludes the formatter is
 * broken rather than absent.
 *
 * If ticks ever need reformatting, it belongs in `ChartAxisOptions` alongside
 * the scale, not as a parallel option here.
 */

export function BarChart({
	rows,
	label,
	description,
	direction = "bar",
	colorByCategory = false,
	height = 220,
}: BarChartProps): ReactNode {
	if (rows.length === 0) {
		return <p className="chart-empty">Nothing to draw yet.</p>;
	}

	/*
	 * One component per orientation, rather than one that branches.
	 *
	 * A ternary over two `defineChart` calls type-errors, and correctly: `barX`
	 * puts numbers on x and labels on y, `barY` does the reverse, so the union
	 * of the two definitions has `__xValue` as `string | number` and matches
	 * neither. Splitting them keeps each definition's axis types exact, which
	 * is the whole reason those phantom fields exist.
	 */
	const shared = { label, description, height, colorByCategory };

	return (
		<div className="chart">
			{direction === "column" ? (
				<Columns rows={rows} {...shared} />
			) : (
				<Bars rows={rows} {...shared} />
			)}
		</div>
	);
}

/**
 * A fill accessor that gives each category its own colour, stably.
 *
 * Keyed on the label's position in the data rather than on the row's index in
 * the callback, so re-sorting the rows keeps `component` the same colour it
 * was - a chart whose colours shuffle when you change the sort is a chart that
 * has taught you nothing.
 */
function fillFor(rows: readonly BarChartDatum[]) {
	const order = new Map(rows.map((row, at) => [row.label, at]));
	return (row: BarChartDatum) =>
		FILLS[(order.get(row.label) ?? 0) % FILLS.length] as string;
}

interface OrientedProps {
	readonly rows: readonly BarChartDatum[];
	readonly label: string;
	readonly description?: string;
	readonly height: number;
	readonly colorByCategory: boolean;
}

/*
 * The definitions are memoised on the data.
 *
 * `defineChart` walks every mark and resolves every channel, which is real
 * work to redo on a render that only changed a hover state - and a chart that
 * rebuilds its scales while you are pointing at it visibly twitches.
 */
function Bars({
	rows,
	label,
	description,
	height,
	colorByCategory,
}: OrientedProps) {
	const definition = useMemo(
		() =>
			defineChart({
				marks: [
					barX([...rows], {
						x: (row: BarChartDatum) => row.value,
						y: (row: BarChartDatum) => row.label,
						fill: colorByCategory ? fillFor(rows) : "var(--chart-fill)",
						radius: 3,
					}),
				],
				// Linear for the measure, band for the categories. `nice` rounds the
				// measure's domain out to a readable tick rather than stopping at
				// whatever the largest value happened to be.
				x: { scale: scaleLinear, nice: true },
				y: { scale: scaleBand },
			}),
		[rows, colorByCategory],
	);

	return (
		<Chart
			definition={definition}
			ariaLabel={label}
			ariaDescription={description}
			height={height}
		/>
	);
}

function Columns({
	rows,
	label,
	description,
	height,
	colorByCategory,
}: OrientedProps) {
	const definition = useMemo(
		() =>
			defineChart({
				marks: [
					barY([...rows], {
						x: (row: BarChartDatum) => row.label,
						y: (row: BarChartDatum) => row.value,
						fill: colorByCategory ? fillFor(rows) : "var(--chart-fill)",
						radius: 3,
					}),
				],
				x: { scale: scaleBand },
				y: { scale: scaleLinear, nice: true },
			}),
		[rows, colorByCategory],
	);

	return (
		<Chart
			definition={definition}
			ariaLabel={label}
			ariaDescription={description}
			height={height}
		/>
	);
}
