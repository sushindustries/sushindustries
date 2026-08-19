import {
	type MouseEvent as ReactMouseEvent,
	type PointerEvent as ReactPointerEvent,
	useCallback,
	useRef,
} from "react";

export interface DragPlaceOptions {
	/**
	 * Which cell it was dropped on, zero-based, counting from the top left.
	 *
	 * Cells rather than coordinates, because a desktop is a grid and the two
	 * things anybody actually wants from a placed icon are both properties of a
	 * grid: it stays inside the box, and it never lands on top of another one.
	 * Free coordinates give neither, and an icon half off the right edge with
	 * another one underneath it is worse than an icon that never moved.
	 */
	onPlace(column: number, row: number): void;
	/** How many cells across the box is. From the machine, not from measuring. */
	columns: number;
	/** How far the pointer must travel before this is a drag and not a click. */
	threshold?: number;
	/** Off means the handlers do nothing, for a thing pinned in a grid. */
	enabled?: boolean;
}

export interface DragPlaceHandle {
	/** Spread onto the element that should be draggable. */
	readonly handleProps: {
		onPointerDown(event: ReactPointerEvent<HTMLElement>): void;
		onPointerMove(event: ReactPointerEvent<HTMLElement>): void;
		onPointerUp(event: ReactPointerEvent<HTMLElement>): void;
		onPointerCancel(event: ReactPointerEvent<HTMLElement>): void;
		onClickCapture(event: ReactMouseEvent<HTMLElement>): void;
	};
}

function clamp(value: number, max: number): number {
	return Math.min(max, Math.max(0, value));
}

/*
 * Drag a thing to a cell of the grid it is in, and say which cell.
 *
 * The same rule as `DeskWindow`, because it is the same problem: **the position
 * is written to the element during the drag and to state only on release.**
 * Sixty state updates a second re-render everything the moved element is inside
 * of, and here that is a desktop full of icons.
 *
 * Two things this adds over the window's version, and both are the difference
 * between a draggable icon and a broken one.
 *
 * **A threshold.** An icon is a button first: it opens a folder. Pointer down,
 * three pixels of jitter, pointer up is somebody clicking, and if that counts
 * as a drag then the folder does not open and nothing explains why. So a press
 * is a click until it has travelled far enough to be a drag, and once it is a
 * drag the click that follows it is swallowed.
 *
 * **Cells.** The drop is snapped to the grid the icon already lives in, using
 * the icon's own size as the cell size - which is exact, because the icon *is*
 * a cell. Reporting a cell instead of a point is what lets an arrangement
 * survive a change of screen, and what lets the browser guarantee two icons
 * never overlap.
 */
export function useDragPlace({
	onPlace,
	columns,
	threshold = 4,
	enabled = true,
}: DragPlaceOptions): DragPlaceHandle {
	const from = useRef({ x: 0, y: 0, left: 0, top: 0, w: 1, h: 1, rows: 1 });
	const state = useRef<"idle" | "pressed" | "dragging">("idle");
	const at = useRef({ x: 0, y: 0 });

	const onPointerDown = useCallback(
		(event: ReactPointerEvent<HTMLElement>) => {
			if (!enabled || event.button !== 0) return;

			const node = event.currentTarget;
			const box = node.getBoundingClientRect();
			const parent = node.offsetParent as HTMLElement | null;
			if (!parent || box.width === 0 || box.height === 0) return;

			const bounds = parent.getBoundingClientRect();

			from.current = {
				x: event.clientX,
				y: event.clientY,
				left: box.left - bounds.left,
				top: box.top - bounds.top,
				w: box.width,
				h: box.height,
				/*
				 * How many rows fit in the desk, from the cell size just measured.
				 * Not from the number of icons: a desk with four icons on a laptop
				 * still has six rows of room, and refusing a drop into them would
				 * make most of the screen inexplicably inert.
				 */
				rows: Math.max(1, Math.floor(bounds.height / box.height)),
			};

			at.current = { x: from.current.left, y: from.current.top };
			state.current = "pressed";
		},
		[enabled],
	);

	const onPointerMove = useCallback(
		(event: ReactPointerEvent<HTMLElement>) => {
			if (state.current === "idle") return;

			const dx = event.clientX - from.current.x;
			const dy = event.clientY - from.current.y;

			if (state.current === "pressed") {
				if (Math.abs(dx) < threshold && Math.abs(dy) < threshold) return;

				state.current = "dragging";
				event.currentTarget.dataset.dragging = "true";

				/*
				 * Captured here, and never on pointerdown.
				 *
				 * This is the one line in this file that has to be in this exact
				 * place. A captured pointer retargets every later event to the
				 * capturing element - including the click - so capturing on
				 * pointerdown means the click lands on this wrapper and the button
				 * inside it never hears about it. The icons stop opening, and
				 * nothing about the markup explains why.
				 *
				 * By the time this runs the press has travelled past the threshold,
				 * so it is a drag, so there is no click left to protect.
				 */
				event.currentTarget.setPointerCapture(event.pointerId);
			}

			at.current = { x: from.current.left + dx, y: from.current.top + dy };

			/*
			 * Only the offset from where it started is written. The element keeps
			 * its place in the grid throughout - it is *drawn* somewhere else, which
			 * is what `translate` means, and the layout is untouched until a cell is
			 * committed. Nothing else on the desk moves while a drag is in progress.
			 */
			event.currentTarget.style.setProperty("--x", `${dx}px`);
			event.currentTarget.style.setProperty("--y", `${dy}px`);
		},
		[threshold],
	);

	const finish = useCallback(
		(event: ReactPointerEvent<HTMLElement>) => {
			const was = state.current;
			state.current = "idle";

			if (was !== "dragging") return;

			/*
			 * The drag offset is removed and a cell is committed instead. Leaving
			 * both would give the element a grid position and a pixel offset that
			 * disagree, and the offset wins - so the icon would sit a little further
			 * from where the state says it is after every single drag.
			 */
			const node = event.currentTarget;
			node.style.removeProperty("--x");
			node.style.removeProperty("--y");

			onPlace(
				clamp(Math.round(at.current.x / from.current.w), columns - 1),
				clamp(Math.round(at.current.y / from.current.h), from.current.rows - 1),
			);
		},
		[onPlace, columns],
	);

	return {
		handleProps: {
			onPointerDown,
			onPointerMove,
			onPointerUp: finish,
			onPointerCancel: finish,

			/*
			 * A drag ends with a click, and that click would open the folder the
			 * icon was just dragged away from. Captured on the way down so it never
			 * reaches the button, and cleared afterwards so the next real press
			 * works.
			 */
			onClickCapture(event) {
				const node = event.currentTarget;
				if (node.dataset.dragging !== "true") return;

				event.preventDefault();
				event.stopPropagation();
				delete node.dataset.dragging;
			},
		},
	};
}
