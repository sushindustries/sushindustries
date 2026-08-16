/**
 * Reads what a GLB actually contains, without a renderer.
 *
 * `listVariants` already answers this, but only once three.js has parsed the
 * asset - which needs a WebGL context, or at minimum a DOM shim, and takes as
 * long as loading the model. That is the wrong shape for the thing this is
 * for: a build step that checks forty assets and must be fast enough that
 * nobody turns it off.
 *
 * A GLB is a twelve-byte header followed by length-prefixed chunks, the first
 * of which is the glTF JSON. Everything a catalogue needs to be verified
 * against - variant names, material names, mesh count - is in that JSON, so
 * this reads the first chunk and stops. It never touches the binary payload,
 * which is where all the megabytes are.
 *
 * Pure and synchronous: hand it bytes, get back facts.
 */

const MAGIC_GLTF = 0x46546c67;
const CHUNK_JSON = 0x4e4f534a;
const HEADER_BYTES = 12;
const CHUNK_HEADER_BYTES = 8;

export interface GlbSummary {
	/** `KHR_materials_variants` names, in the order the asset declares them. */
	variants: string[];
	/** Material names. A variant maps to one of these. */
	materials: string[];
	meshes: number;
	/** Every extension the asset uses, so a loader gap shows up here first. */
	extensionsUsed: string[];
	/** Extensions a viewer must support or refuse to render. */
	extensionsRequired: string[];
}

/**
 * Parses the JSON chunk of a GLB.
 *
 * Throws rather than returning a partial answer: a file that is not a GLB is a
 * mistake in the catalogue, and reporting "no variants" for it would be
 * indistinguishable from a GLB that genuinely has none.
 */
export function readGlb(bytes: ArrayBuffer | Uint8Array): GlbSummary {
	const buffer = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
	const view = new DataView(
		buffer.buffer,
		buffer.byteOffset,
		buffer.byteLength,
	);

	if (buffer.byteLength < HEADER_BYTES) {
		throw new Error("Not a GLB: shorter than a header.");
	}

	// Little-endian throughout: the glTF spec says so, and the one time this is
	// read big-endian the magic still looks plausible enough to be confusing.
	if (view.getUint32(0, true) !== MAGIC_GLTF) {
		throw new Error(
			"Not a GLB. A .gltf file is JSON with separate buffers - read it directly.",
		);
	}

	let offset = HEADER_BYTES;
	while (offset + CHUNK_HEADER_BYTES <= buffer.byteLength) {
		const length = view.getUint32(offset, true);
		const type = view.getUint32(offset + 4, true);
		const start = offset + CHUNK_HEADER_BYTES;

		if (type === CHUNK_JSON) {
			const json = new TextDecoder().decode(
				buffer.subarray(start, start + length),
			);
			return summarise(JSON.parse(json));
		}

		// Chunks are padded to four-byte boundaries. Walking by the unpadded
		// length lands mid-header on any asset whose JSON is not a multiple of
		// four, which is most of them.
		offset = start + length + ((4 - (length % 4)) % 4);
	}

	throw new Error("GLB contains no JSON chunk.");
}

interface GltfJson {
	meshes?: unknown[];
	materials?: { name?: string }[];
	extensionsUsed?: string[];
	extensionsRequired?: string[];
	extensions?: {
		KHR_materials_variants?: { variants?: { name?: string }[] };
	};
}

function summarise(gltf: GltfJson): GlbSummary {
	return {
		variants:
			gltf.extensions?.KHR_materials_variants?.variants
				?.map((variant) => variant.name)
				.filter((name): name is string => typeof name === "string") ?? [],
		materials:
			gltf.materials
				?.map((material) => material.name)
				.filter((name): name is string => typeof name === "string") ?? [],
		meshes: gltf.meshes?.length ?? 0,
		extensionsUsed: gltf.extensionsUsed ?? [],
		extensionsRequired: gltf.extensionsRequired ?? [],
	};
}
