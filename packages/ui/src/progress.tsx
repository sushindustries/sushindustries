import type { ReactNode } from "react";

export interface ProgressProps {
	/** 0 to `max`. Omit for the indeterminate sweep. */
	value?: number;
	max?: number;
	/** What is progressing. Announced with the number. */
	label: string;
}

/*
 * The native <progress>, restyled. It carries its own semantics - readers
 * announce the fraction without any ARIA here - and omitting `value` gets
 * the indeterminate state the drawn versions all fake.
 */
export function Progress({
	value,
	max = 100,
	label,
}: ProgressProps): ReactNode {
	return (
		<label className="field">
			<span className="label">{label}</span>
			<progress className="progress" value={value} max={max} />
		</label>
	);
}
