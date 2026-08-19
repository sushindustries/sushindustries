import type { InputHTMLAttributes, ReactNode } from "react";

export interface CheckboxProps
	extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
	label: string;
}

/*
 * A native checkbox with its words attached. `accent-color` paints the box
 * in the site's accent, which keeps every native behaviour - keyboard, forms,
 * indeterminate, screen readers - for the cost of one CSS property. A drawn
 * replacement earns none of that back.
 */
export function Checkbox({ label, ...props }: CheckboxProps): ReactNode {
	return (
		<label className="choice flex items-center gap-2 text-md pointer">
			<input type="checkbox" {...props} />
			<span>{label}</span>
		</label>
	);
}
