import type { ButtonHTMLAttributes, ReactElement } from "react";
import { useEffect, useState } from "react";
import type { GLTF } from "three-stdlib";

/**
 * Option buttons that show the material, not a guess at it.
 *
 * The swatch is rendered from the same GLB the viewer displays, so it cannot
 * disagree with what the customer gets - which a hand-exported PNG eventually
 * does, and a flat CSS colour does immediately: `KHR_materials_variants` exists
 * precisely because velvet and satin in one hue are different materials rather
 * than different colours.
 */

/**
 * Renders a swatch per variant, once per asset.
 *
 * Rendering is deferred to an effect rather than done during render because it
 * costs a WebGL context and a frame per variant. Returns an empty map on the
 * first pass; treat a missing entry as "no picture yet" and fall back to the
 * label, which is what {@link VariantButton} does.
 *
 * ```tsx
 * const swatches = useVariantSwatches(gltf, listVariants(gltf))
 * ```
 */
export function useVariantSwatches(
	gltf: GLTF | undefined,
	names: readonly string[],
	options: { size?: number; pixelRatio?: number } = {},
): Map<string, string> {
	const [swatches, setSwatches] = useState<Map<string, string>>(new Map());

	// Joined rather than passed as an array: a new array literal on every render
	// would restart the render loop forever, and a caller writing
	// `listVariants(gltf)` inline is the expected case, not the careless one.
	const key = names.join("");
	const { size, pixelRatio } = options;

	useEffect(() => {
		if (!gltf || key === "") return;
		let cancelled = false;

		void (async () => {
			const { renderVariantSwatches } = await import(
				"@sushindustries/product-viewer/swatch"
			);
			if (cancelled) return;
			const rendered = await renderVariantSwatches(gltf, key.split(""), {
				...(size === undefined ? {} : { size }),
				...(pixelRatio === undefined ? {} : { pixelRatio }),
			});
			if (!cancelled) setSwatches(rendered);
		})();

		return () => {
			cancelled = true;
		};
	}, [gltf, key, size, pixelRatio]);

	return swatches;
}

export interface VariantButtonProps
	extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> {
	/** The variant name, used as the accessible label. */
	variant: string;
	/** Shown instead of the raw variant name. */
	label?: string;
	/** Data URL from {@link useVariantSwatches}. */
	swatch?: string;
	selected?: boolean;
	/**
	 * The asset does not carry this variant.
	 *
	 * Rendered as a visible state rather than hidden, because the failure this
	 * guards against is a control that looks like it works and does nothing.
	 */
	missing?: boolean;
	/** Added after `pv-variant`. */
	className?: string;
	/**
	 * Reserve the swatch's space while it renders.
	 *
	 * Swatches arrive an effect late, so without this a row of buttons shifts
	 * sideways the moment the pictures land.
	 */
	showPendingSwatch?: boolean;
}

export function VariantButton({
	variant,
	label,
	swatch,
	selected = false,
	missing = false,
	className,
	showPendingSwatch = false,
	...rest
}: VariantButtonProps): ReactElement {
	return (
		<button
			type="button"
			aria-pressed={selected}
			// State as data attributes, not as class names. You can style
			// `[data-selected]` from your own stylesheet without importing ours, and
			// without us deciding what a selected button is called.
			data-selected={selected || undefined}
			data-missing={missing || undefined}
			title={missing ? `${variant} is not in this model` : variant}
			className={["pv-variant", className].filter(Boolean).join(" ")}
			{...rest}
		>
			{swatch ? (
				<img
					className="pv-variant__swatch"
					src={swatch}
					alt=""
					width={24}
					height={24}
				/>
			) : showPendingSwatch ? (
				<span
					className="pv-variant__swatch pv-variant__swatch--pending"
					aria-hidden="true"
				/>
			) : null}
			<span className="pv-variant__label">{label ?? variant}</span>
			{missing ? <span aria-hidden="true">⚠</span> : null}
		</button>
	);
}
