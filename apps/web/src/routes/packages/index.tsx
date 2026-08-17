import { Reveal } from "@sushindustries/ui";
import { createFileRoute, Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { listPackages } from "../../modules/content/packages/packages.catalogue";
import { pageTitle } from "../../modules/content/site.catalogue";

export const Route = createFileRoute("/packages/")({
	component: PackagesPage,
	head: () => ({
		meta: [
			{ title: pageTitle("Packages") },
			{
				name: "description",
				content: "Everything published from the sushindustries monorepo.",
			},
		],
	}),
	loader: () => ({ packages: listPackages() }),
});

function PackagesPage(): ReactNode {
	const { packages } = Route.useLoaderData();

	return (
		<section className="container" style={{ paddingBlock: "var(--s-8)" }}>
			<p className="label m-0">Packages</p>
			<h1 className="h2 mt-3 text-balance">Everything I publish</h1>
			<p className="mt-4 fg-dim max-w-prose text-pretty">
				One directory per package. The page you are reading is generated from
				each package's own manifest and README, so it cannot drift from what
				actually ships.
			</p>

			<div className="card-grid mt-7">
				{packages.map((entry, index) => (
					<Reveal key={entry.slug} delay={index * 60}>
						<Link
							to="/packages/$slug"
							params={{ slug: entry.slug }}
							className="card h-full"
						>
							{/*
							 * The scope above, the name below, and the name is the big
							 * one. Every package here is `@sushindustries/something`, so
							 * the scope is the half that distinguishes nothing and it was
							 * taking most of the line: at the widths this grid actually
							 * uses, `truncate` on the full name rendered
							 * "@sushindustries/product..." and "@sushindustries/react-p...".
							 * A card whose heading is an ellipsis where the name should be
							 * does not tell a reader what the package is.
							 */}
							<div className="flex items-baseline justify-between gap-3">
								<div className="min-w-0">
									<p className="label m-0">@sushindustries</p>
									<h2 className="h3 m-0 mt-1">{entry.slug}</h2>
								</div>
								<span className="label shrink-0">{entry.version}</span>
							</div>
							<p className="m-0 fg-dim text-sm text-pretty">
								{entry.description}
							</p>
							<code className="code mt-2">{entry.install}</code>
						</Link>
					</Reveal>
				))}
			</div>
		</section>
	);
}
