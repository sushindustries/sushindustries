import type { RegistryItem } from "@sushindustries/ui/registry";
import { REPO_IS_PUBLIC, REPO_URL } from "./repo";
import { entityId, pageId, ref } from "./schema-graph";
import { SITE } from "./site.catalogue";

/*
 * Schema.org, rendered from the same data as the page.
 *
 * Search engines and answer engines read this instead of the layout. Every
 * builder here takes the objects the route loader already has, so the
 * structured data cannot say something the visible page does not - which is
 * both the rule Google enforces and the only honest version of the format.
 *
 * The `BreadcrumbList` itself is the `Breadcrumb` component's job now, not a
 * builder in this file - it renders the visible trail and the schema.org
 * list from the same array.
 */

/*
 * A component is source code somebody installs: `SoftwareSourceCode`, with the
 * install target and the language stated. `isPartOf` ties every component to
 * the one library, so an answer engine can say "from @sushindustries/ui"
 * without inferring it.
 */
export function componentSourceCode(item: RegistryItem): object {
	return {
		"@context": "https://schema.org",
		"@type": "SoftwareSourceCode",
		/*
		 * The id a review points at.
		 *
		 * Without it this node is anonymous, and a `Review` whose
		 * `itemReviewed` names an id nothing publishes is a dangling edge - the
		 * page reads as "somebody reviewed something" rather than "somebody
		 * reviewed this component". `#entity` rather than the page's own id
		 * because the component and the page about it are different things.
		 */
		"@id": entityId(`/components/${item.name}`),
		mainEntityOfPage: ref(pageId(`/components/${item.name}`)),
		name: item.title,
		description: item.description,
		url: `${SITE.url}/components/${item.name}`,
		programmingLanguage: "TypeScript",
		runtimePlatform: "React 19",
		/*
		 * `codeRepository` only while the repo answers. Structured data is a set
		 * of claims made to a machine that will check them, and a property whose
		 * value 404s is a claim that fails - the crawler cannot tell "private"
		 * from "wrong", so the honest move is to say nothing rather than point
		 * at a door that does not open.
		 */
		...(REPO_IS_PUBLIC ? { codeRepository: REPO_URL } : {}),
		license: "https://opensource.org/license/mit/",
		isPartOf: {
			"@type": "SoftwareApplication",
			name: "@sushindustries/ui",
			url: `${SITE.url}/components`,
			applicationCategory: "DeveloperApplication",
		},
		keywords: [item.category, ...(item.tags ?? [])].join(", "),

		/*
		 * What the element expresses, from its registry declaration.
		 *
		 * `about` rather than a second `@type`, because the two claims are
		 * different and only one of them is true: this page is source code, and
		 * the thing that source code produces is a `BreadcrumbList`. Saying the
		 * page *is* a BreadcrumbList would be a lie that validates.
		 *
		 * Omitted when the element expresses nothing beyond itself - a switch,
		 * a spinner - because `about: SoftwareSourceCode` on a page that is
		 * already SoftwareSourceCode says nothing at all.
		 */
		...(item.schema && item.schema !== "SoftwareSourceCode"
			? { about: { "@type": item.schema } }
			: {}),
	};
}

/*
 * The archive is a collection of components, so it gets `CollectionPage`
 * around an `ItemList` - the same relationship a search results page or a
 * product category page uses. Each `ListItem` names and links a component
 * without repeating its full `SoftwareSourceCode` node, which already lives
 * on that component's own page and would just be duplicated data here.
 */
export function componentsCollectionPage(
	items: readonly { title: string; href: string }[],
): object {
	return {
		"@context": "https://schema.org",
		"@type": "CollectionPage",
		"@id": entityId("/components"),
		mainEntityOfPage: ref(pageId("/components")),
		name: "Components",
		url: `${SITE.url}/components`,
		mainEntity: {
			"@type": "ItemList",
			itemListElement: items.map((item, index) => ({
				"@type": "ListItem",
				position: index + 1,
				url: `${SITE.url}${item.href}`,
				name: item.title,
			})),
		},
	};
}

export function packageApplication(pkg: {
	name: string;
	slug: string;
	description: string;
	version: string;
}): object {
	return {
		"@context": "https://schema.org",
		"@type": "SoftwareApplication",
		name: pkg.name,
		description: pkg.description,
		url: `${SITE.url}/packages/${pkg.slug}`,
		softwareVersion: pkg.version,
		applicationCategory: "DeveloperApplication",
		operatingSystem: "Any",
		offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
		/*
		 * Same rule as `codeRepository` below: the GitHub Packages page for
		 * this exact package lives under the repo, so it 404s for anyone not
		 * signed in while the repo is private. Every entry that reaches this
		 * function already passed the catalogue's private check - see
		 * packages.catalogue.ts's "not publishable, so not showable" - so
		 * this is never a claim about a package that was never published.
		 */
		...(REPO_IS_PUBLIC
			? {
					codeRepository: REPO_URL,
					downloadUrl: `${REPO_URL}/pkgs/npm/${pkg.slug}`,
				}
			: {}),
	};
}

/** One `<script type="application/ld+json">` for a route's `head.scripts`. */
export function ldScript(data: object | readonly object[]): {
	type: string;
	children: string;
} {
	return {
		type: "application/ld+json",
		children: JSON.stringify(data),
	};
}
