import type { ReferenceMap } from "@sushindustries/ui";
import { listRegistry } from "../registry/registry.catalogue";
import { listPackages } from "./packages/packages.catalogue";

/*
 * What a document may mention, built from what actually exists.
 *
 * Every registry item and every published package becomes a reference, keyed
 * by the ways prose actually names it: the title (`Showcase`), the install id
 * (`showcase`), and for packages the full specifier
 * (`@sushindustries/product-viewer`). A mention in any Markdown on this site
 * then renders as a link wearing a hover card - the component's own
 * description, from the same registry entry the install commands come from.
 *
 * Built once at module scope. Both sources are compile-time catalogues, so
 * this is a map over data the bundle already contains - not a request.
 */
function build(): ReferenceMap {
	const references: Record<
		string,
		{ title: string; href: string; summary: string; meta?: string }
	> = {};

	for (const item of listRegistry()) {
		const reference = {
			title: item.title,
			href: `/components/${item.name}`,
			summary: item.description,
			meta: `@sushindustries/ui · ${item.category}`,
		};

		references[item.title] = reference;
		references[item.name] = reference;
	}

	for (const pkg of listPackages()) {
		const reference = {
			title: pkg.name,
			href: `/packages/${pkg.slug}`,
			summary: pkg.description,
			meta: "package",
		};

		references[pkg.name] = reference;
		references[pkg.slug] = reference;
	}

	return references;
}

export const REFERENCES: ReferenceMap = build();
