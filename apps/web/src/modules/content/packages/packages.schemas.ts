/*
 * Client-safe shapes. No filesystem, no driver, no secrets — a route, a card
 * and a loader all import from here.
 */

export interface PackageSummary {
	/** Directory name under `packages/`. The id everything else joins on. */
	readonly slug: string;
	/** The published name, e.g. `@sushindustries/atoms`. */
	readonly name: string;
	readonly version: string;
	readonly description: string;
	readonly keywords: readonly string[];
	/** The command that installs it. Shown on the card and on the page. */
	readonly install: string;
}

export interface PackageDoc extends PackageSummary {
	/** Raw README markdown. Rendered with TanStack Markdown. */
	readonly readme: string;
}
