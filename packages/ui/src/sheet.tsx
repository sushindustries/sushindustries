import { type ReactNode, useEffect, useRef } from "react";
import { Icon } from "./icon";

export interface SheetProps {
	/** Calls `showModal`. A sheet is still modal - the page behind it cannot be reached. */
	open: boolean;
	/** Escape, the backdrop and the close button all arrive here. Clear `open` or the two disagree. */
	onClose: () => void;
	title: string;
	children: ReactNode;
	/** Which edge it slides from. */
	side?: "right" | "left";
}

/*
 * The dialog, docked to an edge. Same native element, same props, different
 * geometry - a sheet is where the content is a list or a form tall enough
 * that centring it would mean scrolling a floating box.
 */
export function Sheet({
	open,
	onClose,
	title,
	children,
	side = "right",
}: SheetProps): ReactNode {
	const ref = useRef<HTMLDialogElement>(null);

	useEffect(() => {
		const dialog = ref.current;
		if (!dialog) return;
		if (open && !dialog.open) dialog.showModal();
		if (!open && dialog.open) dialog.close();
	}, [open]);

	return (
		// biome-ignore lint/a11y/useKeyWithClickEvents: backdrop dismiss; Escape is native to <dialog>
		<dialog
			ref={ref}
			className="sheet"
			data-side={side}
			onClose={onClose}
			onClick={(event) => {
				if (event.target === ref.current) onClose();
			}}
		>
			<div className="sheet-box" data-lenis-prevent>
				<div className="flex items-center justify-between gap-3">
					<h2 className="h3 m-0">{title}</h2>
					<button
						type="button"
						className="dialog-close"
						onClick={onClose}
						aria-label="Close"
					>
						<Icon name="close" size={14} />
					</button>
				</div>
				<div className="mt-4">{children}</div>
			</div>
		</dialog>
	);
}
