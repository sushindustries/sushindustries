import {
	type ReactNode,
	useCallback,
	useEffect,
	useId,
	useRef,
	useState,
} from "react";
import { createPortal } from "react-dom";
import { Icon, type IconName } from "./icon";

export interface MenuAction {
	readonly id: string;
	readonly label: string;
	readonly icon?: IconName;
	/** Shown right-aligned. A shortcut, a file size, a format. */
	readonly hint?: string;
	readonly disabled?: boolean;
	onSelect(): void | Promise<void>;
}

export interface ContextMenuState {
	readonly open: boolean;
	readonly x: number;
	readonly y: number;
	readonly id: string;
	close(): void;
	openAt(x: number, y: number): void;
	/** Spread onto the thing being right-clicked or long-pressed. */
	readonly triggerProps: {
		onContextMenu(event: React.MouseEvent): void;
		onPointerDown(event: React.PointerEvent): void;
		onPointerUp(): void;
		onPointerMove(): void;
		onPointerCancel(): void;
	};
	/** Spread onto a visible button that opens the same menu. */
	readonly buttonProps: {
		"aria-haspopup": "menu";
		"aria-expanded": boolean;
		onClick(event: React.MouseEvent): void;
	};
}

/** How long a press has to last before it counts as a long press. */
const LONG_PRESS_MS = 450;

/**
 * One menu, reachable three ways.
 *
 * Right-click is the one people ask for and the one fewest people can use. A
 * menu that is *only* reachable by right-click does not exist on a phone, does
 * not exist for anyone navigating by keyboard, and does not exist on a trackpad
 * for someone who has never found secondary click. So there are three doors to
 * the same room:
 *
 *   pointer    right-click, or a long press on touch
 *   visible    a button the consumer places wherever it belongs
 *   keyboard   focus the button and press it, then arrows and Escape
 *
 * The long press cancels on movement, because a press that turns into a drag is
 * a scroll, and a menu that opens while someone is scrolling past is worse than
 * no menu.
 */
export function useContextMenu(): ContextMenuState {
	const [open, setOpen] = useState(false);
	const [point, setPoint] = useState({ x: 0, y: 0 });
	const timer = useRef<number | undefined>(undefined);
	const id = useId();

	const close = useCallback(() => setOpen(false), []);

	const openAt = useCallback((x: number, y: number) => {
		setPoint({ x, y });
		setOpen(true);
	}, []);

	const cancelPress = useCallback(() => {
		if (timer.current) window.clearTimeout(timer.current);
		timer.current = undefined;
	}, []);

	useEffect(() => cancelPress, [cancelPress]);

	/*
	 * Closing is global on purpose. A menu that only closes when you click the
	 * thing that opened it is a menu you have to remember how to dismiss.
	 */
	useEffect(() => {
		if (!open) return;

		function onAway(): void {
			setOpen(false);
		}
		function onKey(event: KeyboardEvent): void {
			if (event.key === "Escape") setOpen(false);
		}

		window.addEventListener("pointerdown", onAway);
		window.addEventListener("scroll", onAway, { passive: true });
		window.addEventListener("resize", onAway);
		window.addEventListener("keydown", onKey);

		return () => {
			window.removeEventListener("pointerdown", onAway);
			window.removeEventListener("scroll", onAway);
			window.removeEventListener("resize", onAway);
			window.removeEventListener("keydown", onKey);
		};
	}, [open]);

	return {
		open,
		x: point.x,
		y: point.y,
		id,
		close,
		openAt,

		triggerProps: {
			onContextMenu(event) {
				event.preventDefault();
				openAt(event.clientX, event.clientY);
			},
			onPointerDown(event) {
				// Touch and pen only. A held-down mouse button is not a long press,
				// it is the start of a drag or a text selection.
				if (event.pointerType === "mouse") return;

				const { clientX, clientY } = event;
				cancelPress();
				timer.current = window.setTimeout(() => {
					openAt(clientX, clientY);
				}, LONG_PRESS_MS);
			},
			onPointerUp: cancelPress,
			onPointerMove: cancelPress,
			onPointerCancel: cancelPress,
		},

		buttonProps: {
			"aria-haspopup": "menu",
			"aria-expanded": open,
			onClick(event) {
				event.preventDefault();
				event.stopPropagation();

				// Anchored to the button rather than to the pointer, so the menu
				// appears in the same place whether it was clicked or keyed.
				const box = event.currentTarget.getBoundingClientRect();
				openAt(box.left, box.bottom + 4);
			},
		},
	};
}

