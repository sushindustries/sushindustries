import { useCallback, useEffect, useState } from "react";

export interface DeskWindowState {
	/** Stable per window, so two windows on the same folder stay distinct. */
	readonly id: string;
	/** The ids of the folders leading to what this window is showing. */
	readonly path: readonly string[];
	readonly x: number;
	readonly y: number;
	/** Higher is nearer the front. */
	readonly z: number;
	/** Set once somebody resizes it. Absent means the default size. */
	readonly w?: number;
	readonly h?: number;
}

export interface DeskState {
	readonly windows: readonly DeskWindowState[];
	/** Icons the reader has taken off the desktop, by entry id. */
	readonly hidden: readonly string[];
	/** The next z to hand out. Stored so front-to-back survives a reload. */
	readonly top: number;
}

export const EMPTY_DESK: DeskState = { windows: [], hidden: [], top: 1 };

export interface DeskApi {
	readonly desk: DeskState;
	/**
	 * False until the stored desk has been read.
	 *
	 * Rendered state must not depend on this during the first paint - it exists
	 * so a consumer can avoid animating a restored window into place.
	 */
	readonly ready: boolean;
	open(path: readonly string[]): void;
	close(id: string): void;
	move(id: string, x: number, y: number): void;
	resize(id: string, w: number, h: number): void;
	raise(id: string): void;
	navigate(id: string, path: readonly string[]): void;
	hide(entryId: string): void;
	restore(entryId: string): void;
	reset(): void;
}

/**
 * The desk: which windows are open, where they are, and what has been put away.
 *
 * Two rules keep this safe to render on a server.
 *
 * **The first render is always the empty desk**, on the server and on the
 * client alike, and storage is read in an effect afterwards. Reading
 * localStorage during render produces markup the server could not have sent,
 * and React answers a mismatch by discarding the tree and rebuilding it - which
 * on a page of icons means every icon briefly has no working click handler.
 * That failure has already happened here once.
 *
 * **None of it is required.** Where a window sits is a preference about a
 * decoration. If storage is full, disabled, or in a browsing mode that refuses
 * it, the desk is simply the one everybody else gets, so every access is
 * wrapped and every failure is silent. There is nothing useful to say to
 * somebody about it.
 *
 * Paths are stored as ids rather than as entries, because the stored desk
 * outlives the tree it described: components get added and renamed, and a
 * window pointing at a folder that no longer exists should quietly not reopen
 * rather than restore a window onto nothing.
 */
export function useDeskState(key: string): DeskApi {
	const [desk, setDesk] = useState<DeskState>(EMPTY_DESK);
	const [ready, setReady] = useState(false);

	useEffect(() => {
		try {
			const stored = window.localStorage.getItem(key);
			if (stored) setDesk({ ...EMPTY_DESK, ...JSON.parse(stored) });
		} catch {
			// A default desk is a working desk.
		}
		setReady(true);
	}, [key]);

	const commit = useCallback(
		(next: DeskState) => {
			setDesk(next);
			try {
				window.localStorage.setItem(key, JSON.stringify(next));
			} catch {
				// It still applies for this visit.
			}
		},
		[key],
	);

	const update = useCallback(
		(id: string, change: (window: DeskWindowState) => DeskWindowState) => {
			setDesk((current) => {
				const next = {
					...current,
					windows: current.windows.map((entry) =>
						entry.id === id ? change(entry) : entry,
					),
				};

				try {
					window.localStorage.setItem(key, JSON.stringify(next));
				} catch {
					// As above.
				}

				return next;
			});
		},
		[key],
	);

	return {
		desk,
		ready,

		open: useCallback(
			(path) => {
				setDesk((current) => {
					/*
					 * One window per folder. Opening a folder that is already open
					 * raises it instead of stacking a second identical window on top
					 * of the first, which is the behaviour people expect and also the
					 * one that stops a double-click producing two windows.
					 */
					const key_ = path.join("/");
					const existing = current.windows.find(
						(entry) => entry.path.join("/") === key_,
					);

					const top = current.top + 1;

					const next: DeskState = existing
						? {
								...current,
								top,
								windows: current.windows.map((entry) =>
									entry.id === existing.id ? { ...entry, z: top } : entry,
								),
							}
						: {
								...current,
								top,
								windows: [
									...current.windows,
									{
										id: `${key_}-${top}`,
										path,
										/*
										 * Cascaded, so a second window is visibly a second
										 * window rather than a perfect eclipse of the first.
										 * Modulo five, or the tenth one is off the screen.
										 */
										x: 24 + (current.windows.length % 5) * 22,
										y: 20 + (current.windows.length % 5) * 18,
										z: top,
									},
								],
							};

					try {
						window.localStorage.setItem(key, JSON.stringify(next));
					} catch {
						// As above.
					}

					return next;
				});
			},
			[key],
		),

		close: useCallback(
			(id) => {
				setDesk((current) => {
					const next = {
						...current,
						windows: current.windows.filter((entry) => entry.id !== id),
					};

					try {
						window.localStorage.setItem(key, JSON.stringify(next));
					} catch {
						// As above.
					}

					return next;
				});
			},
			[key],
		),

		move: useCallback(
			(id, x, y) => update(id, (entry) => ({ ...entry, x, y })),
			[update],
		),

		resize: useCallback(
			(id, w, h) => update(id, (entry) => ({ ...entry, w, h })),
			[update],
		),

		raise: useCallback(
			(id) => {
				setDesk((current) => {
					const target = current.windows.find((entry) => entry.id === id);
					// Already in front: doing nothing avoids a render and stops the
					// z counter climbing forever on repeated clicks.
					if (!target || target.z === current.top) return current;

					const top = current.top + 1;
					const next = {
						...current,
						top,
						windows: current.windows.map((entry) =>
							entry.id === id ? { ...entry, z: top } : entry,
						),
					};

					try {
						window.localStorage.setItem(key, JSON.stringify(next));
					} catch {
						// As above.
					}

					return next;
				});
			},
			[key],
		),

		navigate: useCallback(
			(id, path) => update(id, (entry) => ({ ...entry, path })),
			[update],
		),

		hide: useCallback(
			(entryId) => {
				if (desk.hidden.includes(entryId)) return;
				commit({ ...desk, hidden: [...desk.hidden, entryId] });
			},
			[desk, commit],
		),

		restore: useCallback(
			(entryId) => {
				commit({
					...desk,
					hidden: desk.hidden.filter((entry) => entry !== entryId),
				});
			},
			[desk, commit],
		),

		reset: useCallback(() => commit(EMPTY_DESK), [commit]),
	};
}
