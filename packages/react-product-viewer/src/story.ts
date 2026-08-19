import type { ReactElement } from "react";

/**
 * Component Story Format, minus the dependency.
 *
 * These are the types Storybook's CSF exports, declared locally so a story file
 * can be written - and rendered by the lab in `examples/element-lab` - without
 * installing Storybook, its builder and its addon graph to look at a card.
 *
 * The shape is deliberately Storybook's rather than something of our own. The
 * day a real Storybook earns its install, every story file migrates by changing
 * this one import to `@storybook/react`; nothing else in any story has to move.
 * A bespoke story format would have made that a rewrite instead.
 *
 * Only the subset the lab actually renders is declared. Storybook's real `Meta`
 * also carries decorators, parameters and argTypes; adding fields here that
 * nothing reads would be documenting a capability we do not have.
 */

export interface Meta<Props> {
	/** Groups the element in the sidebar: `"Elements/Model Card"`. */
	title: string;
	component: (props: Props) => unknown;
	/** Args every story in the file starts from. */
	args?: Partial<Props>;
}

export interface StoryObj<Props> {
	/** Overrides this story's args. Merged over the meta's. */
	args?: Partial<Props>;

	/**
	 * Renders something other than the meta's component.
	 *
	 * For the stories that are about a component in a situation rather than
	 * about the component: a grid of six cards, a viewer inside a scrolling
	 * article. Those cannot be expressed as args, and a story that cannot show
	 * the situation cannot catch the bug that lives in it.
	 */
	render?: (args: Props) => ReactElement;

	/**
	 * Shown under the story's name in the lab.
	 *
	 * Worth writing for the stories that exist because something broke: "a long
	 * title once pushed the price out of the card" is the sentence that stops
	 * the next person deleting the story for being redundant.
	 */
	description?: string;

	/**
	 * Height for the story's frame, any CSS length.
	 *
	 * A viewer needs a tall frame and a card does not; without this the lab has
	 * to guess, and it guesses wrong for whichever of the two it was not tuned
	 * for.
	 */
	height?: string;
}
