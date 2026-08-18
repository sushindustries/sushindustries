import { useGLTF } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import type {
	ModelConfig,
	ZoneScheme,
	ZoneTints,
} from "@sushindustries/product-viewer";
import { applyVariant } from "@sushindustries/product-viewer";
import type { ZonedMaterial } from "@sushindustries/product-viewer/zoned-material";
import type { ReactElement } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Mesh } from "three";
import { Box3, Vector3 } from "three";
import type { GLTF } from "three-stdlib";
import { SkeletonUtils } from "three-stdlib";

/**
 * The loaded model: normalised, seated on the floor, with its materials in the
 * state the caller asked for.
 *
 * Fully controlled. It reads no store, so the same component serves a route
 * holding selection in search params and a widget holding it in local state.
 *
 * Two material paths, and which one you are on is a property of the asset:
 *
 *  - **variants** - `KHR_materials_variants`, for models with a mesh per part.
 *    This is the one to design assets for.
 *  - **zoneTints** - a shader tint over geometric zones, for a single-mesh model
 *    you did not author. Ships nothing unless used.
 */

export interface ProductModelProps<S extends ZoneScheme = ZoneScheme> {
	model: ModelConfig;
	/**
	 * An already-loaded asset, for when something else owns the cache.
	 *
	 * Supplied, nothing here fetches: pass the result of a TanStack Query
	 * `productModelOptions` and the GLB downloads during the route loader instead
	 * of on mount. Omitted, drei's own suspense cache loads `model.url`.
	 */
	gltf?: GLTF;
	/** GLB variant names to apply, in order. Later entries win on conflict. */
	variants?: readonly string[];
	/**
	 * Where the origin sits inside the object, and therefore what anything
	 * turning it turns it around.
	 *
	 * | Value | Origin | For |
	 * | --- | --- | --- |
	 * | `base` | centred in X and Z, resting on y=0 | a product. Contact shadows and the grid land where it meets the ground |
	 * | `center` | the middle of the bounding box | anything that rotates. Nothing to rest on, and nothing to swing around |
	 *
	 * The difference only shows up once something is turning the model. With the
	 * base on y=0 the whole mass sits above the axis, so a Y rotation swings it
	 * around the origin like a fairground ride rather than turning it on the
	 * spot - which reads as the model orbiting rather than spinning.
	 */
	pivot?: "base" | "center";
	/**
	 * The zones `zoneTints` is keyed by.
	 *
	 * Required alongside `zoneTints` and meaningless without it. `wallRoofZones`
	 * reproduces the original building-shaped behaviour.
	 */
	zoneScheme?: S;
	/** Per-zone colour multipliers, for single-mesh models. */
	zoneTints?: ZoneTints<S>;
}

/**
 * Loads `model.url` through drei's suspense cache, then renders it.
 *
 * A separate component because hooks cannot be called conditionally, and the
 * alternative - calling `useGLTF` with a sentinel URL when the asset was
 * supplied - issues a request for that sentinel.
 */
function LoadingProductModel<S extends ZoneScheme = ZoneScheme>(
	props: ProductModelProps<S>,
): ReactElement {
	const gltf = useGLTF(props.model.url);
	return <ProductModelView {...props} gltf={gltf} />;
}

export function ProductModel<S extends ZoneScheme = ZoneScheme>(
	props: ProductModelProps<S>,
): ReactElement {
	return props.gltf ? (
		<ProductModelView {...props} gltf={props.gltf} />
	) : (
		<LoadingProductModel {...props} />
	);
}

