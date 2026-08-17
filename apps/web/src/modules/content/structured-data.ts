import type { RegistryItem } from "@sushindustries/ui/registry";
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
 * Breadcrumbs carry the full depth of where a thing lives: a component is
 * Home > Components > <Category> > <Title>, not a flat two-crumb trail. The
 * category crumb links to the filtered archive, which is a real page.
 */

interface Crumb {
	readonly name: string;
	readonly path: string;
}

export function breadcrumbs(crumbs: readonly Crumb[]): object {
	return {
		"@context": "https://schema.org",
		"@type": "BreadcrumbList",
		itemListElement: crumbs.map((crumb, index) => ({
			"@type": "ListItem",
			position: index + 1,
			name: crumb.name,
			item: `${SITE.url}${crumb.path}`,
		})),
	};
}

export function componentCrumbs(
	item: { category: string } | undefined,
	title: string,
	slug: string,
): readonly Crumb[] {
	return [
		{ name: SITE.name, path: "/" },
		{ name: "Components", path: "/components" },
		...(item
			? [
					{
						name: item.category,
						path: `/components?category=${item.category}`,
					},
				]
			: []),
		{ name: title, path: `/components/${slug}` },
	];
}

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
		codeRepository: "https://github.com/sushindustries/sushindustries",
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
		codeRepository: "https://github.com/sushindustries/sushindustries",
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
