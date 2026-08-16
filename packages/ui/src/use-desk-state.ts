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
	/**
	 * Out of the way, but still open.
	 *
	 * A minimised window keeps its position, size and place in the stack. It is
	 * not closed and it is not a different kind of thing - it is the same window
	 * with somewhere else to be, which is why this is a flag and not a second
	 * list.
	 */
	readonly minimised?: boolean;
}

/**
 * Which cell of the desktop an icon has been put on, zero-based.
 *
 * A cell rather than a coordinate, because the two things anybody wants from a
 * placed icon are both properties of a grid and neither is a property of a
 * point: it stays inside the desk, and it never lands on top of another icon.
 *
 * Pixels were tried first and are wrong twice over - a position taken on a
 * 60rem laptop screen is off the edge of a 22rem phone, and nothing stops two
 * icons occupying the same pixels. Percentages fix the first and not the
 * second. Cells fix both, and `arrange` is what keeps them honest when the
 * column count changes underneath a stored arrangement.
 */
export interface DeskIconState {
	readonly col: number;
	readonly row: number;
}

export interface DeskState {
	readonly windows: readonly DeskWindowState[];
	/** Icons the reader has taken off the desktop, by entry id. */
	readonly hidden: readonly string[];
	/**
	 * Icons that have been dragged somewhere, by entry id.
	 *
	 * Only the ones that were moved. An icon nobody has touched is not in here
	 * and stays in the grid, which is what keeps the default arrangement
	 * responsive: the grid reflows for a narrow screen, and only the icons
	 * somebody deliberately placed are pinned where they were put.
	 */
	readonly icons: Readonly<Record<string, DeskIconState>>;
	/** The next z to hand out. Stored so front-to-back survives a reload. */
	readonly top: number;
}

export const EMPTY_DESK: DeskState = {
	windows: [],
	hidden: [],
	icons: {},
	top: 1,
};

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
	/** Raise it, or minimise it if it is already in front. */
	toggle(id: string): void;
	navigate(id: string, path: readonly string[]): void;
	hide(entryId: string): void;
	restore(entryId: string): void;
	/** Pin an icon on a cell of the desktop. */
	place(entryId: string, col: number, row: number): void;
	/** Put every placed icon back in the grid. */
	tidy(): void;
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

	/*
	 * Every change goes through here, and a failure to store one is silent.
	 *
	 * Storage can be full, disabled, or refused outright by a private window.
	 * None of those are worth telling anybody about: the change still applies to
	 * this visit, and the only thing lost is that it will not be there tomorrow.
	 */
	const save = useCallback(
		(next: DeskState) => {
			try {
				window.localStorage.setItem(key, JSON.stringify(next));
			} catch {
				// It still applies for this visit.
			}

			return next;
		},
		[key],
	);

	/** Read the current desk, produce the next, store it. */
	const edit = useCallback(
		(change: (current: DeskState) => DeskState) => {
			setDesk((current) => {
				const next = change(current);
				return next === current ? current : save(next);
			});
		},
		[save],
	);

	const commit = useCallback((next: DeskState) => setDesk(save(next)), [save]);

	const update = useCallback(
		(id: string, change: (window: DeskWindowState) => DeskWindowState) => {
			edit((current) => ({
				...current,
				windows: current.windows.map((entry) =>
					entry.id === id ? change(entry) : entry,
				),
			}));
		},
		[edit],
	);

	return {
		desk,
		ready,

		open: useCallback(
			(path) => {
				edit((current) => {
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

					return next;
				});
			},
			[edit],
		),

		close: useCallback(
			(id) =>
				edit((current) => ({
					...current,
					windows: current.windows.filter((entry) => entry.id !== id),
				})),
			[edit],
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
			(id) =>
				edit((current) => {
					const target = current.windows.find((entry) => entry.id === id);
					// Already in front: returning the same object avoids a render and
					// stops the z counter climbing forever on repeated clicks.
					if (!target || target.z === current.top) return current;

					const top = current.top + 1;

					return {
						...current,
						top,
						windows: current.windows.map((entry) =>
							entry.id === id ? { ...entry, z: top } : entry,
						),
					};
				}),
			[edit],
		),

		/*
		 * The taskbar's press, in one place.
		 *
		 * Minimised, it comes back and comes forward. Behind, it comes forward.
		 * Already in front, it goes away. That third case is the one people
		 * discover by accident and then rely on, and it is why this is a toggle
		 * rather than a raise.
		 */
		toggle: useCallback(
			(id) =>
				edit((current) => {
					const target = current.windows.find((entry) => entry.id === id);
					if (!target) return current;

					const front = target.z === current.top && !target.minimised;
					const top = front ? current.top : current.top + 1;

					return {
						...current,
						top,
						windows: current.windows.map((entry) =>
							entry.id === id
								? { ...entry, minimised: front, z: front ? entry.z : top }
								: entry,
						),
					};
				}),
			[edit],
		),

		navigate: useCallback(
			(id, path) => update(id, (entry) => ({ ...entry, path })),
			[update],
		),

		hide: useCallback(
			(entryId) =>
				edit((current) =>
					current.hidden.includes(entryId)
						? current
						: { ...current, hidden: [...current.hidden, entryId] },
				),
			[edit],
		),

		restore: useCallback(
			(entryId) =>
				edit((current) => ({
					...current,
					hidden: current.hidden.filter((entry) => entry !== entryId),
				})),
			[edit],
		),

		/*
		 * Where an icon was put, in percent of the desktop.
		 *
		 * Clamped here rather than at the call site, because this is the boundary
		 * a bad number would get stored past. An icon at 140% is an icon nobody
		 * can reach and no amount of resizing brings back - only Tidy up would,
		 * and somebody has to know that exists.
		 */
		/*
		 * Where an icon was dropped, as a cell.
		 *
		 * Stored exactly as given and not clamped here, because "inside the desk"
		 * is a question about a desk this hook cannot see - the column count comes
		 * from the machine, and the machine changes. `arrange` answers it at render
		 * time against the desk that actually exists, which is also the only place
		 * that can know two icons have collided.
		 */
		place: useCallback(
			(entryId, col, row) =>
				edit((current) => ({
					...current,
					icons: {
						...current.icons,
						[entryId]: { col: Math.max(0, col), row: Math.max(0, row) },
					},
				})),
			[edit],
		),

		/*
		 * Every icon back into the grid.
		 *
		 * Deliberately not part of `reset`: this is about the arrangement, and
		 * somebody who has spent a minute placing icons and wants them lined up
		 * again should not also lose the windows they have open.
		 */
		tidy: useCallback(
			() => edit((current) => ({ ...current, icons: {} })),
			[edit],
		),

		reset: useCallback(() => commit(EMPTY_DESK), [commit]),
	};
}
