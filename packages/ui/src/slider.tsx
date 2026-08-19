import type { InputHTMLAttributes, ReactNode } from "react";

export interface SliderProps
	extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
	label: string;
}

/*
 * A native range input with its label, painted by accent-color. Everything a
 * rebuilt slider spends its life re-earning - keyboard steps, page-up jumps,
 * RTL, form value - ships in the element.
 */
export function Slider({ label, ...props }: SliderProps): ReactNode {
	return (
		<label className="field">
			<span className="label">{label}</span>
			<input type="range" className="slider" {...props} />
		</label>
	);
}
