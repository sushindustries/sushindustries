import { type ReactNode, useState } from "react";
import { Icon, type IconName } from "./icon";

export interface DockTask {
	readonly id: string;
	readonly label: string;
	readonly icon?: IconName;
	/** Front-most window, drawn as the current one. */
	readonly active?: boolean;
}

export interface DockLauncherItem {
	readonly id: string;
	readonly label: string;
	readonly description?: string;
	readonly icon?: IconName;
	onSelect(): void;
}

export interface DockProps {
	/** What is open. One button each; pressing one brings it to the front. */
	readonly tasks?: readonly DockTask[];
	onSelectTask?(id: string): void;
	onCloseTask?(id: string): void;
	/** What the launcher offers, already filtered by `query`. */
	readonly results?: readonly DockLauncherItem[];
	query?: string;
	onQuery?(query: string): void;
	/** Text on the launcher button. */
	label?: string;
	/** Right-hand side. A count, a clock, a reset. */
	trailing?: ReactNode;
}

/*
 * The strip along the bottom: a launcher, what is open, and a corner.
 *
 * The launcher is a `<details>` rather than React state, which is the same
 * choice the nav makes and for the same reason - it opens on click and on
 * Enter, is announced as expandable, and closes on Escape without a line of
 * JavaScript from here. The search field inside it is controlled, because the
 * results are the consumer's to compute.
 *
 * Tasks are buttons, not tabs. A tab bar implies one of them is showing and the
 * others are not; here they are all on screen at once, stacked, and pressing
 * one raises it. Calling that a tab would be a lie about what the press does.
 *
 * The whole thing is one row that scrolls sideways rather than wrapping. A dock
 * that grows a second row moves the desktop above it, and a desktop that
 * resizes because you opened a window is a desktop that loses your icons.
 */
export function Dock({
	tasks = [],
	onSelectTask,
	onCloseTask,
	results = [],
	query = "",
	onQuery,
	label = "Everything",
	trailing,
}: DockProps): ReactNode {
	const [open, setOpen] = useState(false);

	return (
		<div className="dock">
			<details
				className="dock-launcher"
				open={open}
				onToggle={(event) => setOpen(event.currentTarget.open)}
			>
				<summary className="dock-start" aria-label={label}>
					{/*
					 * Four squares. It is the shape everything with a launcher uses,
					 * which is the point - a launcher nobody recognises is a button
					 * nobody presses.
					 */}
					<Icon name="grid" size={17} />
					<span className="dock-start-label">{label}</span>
				</summary>

				<div className="dock-panel">
					<div className="shelf-search">
						<Icon name="search" size={15} className="shelf-search-glyph" />
						<input
							type="search"
							className="shelf-search-input"
							placeholder="Search everything"
							aria-label="Search everything"
							value={query}
							onChange={(event) => onQuery?.(event.target.value)}
						/>
					</div>

					<ul className="dock-results">
						{results.map((item) => (
							<li key={item.id}>
								<button
									type="button"
									className="dock-result"
									onClick={() => {
										item.onSelect();
										setOpen(false);
									}}
								>
									<span className="window-icon">
										<Icon name={item.icon ?? "file"} size={16} />
									</span>
									<span className="min-w-0">
										<span className="block fg text-sm font-medium">
											{item.label}
										</span>
										{item.description ? (
											<span className="window-note">{item.description}</span>
										) : null}
									</span>
								</button>
							</li>
						))}

						{results.length === 0 ? (
							<li className="p-4 text-center label">
								{query ? "Nothing matches that" : "Type to search"}
							</li>
						) : null}
					</ul>
				</div>
			</details>

			<div className="dock-tasks">
				{tasks.map((task) => (
					<span key={task.id} className="dock-task">
						<button
							type="button"
							className="dock-task-face"
							data-active={task.active}
							onClick={() => onSelectTask?.(task.id)}
						>
							<Icon name={task.icon ?? "folder"} size={14} />
							<span className="dock-task-label">{task.label}</span>
						</button>

						{onCloseTask ? (
							<button
								type="button"
								className="dock-task-close"
								aria-label={`Close ${task.label}`}
								onClick={() => onCloseTask(task.id)}
							>
								<Icon name="close" size={12} />
							</button>
						) : null}
					</span>
				))}
			</div>

			{trailing ? <div className="dock-corner">{trailing}</div> : null}
		</div>
	);
}
