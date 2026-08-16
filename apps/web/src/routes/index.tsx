import { Credit, Reveal, Section } from "@sushindustries/ui";
import { createFileRoute, Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { LogoModel } from "../modules/chrome/logo-model";
import { SiteShelf } from "../modules/chrome/site-shelf";
import { CREDITS } from "../modules/content/credits";
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

				<LogoModel />
			</section>

			<Section id="shelf" label="Everything" title="Open a folder">
				<p className="fg-dim max-w-prose text-pretty m-0 mb-6">
					Every page on this site, on a desktop. Scroll and the lid opens. Open
					a folder to look inside. Right-click anything, or hold it on a touch
					screen, or press the dots - all three open the same menu.
				</p>

				<SiteShelf />
			</Section>

			<Section id="packages" label="Packages" title="Things I made">
				<PackageCards packages={packages} />

				<Link to="/packages" className="label mt-6 block">
					All packages →
				</Link>
			</Section>

			<Section id="built-on" label="Built on" title="Things I did not make">
				<p className="fg-dim max-w-prose text-pretty m-0">
					This site runs on other people's work. Everything below is theirs, not
					mine.
				</p>

				<div className="credit-grid mt-6">
					{CREDITS.map((credit) => (
						<Credit key={credit.href} {...credit} />
					))}
				</div>
			</Section>

			<Section id="socials" label="Socials" title="Where to find me">
				<div className="flex gap-3 wrap">
					<a
						className="card"
						href="https://github.com/sushindustries"
						target="_blank"
						rel="noopener noreferrer"
					>
						<h3 className="h3 m-0">GitHub</h3>
					</a>
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
