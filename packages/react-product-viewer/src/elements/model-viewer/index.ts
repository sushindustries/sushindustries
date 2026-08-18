/**
 * `@sushindustries/react-product-viewer/model-viewer`
 *
 * One entry per element, deliberately. A single index re-exporting everything
 * would make every consumer depend on every element, which defeats the code
 * splitting the elements were separated for: a page that imports the card must
 * not download the dialog, and a page that imports nothing must not download
 * three.
 */

export { default, ModelViewer } from "./model-viewer";
export type {
	ModelViewerProps,
	ModelViewerScroll,
} from "./model-viewer.types";
