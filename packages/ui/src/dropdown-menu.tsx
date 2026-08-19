import { type ReactNode, useCallback, useId, useRef } from "react";
import { Icon, type IconName } from "./icon";

/*
 * A menu hung off a button.
 *
 * `context-menu.tsx` beside this is the other half of the same idea and is not
 * interchangeable with it: that one opens at a pointer, from a right-click or
 * a long press, and portals itself into the body to escape its ancestors. This
 * one opens from a control somebody clicked on purpose, which changes almost
 * every decision - it needs to be reachable by keyboard from that control, it
 * needs to sit against it rather than at a coordinate, and it is the menu a row
 * of actions in a table wants.
 *
 * Built on the popover API rather than on a portal and a document listener.
 * The platform already does the four things a menu needs and does them better
 * than a component can:
 *
 *   the top layer      - over every stacking context, without a z-index war
 *   light dismiss      - a click anywhere else closes it
 *   Escape             - closes it, and returns focus to the invoker
 *   one at a time      - opening another `popover="auto"` closes this one
 *
 * What is left is placement and the arrow keys, which are below. That is the
 * whole component, and it is why this has no dependencies.
 *
 * Not CSS anchor positioning, which would delete the placement code entirely
 * and is Chromium-only as of this writing - a menu that lands in the top left
 * corner in Safari is not a progressive enhancement. Measured on toggle
 * instead, which every browser with a popover also supports.
 */

export interface DropdownItem {
	/** Stable across renders. React's key, and what `onSelect` is told. */
	readonly id: string;

	readonly label: string;

	/** Drawn before the label. From the shared icon set. */
	readonly icon?: IconName;

	/** Still shown, still announced, and not selectable. */
	readonly disabled?: boolean;

	/**
	 * Marked as the one that removes something.
	 *
	 * Colour only - it does not confirm anything. A destructive item that needs
	 * a second look needs a dialog, and this menu is not one.
	 */
	readonly destructive?: boolean;
}

export interface DropdownMenuProps {
	/** The button's text. Also the menu's accessible name. */
	readonly label: string;

	readonly items: readonly DropdownItem[];

	/** Called with the item's id. Not called for a disabled item. */
	readonly onSelect: (id: string) => void;

	/** Drawn in the button, before its label. */
	readonly icon?: IconName;

	/** Which edge the menu lines up with. `end` for a right-hand column. */
	readonly align?: "start" | "end";

	/** Replaces the button's classes, for a menu that is an icon in a table. */
	readonly buttonClassName?: string;

	/** Nothing to do here, said in the menu rather than by a missing button. */
	readonly empty?: string;
}

/** How far the menu sits from the button that opened it. */
const GAP = 6;

export function DropdownMenu({
	label,
	items,
	onSelect,
	icon,
	align = "start",
	buttonClassName = "btn btn-quiet btn-sm",
	empty = "Nothing to do here.",
}: DropdownMenuProps): ReactNode {
	const id = useId();
	const button = useRef<HTMLButtonElement>(null);
	const menu = useRef<HTMLDivElement>(null);

	/*
	 * Placement, on the way open rather than after it.
	 *
	 * `beforetoggle` fires while the popover is still closed but already
	 * measurable, so the position is set before the first frame it is visible
	 * in - doing this on `toggle` instead means one frame at the top left of the
	 * viewport, which reads as a flicker rather than as a menu.
	 *
	 * Viewport coordinates, because an element in the top layer is positioned
	 * against the viewport and not against any ancestor. That is the property
	 * that makes this work inside a scrolling table cell at all.
	 */
	const place = useCallback(
		(event: { newState: string }) => {
			if (event.newState !== "open") return;

			const anchor = button.current?.getBoundingClientRect();
			const surface = menu.current;
			if (!anchor || !surface) return;

			// Measured after it is laid out but before it is painted. `width` is
			// zero on a display:none popover, which is why this cannot be hoisted.
			const width = surface.offsetWidth;
			const height = surface.offsetHeight;

			const left = align === "end" ? anchor.right - width : anchor.left;
			const below = anchor.bottom + GAP;

			/*
			 * Flipped above the button when there is no room below, and clamped
			 * into the viewport sideways. Both are the same failure - a menu drawn
			 * where it cannot be read - and neither is worth a positioning library.
			 */
			const top =
				below + height > window.innerHeight && anchor.top - height - GAP > 0
					? anchor.top - height - GAP
					: below;

			surface.style.left = `${Math.max(GAP, Math.min(left, window.innerWidth - width - GAP))}px`;
			surface.style.top = `${top}px`;
		},
		[align],
	);

	/**
	 * Arrow keys over the items, which the popover API does not do.
	 *
	 * Reading the DOM rather than holding an index in state: the enabled items
	 * are exactly what is rendered, so asking the menu is one source of truth
	 * where an index would be a second one to keep in step with `items`.
	 */
	const navigate = useCallback((event: React.KeyboardEvent) => {
		const keys = ["ArrowDown", "ArrowUp", "Home", "End"];
		if (!keys.includes(event.key)) return;

		const options = Array.from(
			menu.current?.querySelectorAll<HTMLButtonElement>(
				'[role="menuitem"]:not(:disabled)',
			) ?? [],
		);
		if (options.length === 0) return;

		event.preventDefault();

		const at = options.indexOf(document.activeElement as HTMLButtonElement);
		const next =
			event.key === "Home"
				? 0
				: event.key === "End"
					? options.length - 1
					: event.key === "ArrowDown"
						? (at + 1) % options.length
						: (at - 1 + options.length) % options.length;

		options[next]?.focus();
	}, []);

	const choose = (item: DropdownItem) => {
		if (item.disabled) return;
		// Closed first, so focus returns to the button before whatever the
		// selection does with it - a dialog that opens under a menu that is
		// still up is the usual version of this going wrong.
		menu.current?.hidePopover();
		onSelect(item.id);
	};

	return (
		<>
			<button
				ref={button}
				type="button"
				className={buttonClassName}
				popoverTarget={id}
				aria-haspopup="menu"
			>
				{icon ? <Icon name={icon} /> : null}
				{label}
				<Icon name="chevron" className="dropdown-caret" />
			</button>

			{/*
			 * A div with `role="menu"`, not `<menu>`. That element is a list and
			 * carries `role="list"`, which is not the same thing to a screen
			 * reader: a menu announces its item count and its position, a list
			 * announces neither.
			 */}
			<div
				ref={menu}
				id={id}
				popover="auto"
				role="menu"
				aria-label={label}
				className="menu dropdown-menu"
				onKeyDown={navigate}
				onBeforeToggle={place}
			>
				{items.length === 0 ? (
					<p className="menu-empty">{empty}</p>
				) : (
					items.map((item) => (
						<button
							key={item.id}
							type="button"
							role="menuitem"
							className="menu-item"
							data-destructive={item.destructive ? "" : undefined}
							disabled={item.disabled}
							onClick={() => choose(item)}
						>
							{item.icon ? <Icon name={item.icon} /> : null}
							{item.label}
						</button>
					))
				)}
			</div>
		</>
	);
}
