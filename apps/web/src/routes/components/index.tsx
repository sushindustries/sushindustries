import { Archive, type ArchiveItem, parseArchive } from "@sushindustries/ui";
import { REGISTRY_CATEGORIES } from "@sushindustries/ui/registry";
import { createFileRoute, Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import * as z from "zod";
import { listRegistry } from "../../modules/registry/registry.catalogue";
import { findDemo } from "../../modules/showcase/demos";

const searchSchema = z.object({
	category: z.string().optional(),
	tag: z.string().optional(),
});

export const Route = createFileRoute("/components/")({
	component: ComponentsPage,
	validateSearch: searchSchema,
	head: () => ({
		meta: [
			{ title: "Components - Sushindustries" },
			{
				name: "description",
				content:
					"Every element on this site, installable with the TanStack CLI or shadcn.",
			},
		],
	}),
	loader: () => {
		const items: ArchiveItem[] = listRegistry().map((item) => ({
			id: item.name,
			title: item.title,
			description: item.description,
			category: item.category,
			subcategory: item.subcategory,
			tags: [...(item.tags ?? [])],
			preview: item.preview,
			// Every registry item has a page now: hand-written when one exists,
			// generated from this entry when it does not.
			href: `/components/${item.name}`,
			// Only things with a demo can show one.
			previewSrc: findDemo(item.name)
				? `/preview/${item.name}?fit=card`
				: undefined,
		}));

		/*
		 * Parsed rather than trusted. The registry is hand-edited, and the
		 * failure this catches is silent: an item whose category nobody declared
		 * renders under no filter at all.
		 */
		return parseArchive({ categories: REGISTRY_CATEGORIES, items });
	},
});

function ComponentsPage(): ReactNode {
	const { categories, items } = Route.useLoaderData();
	const { category, tag } = Route.useSearch();

	return (
		<section className="container" style={{ paddingBlock: "var(--s-8)" }}>
			<p className="label m-0">Components</p>
			<h1 className="h2 mt-3 text-balance">
				Everything on this site, installable
			</h1>
			<p className="mt-4 fg-dim max-w-prose text-pretty">
				The site is built from these, so what you install is what you are
				looking at. Every preview below is the real component running, not a
				picture of one.
			</p>

			<div className="mt-6 max-w-prose">
				<p className="label m-0">Add the registry once</p>
				<code className="code mt-3">
					export CTA_REGISTRY=https://sushindustries.com/r/registry.json
				</code>
			</div>

			<div className="mt-7">
				<Archive
					categories={categories}
					items={items}
					active={category ?? "all"}
					activeTag={tag}
					/*
					 * Changing category drops the tag. A tag that exists in one
					 * category usually does not in the next, and carrying it over
					 * lands the reader on an empty grid they did not ask for.
					 */
					hrefForCategory={(id) =>
						id === "all" ? "/components" : `/components?category=${id}`
					}
					hrefForTag={(next) => {
						const params = new URLSearchParams();
						if (category) params.set("category", category);
						if (next) params.set("tag", next);
						const query = params.toString();
						return query ? `/components?${query}` : "/components";
					}}
					/*
					 * Typed links, built from the route pattern and its params rather
					 * than from a resolved path. Handing `Link` a finished
					 * `/components/reveal` produces an anchor with the correct href
					 * whose click is intercepted and then fails to match
					 * `/components/$slug` - the card looks like a link and does
					 * nothing, which is exactly what it was doing.
					 */
					renderLink={({ kind, id, href, className, children }) => {
						if (kind === "item") {
							return (
								<Link
									key={href}
									to="/components/$slug"
									params={{ slug: id }}
									className={className}
								>
									{children}
								</Link>
							);
						}

						// Category and tag both land on this route; only the search
						// differs, and search is an object, never part of `to`.
						const search =
							kind === "category"
								? id === "all"
									? {}
									: { category: id }
								: {
										...(category ? { category } : {}),
										...(id ? { tag: id } : {}),
									};

						return (
							<Link
								key={href}
								to="/components"
								search={search}
								className={className}
							>
								{children}
							</Link>
						);
					}}
				/>
			</div>
		</section>
	);
}
