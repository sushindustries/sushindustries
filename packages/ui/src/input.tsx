import type { InputHTMLAttributes, ReactNode } from "react";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {}

/*
 * A text input, and only the drawing of one. State, validation and labels
 * belong to the form and to `Field` - an input that manages itself is an
 * input that fights every form library it meets. The full native prop
 * surface passes through untouched.
 */
export function Input(props: InputProps): ReactNode {
	return (
		<input {...props} className={`field-control ${props.className ?? ""}`} />
	);
}
