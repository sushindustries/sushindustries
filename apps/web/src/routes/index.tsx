import { Card, Reveal, ScrollSpin, Section } from "@sushindustries/ui";
import { createFileRoute, Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { PlaceholderMark } from "../modules/chrome/placeholder-mark";
import { listPackages } from "../modules/content/packages/packages.catalogue";
import type { PackageSummary } from "../modules/content/packages/packages.schemas";

export const Route = createFileRoute("/")({
	component: Home,
	loader: () => ({ packages: listPackages() }),
});

function Home(): ReactNode {
	const { packages } = Route.useLoaderData();

	return (
		<>
			<section className="container hero">
				<div>
					<h1 className="h1 text-balance">Sushindustries</h1>
					<p className="mt-5 text-lg fg-dim max-w-sm text-pretty">
						Check what I am building. Small packages, made to be used.
					</p>
				</div>

				<ScrollSpin>
					<PlaceholderMark />
				</ScrollSpin>
			</section>

			<Section id="tools" label="Tools" title="Things you run">
				<div className="card-grid">
					<Card title="sushindustries">
						<p className="m-0 fg-dim text-sm text-pretty">
							A Claude Code plugin. Vault, docs, stack and pipeline in one
							install.
						</p>
						<code className="code mt-2">
							claude plugin install sushindustries
						</code>
					</Card>
				</div>
			</Section>

			<Section id="packages" label="Packages" title="Things you install">
				<PackageCards packages={packages} />

				<Link to="/packages" className="label mt-6 block">
					All packages →
				</Link>
			</Section>

			<Section id="socials" label="Socials" title="Where to find me">
				<div className="flex gap-3 wrap">
					<Card title="GitHub" href="https://github.com/sushindustries" />
				</div>
			</Section>
		</>
	);
}

function PackageCards({
	packages,
}: {
	packages: readonly PackageSummary[];
}): ReactNode {
	return (
		<div className="card-grid">
			{packages.map((entry, index) => (
				<Reveal key={entry.slug} delay={index * 60}>
					<Link
						to="/packages/$slug"
						params={{ slug: entry.slug }}
						className="card h-full"
					>
						<div className="flex items-center justify-between gap-3">
							<h3 className="h3 m-0 min-w-0 truncate">{entry.name}</h3>
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
	);
}
