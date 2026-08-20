import type { ReactNode } from "react";
import { Icon, type IconName } from "./icon.tsx";

export interface CardProps {
	title: string;
	/** Shown top-right, in the label style. A version, a date, a count. */
	meta?: string;
	children?: ReactNode;
	/** Renders the card as a link. Omit for a plain container. */
	href?: string;
	/** Heading level, so a card can sit under the right heading. */
	as?: "h2" | "h3";
	/**
	 * A picture across the top: the image card. The card supplies the frame
	 * and the crop; the image supplies everything else, which is why there is
	 * no `variant` prop - a card with an image *is* the image variant.
	 */
	image?: string;
	/** Alt text for the image. Empty means decorative, which is the default. */
	imageAlt?: string;
	/** A glyph on a tile beside the title: the category card. */
	icon?: IconName;
	/** Colour family for the icon tile, resolved by the stylesheet. */
	tone?: string;
}

/*
 * A card. Title, optional meta, whatever you put inside it - and two shapes
 * it grows into from props rather than from a variant enum:
 *
 *   image  a picture across the top, cropped to a fixed ratio so a grid of
 *          them holds a line whatever was uploaded
 *   icon   a toned glyph tile beside the title - the category card, wearing
 *          the same tone pairs the nav and the archive already use
 *
 * The heading level is a prop rather than a fixed `h3` because a card's
 * position in the document outline is the page's business, not the card's -
 * and getting it wrong is one of the few styling mistakes a screen reader
 * actually punishes.
 */
export function Card({
	title,
	meta,
	children,
	href,
	as: Heading = "h3",
	image,
	imageAlt = "",
	icon,
	tone,
}: CardProps): ReactNode {
	const external = href?.startsWith("http") ?? false;

	const body = (
		<>
			{image ? (
				<img className="card-media" src={image} alt={imageAlt} loading="lazy" />
			) : null}
			<div className="flex items-center justify-between gap-3">
				<span className="flex items-center gap-2 min-w-0">
					{icon ? (
						<span className="card-icon" data-tone={tone}>
							<Icon name={icon} size={14} />
						</span>
					) : null}
					<Heading className="h3 m-0 min-w-0 truncate">{title}</Heading>
				</span>
				{meta ? <span className="label shrink-0">{meta}</span> : null}
			</div>
			{children}
		</>
	);

	if (!href) {
		return (
			<article className="card" data-media={image ? "true" : undefined}>
				{body}
			</article>
		);
	}

	return (
		<a
			className="card"
			data-media={image ? "true" : undefined}
			href={href}
			target={external ? "_blank" : undefined}
			rel={external ? "noopener noreferrer" : undefined}
		>
			{body}
		</a>
	);
}
