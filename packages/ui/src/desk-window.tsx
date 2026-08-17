import { type ReactNode, useCallback, useRef } from "react";
import { Icon } from "./icon";

export interface DeskWindowProps {
	title: ReactNode;
	children: ReactNode;
	/** Left edge in pixels within the desk. Clamped so 80px always stays reachable. */
	x: number;
	/** Top edge in pixels within the desk. Clamped so the title bar cannot leave it. */
	y: number;
	/** Stacking order, applied as `zIndex`. The desk decides which window is highest. */
	z: number;
	/** Set once resized. Absent uses the CSS default. */
	w?: number;
	/** Set once resized, never below 160. Absent uses the CSS default. */
	h?: number;
	/** Committed on release, not during the drag. */
	onMove(x: number, y: number): void;
	/** Committed on release, not during the resize. */
	onResize?(w: number, h: number): void;
	onClose(): void;
	/** Bring to the front. Called on any press inside. */
	onRaise(): void;
	label?: string;
}

/**
 * A window you can move, in front of or behind the others.
 *
 * Dragging is three pointer events and one rule: **the position is written to
 * the element during the drag and to state only on release.** Sixty state
 * updates a second would re-render the window's whole contents on every frame
 * of every drag, and the contents of these are grids of icons.
 *
 * `setPointerCapture` is what makes the drag survive the pointer leaving the
 * title bar. Without it, moving faster than React can repaint drops the drag
 * the moment the cursor outruns the element - which is exactly when somebody is
 * throwing a window across the screen and most notices it break.
 *
 * The same three handlers serve mouse, touch and pen, because they are pointer
 * events. There is no touch-specific path here and no library.
 */
export function DeskWindow({
	title,
	children,
	x,
	y,
	z,
	w,
	h,
	onMove,
	onResize,
	onClose,
	onRaise,
	label,
}: DeskWindowProps): ReactNode {
	const ref = useRef<HTMLDivElement>(null);
	const from = useRef<{ x: number; y: number; left: number; top: number }>({
		x: 0,
		y: 0,
		left: 0,
		top: 0,
	});
	const at = useRef({ x, y });
	const size = useRef({ w: w ?? 0, h: h ?? 0 });

	const onPointerDown = useCallback(
		(event: React.PointerEvent<HTMLDivElement>) => {
			// Left button and touch only. A right-click on the title bar belongs
			// to the context menu, not to a drag.
			if (event.button !== 0) return;

			const node = ref.current;
			if (!node) return;

			event.currentTarget.setPointerCapture(event.pointerId);

			from.current = { x: event.clientX, y: event.clientY, left: x, top: y };
			at.current = { x, y };
			node.dataset.dragging = "true";
		},
		[x, y],
	);

	const onPointerMove = useCallback(
		(event: React.PointerEvent<HTMLDivElement>) => {
			const node = ref.current;
			if (node?.dataset.dragging !== "true") return;

			/*
			 * Clamped so a window cannot be dragged out of the screen it lives in.
			 * A window you can lose behind the edge is a window you have to reset
			 * the whole desk to get back.
			 */
			const parent = node.parentElement;
			const maxX = parent ? parent.clientWidth - 80 : Number.POSITIVE_INFINITY;
			const maxY = parent ? parent.clientHeight - 44 : Number.POSITIVE_INFINITY;

			const next = {
				x: Math.min(
					maxX,
					Math.max(0, from.current.left + event.clientX - from.current.x),
				),
				y: Math.min(
					maxY,
					Math.max(0, from.current.top + event.clientY - from.current.y),
				),
			};

			at.current = next;
			node.style.setProperty("--x", `${next.x}px`);
			node.style.setProperty("--y", `${next.y}px`);
		},
		[],
	);

	const onPointerUp = useCallback(() => {
		const node = ref.current;
		if (node?.dataset.dragging !== "true") return;

		node.dataset.dragging = "false";
		onMove(at.current.x, at.current.y);
	}, [onMove]);

	/*
	 * Resizing is the same three events as dragging, against the other corner.
	 *
	 * Not `resize: both` in CSS, which would be one line: a CSS resize handle
	 * cannot be told about a minimum that depends on the content, cannot be
	 * clamped to the desk, and - the one that decides it - writes to the
	 * element's inline size without telling React, so the size is forgotten the
	 * moment anything re-renders. This writes the same custom properties the
	 * drag does and commits on release.
	 */
	const onResizeDown = useCallback((event: React.PointerEvent<HTMLElement>) => {
		if (event.button !== 0) return;

		const node = ref.current;
		if (!node) return;

		event.stopPropagation();
		event.currentTarget.setPointerCapture(event.pointerId);

		const box = node.getBoundingClientRect();
		from.current = {
			x: event.clientX,
			y: event.clientY,
			left: box.width,
			top: box.height,
		};
		size.current = { w: box.width, h: box.height };
		node.dataset.resizing = "true";
	}, []);

	const onResizeMove = useCallback((event: React.PointerEvent<HTMLElement>) => {
		const node = ref.current;
		if (node?.dataset.resizing !== "true") return;

		const parent = node.parentElement;

		const next = {
			w: Math.max(
				240,
				Math.min(
					parent ? parent.clientWidth - at.current.x : 9999,
					from.current.left + event.clientX - from.current.x,
				),
			),
			h: Math.max(
				160,
				Math.min(
					parent ? parent.clientHeight - at.current.y : 9999,
					from.current.top + event.clientY - from.current.y,
				),
			),
		};

		size.current = next;
		node.style.setProperty("--w", `${next.w}px`);
		node.style.setProperty("--h", `${next.h}px`);
	}, []);

	const onResizeUp = useCallback(() => {
		const node = ref.current;
		if (node?.dataset.resizing !== "true") return;

		node.dataset.resizing = "false";
		onResize?.(size.current.w, size.current.h);
	}, [onResize]);

	return (
		<section
			ref={ref}
			className="desk-window"
			aria-label={label}
			style={
				{
					"--x": `${x}px`,
					"--y": `${y}px`,
					...(w ? { "--w": `${w}px` } : {}),
					...(h ? { "--h": `${h}px` } : {}),
					zIndex: z,
				} as React.CSSProperties
			}
			onPointerDownCapture={onRaise}
		>
			{/*
			 * The whole bar is the handle, minus the buttons in it. A window with a
			 * small grab area is a window people fight with, and the bar is the one
			 * part with nothing else to do.
			 */}
			<header
				className="desk-bar"
				onPointerDown={onPointerDown}
				onPointerMove={onPointerMove}
				onPointerUp={onPointerUp}
				onPointerCancel={onPointerUp}
			>
				<span className="desk-title min-w-0">{title}</span>

				<button
					type="button"
					className="desk-close"
					aria-label="Close window"
					// The bar starts a drag on pointerdown; without this, pressing
					// close would also begin dragging the window it is closing.
					onPointerDown={(event) => event.stopPropagation()}
					onClick={onClose}
				>
					<Icon name="close" size={15} />
				</button>
			</header>

			<div className="desk-body">{children}</div>

			{/*
			 * The corner. `aria-hidden` and not focusable, because resizing is a
			 * pointer refinement of something that already works - the window has a
			 * usable size without anybody touching this, and a keyboard user is not
			 * missing a capability, only a nicety.
			 */}
			{onResize ? (
				<span
					className="desk-resize"
					aria-hidden="true"
					onPointerDown={onResizeDown}
					onPointerMove={onResizeMove}
					onPointerUp={onResizeUp}
					onPointerCancel={onResizeUp}
				/>
			) : null}
		</section>
	);
}
