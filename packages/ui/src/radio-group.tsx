import { type ReactNode, useId } from "react";

export interface RadioOption {
	readonly value: string;
	readonly label: string;
}

export interface RadioGroupProps {
	/** Group label, announced with the set. */
	label: string;
	options: readonly RadioOption[];
	value?: string;
	defaultValue?: string;
	onChange?: (value: string) => void;
	name?: string;
}

/*
 * Radios in a fieldset, which is the one grouping screen readers announce
 * without help. Native inputs painted by accent-color; the group name falls
 * back to a generated id so two groups on one page never merge.
 */
export function RadioGroup({
	label,
	options,
	value,
	defaultValue,
	onChange,
	name,
}: RadioGroupProps): ReactNode {
	const generated = useId();
	const group = name ?? generated;

	return (
		<fieldset className="choice-group">
			<legend className="label">{label}</legend>
			{options.map((option) => (
				<label
					key={option.value}
					className="choice flex items-center gap-2 text-md pointer"
				>
					<input
						type="radio"
						name={group}
						value={option.value}
						checked={value === undefined ? undefined : value === option.value}
						defaultChecked={
							defaultValue === undefined
								? undefined
								: defaultValue === option.value
						}
						onChange={() => onChange?.(option.value)}
					/>
					<span>{option.label}</span>
				</label>
			))}
		</fieldset>
	);
}
