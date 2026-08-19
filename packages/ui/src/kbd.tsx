import type { ReactNode } from "react";

export interface KbdProps {
	children: ReactNode;
}

/*
 * A key, drawn as one. Semantically <kbd>, visually the same chip the
 * command palette wears - one shape for "press this" everywhere it appears.
 */
export function Kbd({ children }: KbdProps): ReactNode {
	return <kbd className="palette-kbd">{children}</kbd>;
}
