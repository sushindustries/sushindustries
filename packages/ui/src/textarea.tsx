import type { ReactNode, TextareaHTMLAttributes } from "react";

export interface TextareaProps
	extends TextareaHTMLAttributes<HTMLTextAreaElement> {}

/*
 * A textarea in the same clothes as Input. `field-sizing: content` lets it
 * grow with what is typed where the browser supports it, and the rows
 * attribute stays the honest fallback where it does not.
 */
export function Textarea(props: TextareaProps): ReactNode {
	return (
		<textarea
			rows={props.rows ?? 4}
			{...props}
			className={`field-control field-textarea ${props.className ?? ""}`}
		/>
	);
}
