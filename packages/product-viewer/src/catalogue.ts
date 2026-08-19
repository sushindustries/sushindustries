import type { ModelConfig, Tint } from "./types";

/**
 * The data layer: what a model *is*, separately from how it is drawn.
 *
 * Before this, adding a product meant editing JSX - a `<ModelCard>` with eight
 * props, a `<ModelViewer variants={[...]}>` somewhere else, and a third copy of
 * the same URL in a route loader. Three places to change and no way to tell,
 * short of clicking every page, whether you got all three. Removing one was
 * worse: the leftovers are invisible until something renders a blank canvas.
 *
 * So a model is declared once, as data, and every element takes the whole
 * entry. Adding a product is one object; removing it is deleting that object;
 * checking the set is `verifyCatalogue`, which is a function rather than a
 * click-through.
 *
 * Deliberately not a class, a registry singleton or a provider. It is a plain
 * object you can write in TypeScript, generate from YAML, or fetch from a CMS
 * - the type is the contract, and nothing here cares which of those produced
 * it.
 */

/**
 * One finish, mapping a name a customer reads to a name the GLB carries.
 *
 * These are two different things and conflating them is the commonest bug in a
 * configurator. The asset says `Mango Velvet` because that is what the artist
 * typed in Blender at four in the afternoon; the shop wants to say `Mango`, in
 * Polish, with a price. Keeping `variant` and `label` apart means renaming the
 * customer-facing string never risks breaking the material swap.
 */
export interface FinishDefinition {
	/**
	 * The `KHR_materials_variants` name inside the GLB. Must match exactly.
	 *
	 * `verifyCatalogue` checks this against the real asset, because a mismatch
	 * here fails silently: `applyVariant` cannot tell "no such variant" from
	 * "nothing to change", so the control looks like it works and does nothing.
	 */
	variant: string;

	/** What the customer reads. Defaults to `variant` when omitted. */
	label?: string;

	/**
	 * A colour for the swatch, when rendering one from the asset is overkill.
	 *
	 * Leave it unset to get a real rendered material swatch, which is almost
	 * always better: velvet and satin in one hue are different materials rather
	 * than different colours, and a flat CSS chip cannot say so.
	 */
	swatch?: string;

	/** Anything the shop needs: a price delta, a stock flag, a supplier code. */
	meta?: Record<string, unknown>;
}

/** A named geometric zone and the tint applied to it, for single-mesh models. */
export interface ZoneDefinition {
	zone: string;
	label?: string;
	tint?: Tint;
}

export interface ModelDefinition {
	/** URL-safe and stable. This is what a route param carries. */
	id: string;

	/** What a customer reads. */
	name: string;

	/** One or two lines. Clamped to two by `ModelCard`, so write for two. */
	description?: string;

	/** Where the asset is, and what it means. */
	model: ModelConfig;

	/**
	 * A still, for cards and for `thumbnailUrl` in structured data.
	 *
	 * Strongly recommended: a card without one shows a placeholder, and a card
	 * that renders live WebGL instead is the design mistake this whole data
	 * layer exists to make obvious rather than easy.
	 */
	poster?: string;

	/** The finishes this asset actually carries. */
	finishes?: readonly FinishDefinition[];

	/** Geometric zones, for a single-mesh asset with no variants. */
	zones?: readonly ZoneDefinition[];

	/** Free-form. Price, currency, category, whatever the shop is. */
	meta?: Record<string, unknown>;
}

export interface Catalogue {
	models: readonly ModelDefinition[];
}

/**
 * Declares a catalogue, with the ids preserved as literal types.
 *
 * The `const` type parameter is the whole reason this is a function rather than
 * a bare object: it keeps `models[n].id` as `"logo"` instead of widening it to
 * `string`, so `modelById('logo')` autocompletes and `modelById('logoo')` is a
 * compile error rather than an undefined at runtime.
 *
 * ```ts
 * export const catalogue = defineCatalogue({
 *   models: [
 *     {
 *       id: 'logo',
 *       name: 'The mark',
 *       model: { url: '/models/logo.glb' },
 *       finishes: [{ variant: 'Original' }, { variant: 'White' }],
 *     },
 *   ],
 * })
 * ```
 */
export function defineCatalogue<const T extends Catalogue>(catalogue: T): T {
	return catalogue;
}

/** The ids in a catalogue, as a union rather than as `string`. */
export type ModelId<C extends Catalogue> = C["models"][number]["id"];

export function modelById<C extends Catalogue>(
	catalogue: C,
	id: ModelId<C>,
): ModelDefinition | undefined {
	return catalogue.models.find((model) => model.id === id);
}

/** The label a finish should show, falling back to the asset's own name. */
export function finishLabel(finish: FinishDefinition): string {
	return finish.label ?? finish.variant;
}

/** Just the variant names, in order, ready for `variants` on a viewer. */
export function finishVariants(model: ModelDefinition): readonly string[] {
	return model.finishes?.map((finish) => finish.variant) ?? [];
}

/* -------------------------------------------------------------------------- */

export interface CatalogueProblem {
	modelId: string;
	/** `error` fails a build; `warning` is a thing worth knowing. */
	level: "error" | "warning";
	message: string;
}

/**
 * Checks a catalogue against itself, without loading a single asset.
 *
 * The expensive half - does the GLB really carry this variant - needs the
 * asset and lives in `verifyCatalogueAssets`. This half is pure, instant, and
 * catches the mistakes that are actually common: a duplicated id after a
 * copy-paste, a finish listed twice, an entry whose poster was never filled in.
 *
 * Returns problems rather than throwing, because a caller in a build script
 * wants all of them at once and a caller in a test wants to assert on them.
 */
export function verifyCatalogue(catalogue: Catalogue): CatalogueProblem[] {
	const problems: CatalogueProblem[] = [];
	const seen = new Set<string>();

	for (const model of catalogue.models) {
		if (seen.has(model.id)) {
			problems.push({
				modelId: model.id,
				level: "error",
				// Duplicated silently: `find` returns the first, so the second entry
				// is unreachable and every page for it renders the wrong product.
				message: `Duplicate id. The second entry is unreachable.`,
			});
		}
		seen.add(model.id);

		if (!/^[a-z0-9][a-z0-9-]*$/.test(model.id)) {
			problems.push({
				modelId: model.id,
				level: "error",
				message: `Id must be lowercase, digits and hyphens - it goes in a URL.`,
			});
		}

		const variants = new Set<string>();
		for (const finish of model.finishes ?? []) {
			if (variants.has(finish.variant)) {
				problems.push({
					modelId: model.id,
					level: "error",
					message: `Finish "${finish.variant}" is listed twice.`,
				});
			}
			variants.add(finish.variant);
		}

		if (!model.poster) {
			problems.push({
				modelId: model.id,
				level: "warning",
				// Not an error: a catalogue mid-build legitimately has none. But a
				// card with no poster either shows a placeholder or spends a WebGL
				// context, and both are worth knowing about before launch.
				message: `No poster. Cards will show a placeholder.`,
			});
		}

		if (model.finishes?.length && model.zones?.length) {
			problems.push({
				modelId: model.id,
				level: "warning",
				// Both work, but they answer the same question twice and the viewer
				// applies them in an order nobody chose.
				message: `Has both finishes and zones. Zone tints will be applied over the variant's material.`,
			});
		}
	}

	return problems;
}
