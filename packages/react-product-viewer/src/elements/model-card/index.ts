/**
 * `@sushindustries/react-product-viewer/model-card`
 *
 * Importing this costs no three.js. The viewer is behind a `lazy` inside the
 * card, so a catalogue page of forty cards downloads an image apiece and none
 * of the renderer until a card is actually activated.
 */

export { ModelCard } from "./model-card";
export type { ModelCardActivation, ModelCardProps } from "./model-card.types";
export { useCardActivation } from "./use-card-activation";