export interface ContextMenuProps {
	state: ContextMenuState;
	actions: readonly MenuAction[];
	/** Named for screen readers, since the menu itself has no visible title. */
	label?: string;
}

/*
 * The menu surface.
 *
 * `position: fixed` at the pointer, clamped so it never opens off-screen. The
 * clamp is why the coordinates are held in state rather than written as a CSS
 * custom property on the trigger: the menu has to know its own size before it
 * can decide where it fits.
 */
export function ContextMenu({
	state,
	actions,
	label = "Actions",
}: ContextMenuProps): ReactNode {
	const ref = useRef<HTMLDivElement>(null);
	const [box, setBox] = useState({ width: 0, height: 0 });

	// Measured after it renders, so the first paint at the raw point is the
	// only frame that can be wrong, and it is invisible.
	useEffect(() => {
		if (!state.open || !ref.current) return;

		const rect = ref.current.getBoundingClientRect();
		setBox({ width: rect.width, height: rect.height });

		// The first item, not the container: a menu that opens with nothing
		// focused needs an extra keypress before the arrows do anything.
		const first = ref.current.querySelector<HTMLButtonElement>(
			"[role='menuitem']:not(:disabled)",
		);
		(first ?? ref.current).focus();
	}, [state.open]);

	if (!state.open) return null;

	const margin = 8;
	const x = Math.max(
		margin,
		Math.min(state.x, window.innerWidth - box.width - margin),
	);
	const y = Math.max(
		margin,
		Math.min(state.y, window.innerHeight - box.height - margin),
	);

	/*
	 * Portalled to the body, for the same reason the shelf's window is.
	 *
	 * These coordinates are the pointer's, which are viewport coordinates, and
	 * `position: fixed` only means that while no ancestor has a `transform`,
	 * `filter` or `perspective`. Any of those makes the ancestor the containing
	 * block and the menu opens at an offset from wherever that element happens
	 * to be. This menu is used on a desktop inside a laptop lid that rotates on
	 * every scroll frame, so "no ancestor has a transform" is not a bet worth
	 * taking.
	 */
	if (typeof document === "undefined") return null;

	return createPortal(
		<div
			ref={ref}
			id={state.id}
			className="menu"
			role="menu"
			aria-label={label}
			tabIndex={-1}
			style={{ left: x, top: y }}
			onPointerDown={(event) => event.stopPropagation()}
			/*
			 * Roving focus, done here rather than with a hotkey library.
			 *
			 * A menu's arrow keys are scoped to the menu, and a global hotkey
			 * manager is the wrong shape for that - it would fire while focus was
			 * anywhere on the page. Fifteen lines against a dependency in every
			 * consumer's install is not a close call.
			 *
			 * Home and End are included because a menu is a list, and every other
			 * list on the platform answers to them.
			 */
			onKeyDown={(event) => {
				const items = [
					...event.currentTarget.querySelectorAll<HTMLButtonElement>(
						"[role='menuitem']:not(:disabled)",
					),
				];
				if (items.length === 0) return;

				const at = items.indexOf(document.activeElement as HTMLButtonElement);

				const next = {
					ArrowDown: at < 0 ? 0 : (at + 1) % items.length,
					ArrowUp:
						at < 0 ? items.length - 1 : (at - 1 + items.length) % items.length,
					Home: 0,
					End: items.length - 1,
				}[event.key];

				if (next === undefined) return;

				event.preventDefault();
				items[next]?.focus();
			}}
		>
			{actions.map((action) => (
				<button
					key={action.id}
					type="button"
					role="menuitem"
					className="menu-item"
					disabled={action.disabled}
					onClick={() => {
						state.close();
						void action.onSelect();
					}}
				>
					{action.icon ? <Icon name={action.icon} size={15} /> : null}
					<span className="flex-1 min-w-0">{action.label}</span>
					{action.hint ? (
						<span className="mono text-xs fg-faint">{action.hint}</span>
					) : null}
				</button>
			))}
		</div>,
		document.body,
	);
}
