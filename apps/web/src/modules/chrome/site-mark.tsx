/*
 * From the element's own entry, not from the package root.
 *
 * `ModelMark` lazily imports the viewer from inside itself, so naming it costs
 * no three until a mark actually becomes live. The package root imports the
 * viewer statically, so importing from there would put ~600 kB back in the
 * graph of every page that mentions a mark - and tsdown says so out loud rather
 * than quietly undoing it.
 */
import { ModelMark } from "@sushindustries/react-product-viewer/model-mark";
import { Icon } from "@sushindustries/ui";
import type { CSSProperties, ReactNode } from "react";
import { LOGO_MODEL } from "./logo";

/*
 * This site's mark: the logo GLB, with this site's glyph underneath it.
 *
 * Everything about *how* a model behaves at icon size is `ModelMark` in the
 * viewer package - the camera fit, the controls that would eat a button's
 * click, the shadow that costs a render target for four pixels of grey, the
 * reduced-motion path that mounts no canvas at all.
 *
 * What is left here is the two things that are genuinely about this site: which
 * model, and which glyph goes under it. That is the same split as `SiteShelf`
 * and `SiteAssistant`, and it is why the interesting file is in a package
 * somebody can install.
 */

export interface SiteMarkProps {
	/** Seconds per cycle. Higher is slower. */
	seconds?: number;
	/**
	 * How it moves. `sway` by default, and that is a fact about this logo
	 * rather than a preference: the mark has a front, and a full spin spends
	 * half of every revolution showing it edge-on and unreadable.
	 */
	motion?: "spin" | "sway" | "tumble" | "still";
	/** Pixels. Sets the element's size through the package's own token. */
	size?: number;
}

export function SiteMark({
	seconds,
	size,
	motion = "sway",
}: SiteMarkProps): ReactNode {
	return (
		<ModelMark
			model={LOGO_MODEL}
			seconds={seconds}
			motion={motion}
			label="Sushindustries"
			/*
			 * The flat mark, drawn underneath and never removed.
			 *
			 * Sized a little smaller than the box so the model has room to turn
			 * past it. It is not a placeholder that gets swapped out - WebGL can
			 * fail for reasons this page does not control, and the worst case
			 * should be an icon that does not spin rather than an empty square.
			 */
			glyph={<Icon name="sushi" size={size ? size * 0.62 : 30} />}
			className="site-mark"
			/*
			 * `--pv-mark-glyph` is the viewer package's hook for the flat glyph's
			 * colour, and `--mark-glyph` is this site's answer to it. The mark is a
			 * logo, so it has one colour and does not take a hover tint from the
			 * tile around it.
			 */
			style={
				{
					"--pv-mark-glyph": "var(--mark-glyph)",
					...(size ? { "--pv-mark-size": `${size}px` } : {}),
				} as CSSProperties
			}
		/>
	);
}
