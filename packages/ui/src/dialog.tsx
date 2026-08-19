import { type ReactNode, useEffect, useRef } from "react";
import { Icon } from "./icon";

export interface DialogProps {
	/** Calls `showModal`, so the page behind goes inert while it is true. */
	open: boolean;
	/** Escape, the backdrop and the close button all arrive here. Clear `open` or the two disagree. */
	onClose: () => void;
	title: string;
	children: ReactNode;
	/** Usually a Button row. */
	footer?: ReactNode;
}

/*
 * A native <dialog>, driven by props. `showModal` supplies the top layer,
 * focus trap, Escape and the backdrop; this adds the frame, the title the
 * dialog is labelled by, and click-outside - the one native gap. The command
 * palette is this same recipe with a filter; they stay separate because a
 * dialog's job is to hold, a palette's to leave.
 */
export function Dialog({
	open,
	onClose,
	title,
	children,
	footer,
}: DialogProps): ReactNode {
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
			className="dialog"
			onClose={onClose}
			onClick={(event) => {
				if (event.target === ref.current) onClose();
			}}
		>
			<div className="dialog-box">
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
				<div className="mt-3 text-sm fg-dim">{children}</div>
				{footer ? (
					<div className="mt-5 flex items-center gap-3 justify-end">
						{footer}
					</div>
				) : null}
			</div>
		</dialog>
	);
}
