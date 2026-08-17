import type { InputHTMLAttributes, ReactNode } from "react";

export interface SwitchProps
	extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
	label: string;
}

/*
 * A switch is a checkbox that admits it - all the way down. The input stays
 * a real checkbox and is announced as one: `role="switch"` without managed
 * `aria-checked` is a promise half kept, and a checkbox is not a lie.
 * The track and thumb are drawn on the label's spans, driven by `:checked`.
 */
export function Switch({ label, ...props }: SwitchProps): ReactNode {
	return (
		<label className="switch flex items-center gap-3 pointer">
			<input type="checkbox" className="sr-only" {...props} />
			<span className="switch-track" aria-hidden="true">
				<span className="switch-thumb" />
			</span>
			<span>{label}</span>
		</label>
	);
}