function ProductModelView<S extends ZoneScheme = ZoneScheme>({
	model,
	gltf,
	variants,
	zoneScheme,
	zoneTints,
	pivot = "base",
}: ProductModelProps<S> & { gltf: GLTF }): ReactElement {
	const invalidate = useThree((state) => state.invalidate);
	const zonedRef = useRef<ZonedMaterial[]>([]);

	/**
	 * Each mounted viewer renders its own copy of the scene.
	 *
	 * A three.js object has exactly one parent, so two `<primitive>` elements
	 * pointing at the same `gltf.scene` do not both render it - the second to
	 * mount reparents it and the first goes blank. That is not an edge case: a
	 * hero with a "view in 3D" dialog over it is two viewers on one asset, and
	 * so is a grid of thumbnails.
	 *
	 * Cloning shares geometries and textures, so the copy costs almost no memory
	 * and no extra download. The flags are cleared because they describe work
	 * done to the original's materials, and this copy has not had it done yet.
	 */
	const scene = useMemo(() => {
		const copy = SkeletonUtils.clone(gltf.scene);
		copy.traverse((object) => {
			if (!(object as Mesh).isMesh) return;
			delete object.userData.zoned;
			delete object.userData.originalMaterial;
		});
		return copy;
	}, [gltf.scene]);
	// Bumped once the async wrapping below has produced materials, so the tinting
	// effect re-runs against them. Without it the first tints are dropped: the
	// tint effect fires on mount, finds an empty ref, and never hears that the
	// materials arrived - so a model rendered with tints already chosen shows its
	// base colours until something changes. Both donor projects shipped that.
	const [zonedRevision, setZonedRevision] = useState(0);

	const { scale, position } = useMemo(() => {
		const box = new Box3().setFromObject(scene);
		const size = box.getSize(new Vector3());
		const center = box.getCenter(new Vector3());
		// Calibrate on the longest horizontal dimension, not the overall longest: a
		// steep roof would otherwise shrink the footprint it is measured against,
		// and the footprint is what the price is quoted per.
		const horizontal = Math.max(size.x, size.z) || 1;
		const longest = Math.max(size.x, size.y, size.z) || 1;
		const s = model.realLength ? model.realLength / horizontal : 2 / longest;
		/*
		 * Where the origin sits inside the object, which is also what anything
		 * turning it will turn it *around*.
		 *
		 * `base` centres X and Z and rests the object on y=0, so contact shadows
		 * and the grid land where it actually meets the ground. That is right for a
		 * product and it is the default.
		 *
		 * `center` puts the origin at the middle of the bounding box. It matters
		 * the moment something rotates the model: with the base at y=0 the mass is
		 * entirely above the axis, so a Y rotation swings it around the origin like
		 * a fairground ride instead of turning it on the spot. There is no ground
		 * under an icon for the base to rest on, so there is nothing to trade away.
		 */
		return {
			scale: s,
			position: [
				-center.x * s,
				(pivot === "center" ? -center.y : -box.min.y) * s,
				-center.z * s,
			] as const,
		};
	}, [scene, model.realLength, pivot]);

	const zoned = Boolean(zoneTints && zoneScheme);

	useEffect(() => {
		if (!zoned || !zoneScheme) return;
		let cancelled = false;

		void (async () => {
			// Imported dynamically so `three-custom-shader-material` builds as its own
			// chunk. A project whose models have per-part meshes never fetches it.
			const [{ computeZoneAttribute }, { createZonedMaterial }] =
				await Promise.all([
					import("@sushindustries/product-viewer"),
					import("@sushindustries/product-viewer/zoned-material"),
				]);
			if (cancelled) return;

			const materials: ZonedMaterial[] = [];
			scene.traverse((object) => {
				const mesh = object as Mesh;
				if (!mesh.isMesh || Array.isArray(mesh.material)) return;

				// drei caches the parsed scene and shares it between mounts, so without
				// this flag a second pass - React Strict Mode alone is enough - wraps an
				// already wrapped material and the shader fails on a redefinition.
				if (mesh.userData.zoned) {
					materials.push(mesh.material as unknown as ZonedMaterial);
					return;
				}

				computeZoneAttribute(mesh.geometry, zoneScheme);
				const material = createZonedMaterial(mesh.material, zoneScheme);
				mesh.userData.zoned = true;
				mesh.material = material;
				materials.push(material);
			});

			zonedRef.current = materials;
			setZonedRevision((n) => n + 1);
			invalidate();
		})();

		return () => {
			cancelled = true;
		};
	}, [scene, zoned, zoneScheme, invalidate]);

	useEffect(() => {
		if (!zoneTints || !zoneScheme || zonedRef.current.length === 0) return;
		void zonedRevision;
		let cancelled = false;

		void (async () => {
			const { applyZoneTints } = await import(
				"@sushindustries/product-viewer/zoned-material"
			);
			if (cancelled) return;
			for (const material of zonedRef.current) {
				applyZoneTints(
					material,
					zoneScheme,
					zoneTints as Record<string, readonly [number, number, number]>,
				);
			}
			invalidate();
		})();

		return () => {
			cancelled = true;
		};
	}, [zoneTints, zoneScheme, zonedRevision, invalidate]);

	useEffect(() => {
		if (!variants?.length) return;
		let cancelled = false;

		void (async () => {
			// Sequential rather than parallel: two variants may map the same mesh, and
			// the caller's order is what decides the winner.
			for (const variant of variants) {
				await applyVariant(gltf, variant, scene);
				if (cancelled) return;
			}
			invalidate();
		})();

		return () => {
			cancelled = true;
		};
	}, [gltf, scene, variants, invalidate]);

	return (
		<group position={position} scale={scale}>
			<primitive object={scene} />
		</group>
	);
}
