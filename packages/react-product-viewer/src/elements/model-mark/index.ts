/**
 * `@sushindustries/react-product-viewer/model-mark`
 *
 * One entry per element, deliberately. A single index re-exporting everything
 * would make every consumer depend on every element, which defeats the code
 * splitting the elements were separated for.
 */

export { ModelMark, default } from "./model-mark";
export type { ModelMarkProps } from "./model-mark.types";
export { useMarkSpin, type MarkSpin } from "./use-mark-spin";
export {
	applyMotion,
	MARK_MOTIONS,
	type MarkMotion,
	type MarkMotionFn,
} from "./mark-motions";
