import type { ReactNode } from "react";

export interface CreditProps {
	/** The project's own name, spelled the way its authors spell it. */
	name: string;
	/** Who made it. Shown so authorship is never ambiguous. */
	by: string;
	/** The project's own home. Opens in a new tab, since it leaves this site. */
	href: string;
	/** What it does *here*. One line, present tense. */
	role: string;
	/**
	 * The project's own mark, as an image URL. Their drawing, not a redraw -
	 * a dependency's logo is quotation, and quotations are not paraphrased.
	 */
	logo?: string;
	/** Where the documentation lives, when it is not the `href` itself. */
	docs?: string;
}

/*
 * A dependency, credited.
 *
 * This exists because a portfolio that lists what it is built with, in the
 * same visual language as what it built, quietly takes credit for both. The
 * author line is not decoration - it is the part that makes the distinction
 * legible, so it is required rather than optional.
 *
 * The card is an anchor and the docs chip is another anchor, so the chip
 * stops the card's navigation with `stopPropagation`-free nesting: it is a
 * sibling in markup, laid over the corner, because an `<a>` inside an `<a>`
 * is markup the parser will unnest.
 */
export function Credit({
	name,
	by,
	href,
	role,
	logo,
	docs,
}: CreditProps): ReactNode {
	return (
		<span className="credit-slot">
			<a
				className="credit"
				href={href}
				target="_blank"
				rel="noopener noreferrer"
				title={`${name} - ${by}`}
			>
				{/*
				 * Both halves can lose: the name keeps priority, the author line
				 * truncates first. `shrink-0` on the author was how "Tanner Linsley
				 * and contributors" walked out of the card - a flex child that may
				 * not shrink wins against the box that contains it.
				 */}
				{/*
				 * The name never truncates; the author line does. "Vite" reduced to
				 * "V…" beside a fully spelled "Evan You and contributors" is the
				 * card mis-ranking its own content.
				 */}
				<span className="flex items-center justify-between gap-3">
					<span className="flex items-center gap-2 shrink-0">
						{logo ? (
							<img className="credit-logo" src={logo} alt="" loading="lazy" />
						) : null}
						<span className="font-semibold">{name}</span>
					</span>
					<span className="label min-w-0 truncate">{by}</span>
				</span>
				<span className="fg-faint text-sm">{role}</span>
			</a>

			{docs ? (
				<a
					className="copy-btn credit-docs"
					data-ground="paper"
					href={docs}
					target="_blank"
					rel="noopener noreferrer"
				>
					Docs
				</a>
			) : null}
		</span>
	);
}
