import { type ReactNode, useId } from "react";

export interface FieldProps {
	label: string;
	/** The control. Rendered inside the label, so clicking the text focuses it. */
	children: ReactNode;
	/** One line under the control: what good input looks like. */
	hint?: string;
	/** The validation message. Its presence is the error state. */
	error?: string;
}

/*
 * A labelled control. The control nests inside the <label>, which is the
 * association that needs no ids to survive a refactor - and the error is
 * announced by being pointed at, not by being red: `aria-describedby` wires
 * it, colour merely agrees.
 */
export function Field({ label, children, hint, error }: FieldProps): ReactNode {
	const noteId = useId();
	const note = error ?? hint;

	return (
		/*
		 * The control arrives through the slot, so the association is by
		 * nesting - which HTML defines and the linter cannot statically see.
		 */
		// biome-ignore lint/a11y/noLabelWithoutControl: the control is `children`, nested per the HTML spec
		<label className="field" data-invalid={error ? "true" : undefined}>
			<span className="label">{label}</span>
			<span aria-describedby={note ? noteId : undefined}>{children}</span>
			{note ? (
				<span id={noteId} className="field-note text-xs">
					{note}
				</span>
			) : null}
		</label>
	);
}
