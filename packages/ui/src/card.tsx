import type { ReactNode } from "react";

export interface CardProps {
	title: string;
	/** Shown top-right, in the label style. A version, a date, a count. */
	meta?: string;
	children?: ReactNode;
	/** Renders the card as a link. Omit for a plain container. */
	href?: string;
	/** Heading level, so a card can sit under the right heading. */
	as?: "h2" | "h3";
}

/*
 * A card. Title, optional meta, whatever you put inside it.
 *
 * The heading level is a prop rather than a fixed `h3` because a card's
 * position in the document outline is the page's business, not the card's —
 * and getting it wrong is one of the few styling mistakes a screen reader
 * actually punishes.
 */
export function Card({
	title,
	meta,
	children,
	href,
	as: Heading = "h3",
}: CardProps): ReactNode {
	const external = href?.startsWith("http") ?? false;

	const body = (
		<>
			<div className="flex items-center justify-between gap-3">
				<Heading className="h3 m-0 min-w-0 truncate">{title}</Heading>
				{meta ? <span className="label shrink-0">{meta}</span> : null}
			</div>
			{children}
		</>
	);

	if (!href) return <article className="card">{body}</article>;

	return (
		<a
			className="card"
			href={href}
			target={external ? "_blank" : undefined}
			rel={external ? "noopener noreferrer" : undefined}
		>
			{body}
		</a>
	);
}
