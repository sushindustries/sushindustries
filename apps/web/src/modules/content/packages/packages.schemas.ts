/*
 * Client-safe shapes. No filesystem, no driver, no secrets - a route, a card
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
	/** Raw README markdown, exactly as it ships. What "Copy page" copies. */
	readonly readme: string;
	/**
	 * The README without its `# name` line, for rendering on the package page.
	 * The page supplies its own h1, and a document with two is a document with
	 * none - the outline check fails it and a screen reader announces both.
	 */
	readonly body: string;
}
