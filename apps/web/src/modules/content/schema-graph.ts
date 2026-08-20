import { SITE } from "./site.catalogue";

/*
 * The net, rather than a pile of loose JSON-LD.
 *
 * Most sites emit structured data as unrelated blobs: a BreadcrumbList here, a
 * SoftwareSourceCode there, a Person nobody links to. Each one validates, and
 * together they say nothing - a crawler cannot tell that the person who wrote
 * the article is the person who publishes the site, because neither node has a
 * name it can be referred to by.
 *
 * The fix is identity. Every node here gets a stable `@id`, and every
 * relationship is a reference to one rather than a copy of it, so the page's
 * nodes form a graph something can actually walk: the review points at the
 * thing reviewed, the thing points at the page it is on, the page points at
 * the site, the site points at the person. That is what makes it navigable
 * instead of merely present.
 *
 * The ids are URLs with fragments, which is the convention search engines
 * already follow, and they are derived rather than written down - so a node
 * emitted by a Markdown block on a page it knows nothing about still lands on
 * the same identifier as the one the route emits.
 */

/** The site as a publication. One per site, referenced from every page. */
export const WEBSITE_ID = `${SITE.url}/#website`;

/** Me. The author and publisher behind everything here. */
export const PERSON_ID = `${SITE.url}/#person`;

/** The page being read. One per path. */
export function pageId(path: string): string {
	return `${SITE.url}${path}#webpage`;
}

/**
 * The thing a page is primarily about: a component, a package, a video.
 *
 * Separate from the page's own id because they are different things, and
 * collapsing them is the mistake that makes a review of a component look like
 * a review of a web page.
 */
export function entityId(path: string): string {
	return `${SITE.url}${path}#entity`;
}

/** A reference to another node, which is all a relationship ever needs to be. */
export function ref(id: string): { "@id": string } {
	return { "@id": id };
}

export function personNode(): object {
	return {
		"@type": "Person",
		"@id": PERSON_ID,
		name: SITE.name,
		url: SITE.url,
		description: SITE.description,
		sameAs: [SITE.github],
	};
}

export function webSiteNode(): object {
	return {
		"@type": "WebSite",
		"@id": WEBSITE_ID,
		url: SITE.url,
		name: SITE.name,
		description: SITE.description,
		inLanguage: "en",
		// One person is both, and the reference says so once rather than
		// describing them twice and hoping the two copies agree.
		publisher: ref(PERSON_ID),
		author: ref(PERSON_ID),
	};
}

export interface ReviewFields {
	/** What is being reviewed. An id, so the review joins the net. */
	readonly about: string;
	readonly author: string;
	readonly rating?: number;
	readonly body?: string;
	readonly datePublished?: string;
}

/**
 * A review, attached to the thing it is about.
 *
 * `itemReviewed` is a reference rather than an inline copy of the thing, which
 * is the difference between "somebody reviewed this component" and "somebody
 * reviewed a component with the same name".
 */
export function reviewNode(review: ReviewFields, index: number): object {
	return {
		"@type": "Review",
		"@id": `${review.about}-review-${index}`,
		itemReviewed: ref(review.about),
		author: { "@type": "Person", name: review.author },
		...(review.body ? { reviewBody: review.body } : {}),
		...(review.datePublished ? { datePublished: review.datePublished } : {}),
		...(review.rating
			? {
					reviewRating: {
						"@type": "Rating",
						ratingValue: review.rating,
						bestRating: 5,
						worstRating: 1,
					},
				}
			: {}),
	};
}

/** Drops the keys nothing filled in, so a node never publishes a null. */
export function compact<T extends object>(node: T): T {
	return Object.fromEntries(
		Object.entries(node).filter(
			([, value]) => value !== undefined && value !== null && value !== "",
		),
	) as T;
}

/**
 * One `@graph` document.
 *
 * Emitting the nodes together lets a consumer resolve every reference without
 * fetching anything, and `@context` is stated once rather than on each node.
 */
export function graph(nodes: readonly object[]): object {
	return {
		"@context": "https://schema.org",
		"@graph": nodes.map((node) => compact(node)),
	};
}
