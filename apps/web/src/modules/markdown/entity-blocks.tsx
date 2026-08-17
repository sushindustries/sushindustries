import { Icon, type MarkdownBlockProps } from "@sushindustries/ui";
import { useRouterState } from "@tanstack/react-router";
import type { ReactNode } from "react";
import {
	compact,
	entityId,
	graph,
	pageId,
	personNode,
	ref,
	reviewNode,
} from "../content/schema-graph";

/*
 * People and reviews, written in Markdown and joined to the page's net.
 *
 * These are the two entity types a page most often needs and least often has:
 * a quote from somebody is rendered as a blockquote and published as nothing,
 * so the person who said it is invisible to anything reading the page as data.
 *
 * Each block does both halves at once. It renders what the reader sees, and it
 * emits one node whose relationships are references into the same graph the
 * route builds - `itemReviewed` points at the page's entity id, the author
 * points at the site's Person - so the structured data is connected by
 * construction rather than by an author remembering to repeat an identifier.
 *
 * The visible half is the point of doing it here rather than in frontmatter:
 * structured data that describes something the page does not show is the one
 * thing Google actually penalises, and a block cannot drift from its own
 * output.
 */

/** One `<script type="application/ld+json">`, next to what it describes. */
function LdScript({ data }: { data: object }): ReactNode {
	return (
		<script
			type="application/ld+json"
			// biome-ignore lint/security/noDangerouslySetInnerHtml: a JSON-LD body is data, and this is JSON.stringify output rather than anything an author wrote.
			dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
		/>
	);
}

/** The path the block is being rendered on. Blocks are told nothing else. */
function usePath(): string {
	return useRouterState({ select: (state) => state.location.pathname });
}

/*
 *   <!-- ::start:person name="Ada" role="Reviewer" url="https://..." -->
 *   <!-- ::end:person -->
 *
 * `self="true"` means me - the node becomes a reference to the site's own
 * Person rather than a second Person with the same name, which is exactly the
 * duplicate that makes an entity graph useless.
 */
export function PersonBlock({
	attributes,
	children,
}: MarkdownBlockProps): ReactNode {
	const path = usePath();
	const isSelf = attributes.self === "true";
	const name = attributes.name || "Someone";

	const node = isSelf
		? { ...personNode(), mainEntityOfPage: ref(pageId(path)) }
		: compact({
				"@type": "Person",
				"@id": `${entityId(path)}-person-${encodeURIComponent(name)}`,
				name,
				jobTitle: attributes.role,
				url: attributes.url,
				description: attributes.summary,
			});

	return (
		<div className="flex items-center gap-3 mt-5">
			{attributes.image ? (
				<img
					className="avatar"
					src={attributes.image}
					alt={name}
					loading="lazy"
				/>
			) : (
				<span className="tile" data-tone="docs">
					<Icon name="sushi" size={14} />
				</span>
			)}

			<span className="min-w-0">
				<span className="block font-medium">{name}</span>
				{attributes.role ? (
					<span className="block label">{attributes.role}</span>
				) : null}
				{children}
			</span>

			<LdScript data={graph([node])} />
		</div>
	);
}

/*
 *   <!-- ::start:review author="Ada" rating="5" -->
 *   What they said.
 *   <!-- ::end:review -->
 *
 * `about` defaults to the page's own entity, which is the case that is almost
 * always meant: a review on a component's page is a review of that component.
 */
export function ReviewBlock({
	attributes,
	children,
}: MarkdownBlockProps): ReactNode {
	const path = usePath();
	const about = attributes.about || entityId(path);
	const rating = Number(attributes.rating);
	const stars =
		Number.isFinite(rating) && rating >= 1 && rating <= 5 ? rating : 0;

	const node = reviewNode(
		{
			about,
			author: attributes.author || "A reader",
			rating: stars || undefined,
			body: attributes.body,
			datePublished: attributes.date,
		},
		// Stable within a page: two reviews of one thing need two ids, and the
		// author's name is the only thing distinguishing them that is not an
		// accident of order.
		Math.abs(
			[...(attributes.author ?? "anon")].reduce(
				(sum, character) => sum + character.charCodeAt(0),
				0,
			),
		),
	);

	return (
		<figure className="card p-4 mt-5">
			{stars > 0 ? (
				<p className="flex items-center gap-1 m-0">
					{/* The glyphs are the rating; this is the same fact for a
					    reader who is hearing the page rather than seeing it. */}
					<span className="sr-only">{`Rated ${stars} out of 5`}</span>
					{Array.from({ length: stars }, (_, index) => (
						<Icon
							// biome-ignore lint/suspicious/noArrayIndexKey: five identical glyphs with no identity of their own.
							key={index}
							name="star"
							size={13}
						/>
					))}
				</p>
			) : null}

			<blockquote className="m-0 mt-2">{children}</blockquote>

			<figcaption className="label mt-3">
				{attributes.author || "A reader"}
				{attributes.date ? ` · ${attributes.date}` : ""}
			</figcaption>

			<LdScript data={graph([node])} />
		</figure>
	);
}
