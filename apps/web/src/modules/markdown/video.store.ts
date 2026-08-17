import { Store } from "@tanstack/store";

/*
 * One video plays at a time, across the whole page.
 *
 * A document can hold several of these - the showcase page has two in
 * different variants - and without something arbitrating it, pressing play on
 * the second leaves the first still running somewhere above, audible and
 * invisible. The reader's only fix is to scroll back and find it.
 *
 * A TanStack Store rather than context or a prop, for the reason the command
 * palette uses one: the writers are unrelated. Each block is mounted by the
 * Markdown renderer with no knowledge of its siblings, and there is no common
 * ancestor to hang the state on that is not simply "the page".
 *
 * The value is the id of the video currently mounted, or null. Blocks compare
 * it to their own id, so exclusivity costs each of them one subscription and
 * no coordination.
 */
export const playingVideo = new Store<string | null>(null);

export function playVideo(id: string): void {
	playingVideo.setState(() => id);
}

/** Stopping is only allowed to stop yourself, or the last one wins twice. */
export function stopVideo(id: string): void {
	playingVideo.setState((current) => (current === id ? null : current));
}
