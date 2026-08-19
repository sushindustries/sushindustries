import type { ReactNode } from "react";
import { Icon, type IconName } from "./icon";

export interface DockTask {
	readonly id: string;
	readonly label: string;
	readonly icon?: IconName;
	/** Front-most window, drawn as the current one. */
	readonly active?: boolean;
	/** Out of the way. Still listed, drawn quieter. */
	readonly minimised?: boolean;
}

export interface DockProps {
	/** What is open. One button each; pressing one brings it to the front. */
	readonly tasks?: readonly DockTask[];
	onSelectTask?(id: string): void;
	onCloseTask?(id: string): void;
	/** Opens search. The consumer decides what that means. */
	onSearch?(): void;
	/** Text on the search control. */
	label?: string;
	/** Right-hand side. A count, a clock, a link. */
	trailing?: ReactNode;
}

/*
 * The strip along the bottom: a search control, what is open, and a corner.
 *
 * Search opens a window rather than a panel of its own, and the dock does not
 * know that - it calls `onSearch` and the desk decides. That is the whole
 * reason this component has no state left in it.
 *
 * It went through a panel above the button and then a palette centred on the
 * screen, and both were a second kind of surface on a desktop that already had
 * one. A search window is dragged, resized, raised, closed and remembered by
 * exactly the same code as a folder, because it is the same thing.
 *
 * Tasks are buttons, not tabs. A tab bar implies one of them is showing and the
 * others are not; here they are all on screen at once, stacked.
 *
 * Pressing one is a toggle, which is the behaviour every taskbar has and nobody
 * writes down: minimised, it comes back; behind, it comes forward; already in
 * front, it goes away. The third case is the one people find by accident and
 * then use constantly.
 *
 * The whole thing is one row that scrolls sideways rather than wrapping. A dock
 * that grows a second row moves the desktop above it, and a desktop that
 * resizes because you opened a window is a desktop that loses your icons.
 */
export function Dock({
	tasks = [],
	onSelectTask,
	onCloseTask,
	onSearch,
	label = "Search",
	trailing,
}: DockProps): ReactNode {
	return (
		<div className="dock">
			{onSearch ? (
				/*
				 * The glyph alone, in a round well.
				 *
				 * It had the word beside it, which made it a button labelled Search
				 * next to a row of buttons labelled with folder names - one more
				 * thing competing for the same reading. A magnifier is the one icon
				 * that needs no label, and the tooltip and `aria-label` carry the
				 * word for anyone who wants it.
				 */
				<button
					type="button"
					className="dock-start"
					onClick={onSearch}
					aria-label={label}
					title={label}
				>
					<Icon name="search" size={17} />
				</button>
			) : null}

			<div className="dock-tasks" data-lenis-prevent>
				{tasks.map((task) => (
					<span key={task.id} className="dock-task">
						<button
							type="button"
							className="dock-task-face"
							data-active={task.active}
							data-minimised={task.minimised}
							aria-pressed={task.active}
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
