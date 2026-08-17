import {
	type KeyboardEvent,
	type ReactNode,
	useEffect,
	useId,
	useRef,
	useState,
} from "react";
import { Icon, type IconName } from "./icon";

export interface PaletteEntry {
	readonly id: string;
	readonly title: string;
	readonly href: string;
	/** One line under the title: a description, a category, a path. */
	readonly hint?: string;
	/** Group heading this entry sorts under. */
	readonly group?: string;
	readonly icon?: IconName;
	/** Colour family for the icon tile, resolved by the stylesheet. */
	readonly tone?: string;
}

export interface CommandPaletteProps {
	entries: readonly PaletteEntry[];
	open: boolean;
	onClose: () => void;
	/** Called with the chosen entry; the host owns navigation. */
	onSelect: (entry: PaletteEntry) => void;
	placeholder?: string;
}

/*
 * The search, as a palette.
 *
 * A native `<dialog>` does the heavy lifting: `showModal` gives focus
 * trapping, Escape-to-close and a real top layer, none of which need
 * reimplementing. What this adds is the part dialogs do not have - a filter
 * over everything the host can name, and arrow-key selection over the result.
 *
 * Matching is plain substring over title, hint and group. Fuzzy scoring on a
 * list this size buys typo-tolerance at the cost of results that reorder as
 * you type, and a palette whose first hit jumps around is slower to use than
 * one that is merely literal.
 *
 * The host owns the data and the navigation. This component never fetches and
 * never routes: entries come in as props, the choice goes out through
 * `onSelect`, which is what keeps it installable in a project with any router.
 */
export function CommandPalette({
	entries,
	open,
	onClose,
	onSelect,
	placeholder = "Search",
}: CommandPaletteProps): ReactNode {
	const dialogRef = useRef<HTMLDialogElement>(null);
	const listId = useId();
	const [query, setQuery] = useState("");
	const [active, setActive] = useState(0);

	useEffect(() => {
		const dialog = dialogRef.current;
		if (!dialog) return;

		if (open && !dialog.open) {
			setQuery("");
			setActive(0);
			dialog.showModal();
		}
		if (!open && dialog.open) dialog.close();
	}, [open]);

	const needle = query.trim().toLowerCase();
	const matches = needle
		? entries.filter((entry) =>
				`${entry.title} ${entry.hint ?? ""} ${entry.group ?? ""}`
					.toLowerCase()
					.includes(needle),
			)
		: entries;
	const shown = matches.slice(0, 12);
	const current = shown[Math.min(active, shown.length - 1)];

	function onKeyDown(event: KeyboardEvent<HTMLInputElement>): void {
		if (event.key === "ArrowDown") {
			event.preventDefault();
			setActive((index) => Math.min(index + 1, shown.length - 1));
		}
		if (event.key === "ArrowUp") {
			event.preventDefault();
			setActive((index) => Math.max(index - 1, 0));
		}
		if (event.key === "Enter" && current) {
			event.preventDefault();
			onSelect(current);
		}
	}

	return (
		/*
		 * The click handler only reads the backdrop - a click on the dialog
		 * element itself, outside `.palette-box`. Keyboard users already have
		 * the dialog's own Escape, so there is no key equivalent to add.
		 */
		// biome-ignore lint/a11y/useKeyWithClickEvents: backdrop dismiss; Escape is native to <dialog>
		<dialog
			ref={dialogRef}
			className="palette"
			onClose={onClose}
			onClick={(event) => {
				// A click on the backdrop is a click on the dialog element itself.
				if (event.target === dialogRef.current) onClose();
			}}
		>
			<div className="palette-box">
				<div className="palette-head">
					<Icon name="search" size={15} />
					{/* eslint-style autofocus warnings do not apply: a search
					   palette that opens unfocused defeats its own shortcut. */}
					<input
						autoFocus
						className="palette-input"
						placeholder={placeholder}
						value={query}
						role="combobox"
						aria-expanded={shown.length > 0}
						aria-controls={listId}
						aria-activedescendant={current ? `${listId}-${current.id}` : ""}
						onChange={(event) => {
							setQuery(event.target.value);
							setActive(0);
						}}
						onKeyDown={onKeyDown}
					/>
					<kbd className="palette-kbd">esc</kbd>
				</div>

				<ul className="palette-list" id={listId} data-lenis-prevent>
					{shown.map((entry, index) => (
						<li key={entry.id}>
							<button
								type="button"
								id={`${listId}-${entry.id}`}
								className="palette-item"
								data-active={entry === current}
								onMouseEnter={() => setActive(index)}
								onClick={() => onSelect(entry)}
							>
								{entry.icon ? (
									<span className="palette-icon" data-tone={entry.tone}>
										<Icon name={entry.icon} size={14} />
									</span>
								) : null}
								<span className="min-w-0">
									<span className="block truncate">{entry.title}</span>
									{entry.hint ? (
										<span className="block truncate text-xs fg-faint">
											{entry.hint}
										</span>
									) : null}
								</span>
								{entry.group ? (
									<span className="label shrink-0">{entry.group}</span>
								) : null}
							</button>
						</li>
					))}
					{shown.length === 0 ? (
						<li className="p-4 fg-faint text-sm">Nothing matches “{query}”</li>
					) : null}
				</ul>
			</div>
		</dialog>
	);
}
