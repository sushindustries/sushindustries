import type { ReactNode } from "react";

export interface ToggleProps {
	/** What pressing it means. */
	children: ReactNode;
	pressed: boolean;
	onPressedChange: (pressed: boolean) => void;
}

export interface ToggleGroupProps {
	/** The choices, keyed by value. */
	options: readonly { value: string; label: ReactNode }[];
	value: string;
	onChange: (value: string) => void;
	/** Announced name of the group. */
	label: string;
}

/*
 * A button that stays down. `aria-pressed` is the whole state contract - the
 * showcase's device row has drawn this shape for a while, and these are that
 * shape with a public name. The group is single-select because that is what
 * every use here has wanted; multi-select is `pressed` on several Toggles.
 */
export function Toggle({
	children,
	pressed,
	onPressedChange,
}: ToggleProps): ReactNode {
	return (
		<button
			type="button"
			className="toggle"
			aria-pressed={pressed}
			data-active={pressed}
			onClick={() => onPressedChange(!pressed)}
		>
			{children}
		</button>
	);
}

export function ToggleGroup({
	options,
	value,
	onChange,
	label,
}: ToggleGroupProps): ReactNode {
	return (
		<fieldset className="toggle-group" aria-label={label}>
			{options.map((option) => (
				<button
					key={option.value}
					type="button"
					className="toggle"
					aria-pressed={option.value === value}
					data-active={option.value === value}
					onClick={() => onChange(option.value)}
				>
					{option.label}
				</button>
			))}
		</fieldset>
	);
}
