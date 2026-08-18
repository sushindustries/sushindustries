import type { Material } from "three";
import {
	Mesh,
	PerspectiveCamera,
	PMREMGenerator,
	Scene,
	SphereGeometry,
	WebGLRenderer,
} from "three";
import type { GLTF } from "three-stdlib";
import { RoomEnvironment } from "three-stdlib";

/**
 * Material swatches, rendered from the asset itself.
 *
 * A configurator needs a picture of each option beside its name, and the usual
 * answers are all bad: a designer exports twenty PNGs by hand and they go stale
 * the moment the asset is re-authored; or the button gets a flat CSS colour,
 * which is exactly the thing `KHR_materials_variants` exists because a flat
 * colour cannot express - velvet and satin in the same hue are different
 * materials, not different colours.
 *
 * So render the real material. One offscreen renderer, one sphere, one frame per
 * variant, and the picture is generated from the same GLB the viewer shows -
 * meaning it cannot disagree with what the customer gets.
 *
 * Costs one WebGL context for the duration of the call and nothing afterwards:
 * the renderer, its geometry and its environment are disposed before returning.
 */

export interface SwatchOptions {
	/** Pixel size of the square swatch. @default 96 */
	size?: number;
	/**
	 * Device pixel ratio to render at.
	 *
	 * Swatches are small and sit next to text, so a 1× swatch beside 2× type looks
	 * broken in a way a 1× photograph would not.
	 *
	 * @default 2
	 */
	pixelRatio?: number;
}

/** A rendered swatch, as a PNG data URL. */
export type Swatch = string;

function createRig(size: number, pixelRatio: number) {
	const renderer = new WebGLRenderer({
		alpha: true,
		antialias: true,
		// The swatch is read back with toDataURL, and without this the drawing
		// buffer may be cleared before the read happens.
		preserveDrawingBuffer: true,
	});
	renderer.setSize(size, size, false);
	renderer.setPixelRatio(pixelRatio);

	const scene = new Scene();
	const pmrem = new PMREMGenerator(renderer);
	const environment = pmrem.fromScene(RoomEnvironment(), 0.04).texture;
	scene.environment = environment;

	const camera = new PerspectiveCamera(35, 1, 0.1, 10);
	camera.position.set(0, 0, 3.1);

	// A sphere, not a cube or a plane. A flat plane hides everything that makes
	// one material different from another - the roughness falloff, the sheen at
	// grazing angles, the way a clearcoat separates from the base. Those all live
	// in how the surface turns away from the light.
	const geometry = new SphereGeometry(1, 48, 32);
	const mesh = new Mesh(geometry);
	scene.add(mesh);

	return {
		renderer,
		scene,
		camera,
		mesh,
		dispose() {
			geometry.dispose();
			environment.dispose();
			pmrem.dispose();
			renderer.dispose();
			// Frees the WebGL context immediately rather than when the GC eventually
			// notices. Browsers cap concurrent contexts at around sixteen, and a
			// catalogue that renders swatches per product will hit that.
			renderer.forceContextLoss();
		},
	};
}

/**
 * Renders one material to a PNG data URL.
 *
 * Use {@link renderVariantSwatches} for more than one - it shares a single
 * renderer across the whole set, which is the expensive part.
 */
export function renderMaterialSwatch(
	material: Material,
	{ size = 96, pixelRatio = 2 }: SwatchOptions = {},
): Swatch {
	const rig = createRig(size, pixelRatio);
	try {
		rig.mesh.material = material;
		rig.renderer.render(rig.scene, rig.camera);
		return rig.renderer.domElement.toDataURL("image/png");
	} finally {
		rig.dispose();
	}
}

/**
 * Renders a swatch for each named variant in the asset.
 *
 * The materials come out of the GLB's own `KHR_materials_variants` mappings, so
 * a variant the asset does not carry produces no entry - check the returned map
 * rather than assuming a swatch exists for every name you asked for.
 *
 * ```ts
 * const swatches = await renderVariantSwatches(gltf, listVariants(gltf))
 * // Map { 'midnight' => 'data:image/png;base64,…', … }
 * ```
 *
 * Where a variant maps several meshes - a chair whose seat and back both change
 * - the first mapped material is the one shown. A swatch is a hint, not a
 * rendering of the whole product; that is what the viewer beside it is for.
 */
export async function renderVariantSwatches(
	gltf: GLTF,
	names: readonly string[],
	options: SwatchOptions = {},
): Promise<Map<string, Swatch>> {
	const { size = 96, pixelRatio = 2 } = options;
	const result = new Map<string, Swatch>();
	if (names.length === 0) return result;

	const root = (
		gltf.userData as {
			gltfExtensions?: {
				KHR_materials_variants?: { variants: Array<{ name: string }> };
			};
		}
	).gltfExtensions?.KHR_materials_variants;
	if (!root) return result;

	// Find, for each variant index, the first material any mesh maps to it.
	const materialIndexFor = new Map<number, number>();
	gltf.scene.traverse((object) => {
		const mesh = object as Mesh;
		if (!mesh.isMesh) return;
		const def = (
			mesh.userData.gltfExtensions as
				| {
						KHR_materials_variants?: {
							mappings: Array<{ material: number; variants: number[] }>;
						};
				  }
				| undefined
		)?.KHR_materials_variants;
		if (!def) return;
		for (const mapping of def.mappings) {
			for (const variant of mapping.variants) {
				if (!materialIndexFor.has(variant)) {
					materialIndexFor.set(variant, mapping.material);
				}
			}
		}
	});

	const rig = createRig(size, pixelRatio);
	try {
		for (const name of names) {
			const index = root.variants.findIndex((v) => v.name === name);
			const materialIndex =
				index >= 0 ? materialIndexFor.get(index) : undefined;
			if (materialIndex === undefined) continue;

			const material = (await gltf.parser.getDependency(
				"material",
				materialIndex,
			)) as Material;

			rig.mesh.material = material;
			rig.renderer.render(rig.scene, rig.camera);
			result.set(name, rig.renderer.domElement.toDataURL("image/png"));
		}
	} finally {
		rig.dispose();
	}

	return result;
}
