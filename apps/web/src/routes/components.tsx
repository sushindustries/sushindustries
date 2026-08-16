import { Reveal } from "@sushindustries/ui";
import { createFileRoute } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { listRegistry } from "../modules/registry/registry.catalogue";

export const Route = createFileRoute("/components")({
	component: ComponentsPage,
	head: () => ({
		meta: [
			{ title: "Components — Sushindustries" },
			{
				name: "description",
				content:
					"Every element on this site, installable with the TanStack CLI or shadcn.",
			},
		],
	}),
	loader: () => ({ items: listRegistry() }),
});

function ComponentsPage(): ReactNode {
	const { items } = Route.useLoaderData();

	return (
		<section className="container" style={{ paddingBlock: "var(--s-8)" }}>
			<p className="label m-0">Components</p>
			<h1 className="h2 mt-3 text-balance">
				Everything on this page, installable
			</h1>
			<p className="mt-4 fg-dim max-w-prose text-pretty">
				The site is built from these, so what you install is what you are
				looking at. Take the whole package, or copy one component into your own
				project with either installer.
			</p>

			<div className="mt-6">
				<p className="label m-0">Add the registry once</p>
				<code className="code mt-3">
					export CTA_REGISTRY=https://sushindustries.com/r/registry.json
				</code>
			</div>

			<div className="mt-7 flex col gap-4">
				{items.map((item, index) => (
					<Reveal key={item.name} delay={index * 40}>
						<article className="card">
							<div className="flex items-center justify-between gap-3">
								<h2 className="h3 m-0 min-w-0">{item.title}</h2>
								<span className="label shrink-0">{item.name}</span>
							</div>

							<p className="m-0 fg-dim text-sm text-pretty">
								{item.description}
							</p>

							<div className="mt-2 flex col gap-2">
								<code className="code">
									tanstack add https://sushindustries.com/r/tanstack/{item.name}
									.json
								</code>
								<code className="code">
									pnpm dlx shadcn@latest add
									https://sushindustries.com/r/shadcn/{item.name}.json
								</code>
							</div>
						</article>
					</Reveal>
				))}
			</div>
		</section>
	);
}
