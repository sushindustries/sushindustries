import type { ReactNode } from "react";

/**
 * One thing prose can point at: a component, a package, a route. `meta` is the
 * quiet third line - a package name, an install id, a category.
 */
export interface Reference {
	readonly title: string;
	readonly href: string;
	readonly summary: string;
	readonly meta?: string;
}

/**
 * The mentions a document can resolve, keyed by the exact inline-code text
 * that names them - typically both the title (`Showcase`) and the install id
 * (`showcase`) point at the same entry.
 */
export type ReferenceMap = Readonly<Record<string, Reference>>;

export interface RefProps {
	reference: Reference;
	children: ReactNode;
}

/*
 * A mention, made walkable.
 *
 * The link is the mention itself and the card is its preview: title, summary,
 * meta, raised on hover or focus by CSS alone. No JavaScript positions it and
 * none opens it, which is what lets a page full of references cost nothing at
 * hydration - the card is server markup that a stylesheet reveals.
 *
 * Everything is a `<span>` because a reference lives inside a paragraph, and
 * a `<div>` inside a `<p>` is markup the parser will relocate.
 */
export function Ref({ reference, children }: RefProps): ReactNode {
	return (
		<span className="ref">
			<a className="ref-link" href={reference.href}>
				{children}
			</a>
			<span className="ref-card" role="note">
				<span className="flex items-center gap-2 font-semibold text-sm">
					{reference.title}
				</span>
				<span className="block mt-1 text-sm fg-dim text-pretty">
					{reference.summary}
				</span>
				{reference.meta ? (
					<span className="block mt-2 mono text-xs fg-faint">
						{reference.meta}
					</span>
				) : null}
			</span>
		</span>
	);
}
