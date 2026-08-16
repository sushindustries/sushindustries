import type { PackageDoc, PackageSummary } from "./packages.schemas";

/*
 * The catalogue, built from the workspace itself.
 *
 * `import.meta.glob(..., { eager: true })` inlines every package's manifest and
 * README at build time, so the deployed server needs no filesystem access and
 * no database to render a package page. Adding a package to `packages/` adds
 * it to the site; there is no list to maintain and nothing to keep in sync.
 *
 * This is deliberately not a server function. The content is public, static,
 * and identical for every visitor — routing it through RPC would add a network
 * round trip to something the bundler can answer for free.
 */

interface RawManifest {
	name?: string;
	version?: string;
	description?: string;
	keywords?: string[];
	private?: boolean;
}

const MANIFESTS = import.meta.glob<RawManifest>(
	"../../../../../../packages/*/package.json",
	{ eager: true, import: "default" },
);

const READMES = import.meta.glob<string>(
	"../../../../../../packages/*/README.md",
	{ eager: true, import: "default", query: "?raw" },
);

/** `.../packages/<slug>/package.json` -> `<slug>` */
function slugFromPath(path: string): string {
	return path.split("/").at(-2) ?? "";
}

function toDoc(path: string, manifest: RawManifest): PackageDoc | undefined {
	const slug = slugFromPath(path);
	const name = manifest.name;

	// A package with no name is not publishable, so it is not showable either.
	if (!slug || !name || manifest.private) return undefined;

	const readmePath = path.replace("/package.json", "/README.md");

	return {
		slug,
		name,
		version: manifest.version ?? "0.0.0",
		description: manifest.description ?? "",
		keywords: manifest.keywords ?? [],
		install: `pnpm add ${name}`,
		readme: READMES[readmePath] ?? "",
	};
}

const CATALOGUE: readonly PackageDoc[] = Object.entries(MANIFESTS)
	.map(([path, manifest]) => toDoc(path, manifest))
	.filter((entry): entry is PackageDoc => entry !== undefined)
	.sort((a, b) => a.name.localeCompare(b.name));

export function listPackages(): readonly PackageSummary[] {
	return CATALOGUE;
}

export function findPackage(slug: string): PackageDoc | undefined {
	return CATALOGUE.find((entry) => entry.slug === slug);
}
