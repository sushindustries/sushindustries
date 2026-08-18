/**
 * `@sushindustries/react-product-viewer/model-mark`
 *
 * One entry per element, deliberately. A single index re-exporting everything
 * would make every consumer depend on every element, which defeats the code
 * splitting the elements were separated for.
 */

export {
	applyMotion,
	MARK_MOTIONS,
	type MarkMotion,
	type MarkMotionFn,
} from "./mark-motions";
export { default, ModelMark } from "./model-mark";
export type { ModelMarkProps } from "./model-mark.types";
export { type MarkSpin, useMarkSpin } from "./use-mark-spin";
