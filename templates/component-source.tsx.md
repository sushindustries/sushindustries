<!-- template
target: packages/ui/src/{slug}.tsx
tokens: slug, pascal, title
-->
import type { ReactNode } from "react";

export interface {pascal}Props {
	children?: ReactNode;
}

/*
 * {title}.
 *
 * Say what this avoids, not what it does: the code below says what it does.
 * Styling comes from `@sushindustries/atoms`, so this file ships no CSS and a
 * consumer who has the tokens gets the look without a stylesheet of its own.
 *
 * Compose atoms in the markup. Reach for a named `.{slug}` block only when the
 * layout would take six atoms to say, and define it in `atoms.css` when you do
 * - `pnpm doctor` fails on a class the stylesheet does not have.
 */
export function {pascal}({ children }: {pascal}Props): ReactNode {
	return <div className="flex col gap-3">{children}</div>;
}
