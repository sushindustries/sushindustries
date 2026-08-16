import { MarkdownView } from "@sushindustries/ui";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { findPackage } from "../../modules/content/packages/packages.catalogue";

/*
 * Kept as a flat route file rather than a `$slug/` directory. Converting a
 * dynamic segment to a route directory breaks matching — the URL starts
 * 404ing and the trailing-slash form redirects to the dead one.
 */
export const Route = createFileRoute("/packages/$slug")({
	component: PackagePage,
	loader: ({ params }) => {
		const entry = findPackage(params.slug);
		if (!entry) throw notFound();

		return { entry };
	},
	head: ({ loaderData }) => ({
		meta: [
			{ title: `${loaderData?.entry.name ?? "Package"} — Sushindustries` },
			{ name: "description", content: loaderData?.entry.description ?? "" },
		],
	}),
});

function PackagePage(): ReactNode {
	const { entry } = Route.useLoaderData();

	return (
		<article className="container" style={{ paddingBlock: "var(--s-8)" }}>
			<Link to="/packages" className="label">
				← Packages
			</Link>

			<header className="mt-5">
				<div className="flex items-center gap-3 wrap">
					<h1 className="h2 m-0">{entry.name}</h1>
					<span className="label">{entry.version}</span>
				</div>
				<p className="mt-3 fg-dim max-w-prose text-pretty">
					{entry.description}
				</p>
				<code className="code mt-5 max-w-prose">{entry.install}</code>
			</header>

			<div className="mt-7">
				<MarkdownView source={entry.readme} />
			</div>
		</article>
	);
}
