import type { ModelConfig } from "./types";

/**
 * Schema.org `3DModel` structured data.
 *
 * A product page that renders a GLB and says nothing about it in its markup has
 * published a picture, as far as anything reading the page is concerned. The
 * `3DModel` type exists to say otherwise, and it is cheap: everything it needs
 * is already on the page.
 *
 * Deliberately narrow. `3DModel` inherits well over a hundred properties from
 * `MediaObject`, `CreativeWork` and `Thing`, and a builder that tried to model
 * all of them would be a schema.org library rather than part of a viewer. What
 * is here is the set a product configurator can actually fill in truthfully;
 * anything else goes through `extra`, untouched.
 *
 * The output is a plain object. Serialising it and getting it into the document
 * is the framework's job - `@sushindustries/react-product-viewer` exports a
 * component that does it, and any other renderer can `JSON.stringify` this.
 *
 * @see https://schema.org/3DModel
 */

/** Media types for the formats a browser can actually display. */
const ENCODING_FORMATS: Record<string, string> = {
	glb: "model/gltf-binary",
	gltf: "model/gltf+json",
	usdz: "model/vnd.usdz+zip",
	fbx: "application/octet-stream",
	obj: "model/obj",
	ply: "model/ply",
	stl: "model/stl",
};

/**
 * Guesses the media type from the file extension.
 *
 * A query string is stripped first, because a signed asset URL is the normal
 * case rather than the exotic one and `cabin.glb?sig=…` is still a GLB.
 */
export function encodingFormatFor(url: string): string | undefined {
	const path = url.split(/[?#]/)[0] ?? "";
	const extension = path.split(".").pop()?.toLowerCase();
	return extension ? ENCODING_FORMATS[extension] : undefined;
}

export interface AgentRef {
	name: string;
	url?: string;
	/** @default "Organization" */
	type?: "Person" | "Organization";
}

export interface ThreeDModelJsonLdInput {
	/** What the model depicts. Usually the product name. */
	name: string;
	description?: string;

	/**
	 * The viewer's own config.
	 *
	 * `url` becomes `contentUrl` and `license` becomes `license`, which is what
	 * that field has been carried around for: an asset's terms outlive whoever
	 * downloaded it, and this is the moment they become visible rather than
	 * merely recorded.
	 */
	model: ModelConfig;

	/**
	 * Absolute URL of the page the model is displayed on.
	 *
	 * Relative URLs are left exactly as given. Consumers of structured data
	 * resolve them against the document, so a relative path is valid - but an
	 * absolute one survives being syndicated, and syndication is the point.
	 */
	url?: string;

	/**
	 * A still of the model.
	 *
	 * `snapshotRef` on the viewer produces one. A data URL works but is a poor
	 * choice here: it inflates the page for every crawler and cannot be cached,
	 * so upload the snapshot once and reference it.
	 */
	thumbnailUrl?: string;

	/**
	 * Whether the model may be rescaled.
	 *
	 * Meaningful rather than decorative: room-layout and AR applications use it to
	 * decide whether the model may be fitted to a space. A product with real
	 * dimensions is not resizable, so this defaults to `false` whenever
	 * `model.realLength` is set - the presence of a real length is the claim that
	 * the size means something.
	 */
	isResizable?: boolean;

	creator?: AgentRef;
	publisher?: AgentRef;

	/** File size, as schema.org wants it: e.g. `"3.6 MB"`. */
	contentSize?: string;
	/** SHA-256 of the asset, if you track one. */
	sha256?: string;
	dateModified?: string;
	datePublished?: string;
	keywords?: string[];

	/**
	 * The product this model depicts.
	 *
	 * Pass the `@id` of a `Product` node you already emit, and the two are joined
	 * into one graph rather than sitting on the page as unrelated facts. Emitting
	 * a whole `Product` from here would mean this package deciding what a product
	 * is, which is exactly the line the schemas elsewhere in it refuse to cross.
	 */
	about?: string;

	/** Merged in last. Anything schema.org allows that is not modelled above. */
	extra?: Record<string, unknown>;
}

/** A `3DModel` node, ready to serialise. */
export type ThreeDModelJsonLd = Record<string, unknown>;

/** Drops keys whose value is undefined, so the output has no empty properties. */
function compact(input: Record<string, unknown>): Record<string, unknown> {
	return Object.fromEntries(
		Object.entries(input).filter(([, value]) => value !== undefined),
	);
}

function agent(ref: AgentRef | undefined): Record<string, unknown> | undefined {
	if (!ref) return undefined;
	return compact({
		"@type": ref.type ?? "Organization",
		name: ref.name,
		url: ref.url,
	});
}

/**
 * Builds a Schema.org `3DModel` node.
 *
 * ```ts
 * const jsonLd = threeDModelJsonLd({
 *   name: 'Larch cabin',
 *   model: { url: 'https://example.com/cabin.glb', realLength: 7, license: 'CC BY 4.0' },
 *   url: 'https://example.com/products/larch-cabin',
 *   about: 'https://example.com/products/larch-cabin#product',
 * })
 * ```
 *
 * > **Good to know**: the model is described here as a `3DModel`, which is a
 * > `MediaObject`. It is not a `Product`. Link the two with `about` rather than
 * > flattening them together - a crawler that finds a product's price on a
 * > media object has been told something false.
 */
export function threeDModelJsonLd({
	name,
	description,
	model,
	url,
	thumbnailUrl,
	isResizable,
	creator,
	publisher,
	contentSize,
	sha256,
	dateModified,
	datePublished,
	keywords,
	about,
	extra,
}: ThreeDModelJsonLdInput): ThreeDModelJsonLd {
	return compact({
		"@context": "https://schema.org",
		"@type": "3DModel",
		name,
		description,
		contentUrl: model.url,
		encodingFormat: encodingFormatFor(model.url),
		license: model.license,
		// A model with a real length is a claim about size; rescaling it would make
		// that claim false, so the default follows the data rather than the caller.
		isResizable: isResizable ?? (model.realLength ? false : undefined),
		url,
		thumbnailUrl,
		creator: agent(creator),
		publisher: agent(publisher),
		contentSize,
		sha256,
		dateModified,
		datePublished,
		keywords: keywords?.length ? keywords.join(", ") : undefined,
		about: about ? { "@id": about } : undefined,
		...extra,
	});
}
