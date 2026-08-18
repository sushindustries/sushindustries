import {
	REGISTRY_CATEGORIES,
	REGISTRY_ITEMS,
	type RegistryItem,
} from "@sushindustries/ui/registry";

/*
 * One source, two installers.
 *
 * Every component is published twice: once as a shadcn registry item and once
 * as a TanStack CLI add-on. Nothing is duplicated to make that work - the
 * source stays in `packages/ui/src`, and this renders whichever shape was
 * asked for.
 *
 * They are not redundant. shadcn copies files and installs bare dependency
 * names, resolving whatever npm offers that day. A TanStack add-on writes
 * `packageAdditions` straight into package.json, so it must state versions -
 * and it can declare things shadcn cannot.
 *
 * Both formats are validated against their real published schemas, not against
 * a reading of the docs. For TanStack that is `AddOnCompiledSchema` from
 * `@tanstack/create`: `type` and `phase` are required enums, and `deletedFiles`
 * is required even though adding a component deletes nothing.
 */

const SOURCES = import.meta.glob<string>("../../../../../packages/ui/src/*", {
	eager: true,
	import: "default",
	query: "?raw",
});

const ATOM_SOURCES = import.meta.glob<string>(
	"../../../../../packages/atoms/src/**/*.css",
	{ eager: true, import: "default", query: "?raw" },
);

/*
 * The whole stylesheet, as one string.
 *
 * Every component in this registry styles itself with class names that live
 * in `@sushindustries/atoms`, so a copied file without the stylesheet is a
 * component that renders unstyled and says nothing about why. The npm route
 * ships the CSS as a package; the copy-paste route has to carry it along.
 *
 * `atoms.css` is an @import manifest, and an installer writes one file, not
 * a tree - so the imports are resolved here, each replaced by the file it
 * names, in the order the manifest declares. Order is the cascade: tokens
 * before base before blocks is not decoration.
 */
function bundledAtomsCss(): string {
	const prefix = "../../../../../packages/atoms/src/";
	const manifest = ATOM_SOURCES[`${prefix}atoms.css`] ?? "";

	return manifest.replace(
		/@import\s+"\.\/([^"]+)"(?:\s+layer\(([\w-]+)\))?;/g,
		(_, file: string, layer: string | undefined) => {
			const source = ATOM_SOURCES[`${prefix}${file}`] ?? "";

			// `@import "x" layer(blocks)` assigns the file to a layer; the
			// inlined equivalent is the same content wrapped in that layer,
			// or the cascade order the manifest encodes quietly breaks.
			return layer ? `@layer ${layer} {\n${source}\n}` : source;
		},
	);
}

/** Where a copied file lands in the consumer's project. */
function targetPath(file: string): string {
	return `src/components/sushindustries/${file}`;
}

function readSource(file: string): string {
	const key = `../../../../../packages/ui/src/${file}`;
	return SOURCES[key] ?? "";
}

function filesFor(item: RegistryItem): Record<string, string> {
	const out: Record<string, string> = {};

	for (const file of item.files) {
		const source = readSource(file);
		if (source) out[targetPath(file)] = source;
	}

	return out;
}

export interface ShadcnItem {
	$schema: string;
	name: string;
	type: "registry:component" | "registry:style";
	title: string;
	description: string;
	docs?: string;
	dependencies?: string[];
	registryDependencies?: string[];
	files: Array<{
		path: string;
		content: string;
		type: "registry:component" | "registry:file";
		target?: string;
	}>;
}

/*
 * The stylesheet as a registry item of its own.
 *
 * Every component's shadcn payload depends on this by URL, so `shadcn add`
 * fetches the CSS with the first component and writes it once -
 * `registry:file` because it carries an explicit target, and shadcn skips a
 * file it has already written byte-identically. The `docs` string is what
 * the CLI prints after installing: the one manual step, said at the moment
 * it applies.
 */
export function atomsAsShadcn(): ShadcnItem {
	return {
		$schema: "https://ui.shadcn.com/schema/registry-item.json",
		name: "atoms",
		type: "registry:style",
		title: "Atoms",
		description:
			"The design tokens and atomic classes every component here styles itself with. One file, no build step.",
		docs: "Import src/sushindustries/atoms.css once, at your app's root.",
		files: [
			{
				path: "sushindustries/atoms.css",
				content: bundledAtomsCss(),
				type: "registry:file",
				target: "src/sushindustries/atoms.css",
			},
		],
	};
}

export function toShadcn(item: RegistryItem, origin: string): ShadcnItem {
	return {
		$schema: "https://ui.shadcn.com/schema/registry-item.json",
		name: item.name,
		type: "registry:component",
		title: item.title,
		description: item.description,

		// shadcn resolves versions itself, so these are bare names by design.
		dependencies: Object.keys(item.dependencies),

		// A registry dependency is a URL so it resolves without our registry
		// being configured in the consumer's components.json. The stylesheet
		// rides on every item: it is where all the class names point, and
		// shadcn deduplicates a file it has already written.
		registryDependencies: [
			...(item.registryDependencies ?? []).map(
				(name) => `${origin}/r/shadcn/${name}.json`,
			),
			`${origin}/r/shadcn/atoms.json`,
		],

		files: Object.entries(filesFor(item)).map(([path, content]) => ({
			path,
			content,
			type: "registry:component",
		})),
	};
}

export interface TanStackAddOn {
	id: string;
	name: string;
	/** The element's own version, from its registry entry. */
	version: string;
	description: string;
	type: "add-on";
	phase: "add-on";
	category: "styling";
	modes: string[];
	link: string;
	packageAdditions: { dependencies?: Record<string, string> };
	files: Record<string, string>;
	/** Required by the schema, and always empty: adding a component removes nothing. */
	deletedFiles: string[];
	dependsOn?: string[];
}

export function toTanStackAddOn(
	item: RegistryItem,
	origin: string,
): TanStackAddOn {
	const addOn: TanStackAddOn = {
		id: item.name,
		name: item.title,
		version: item.version,
		description: item.description,
		type: "add-on",
		phase: "add-on",
		category: "styling",
		modes: ["file-router"],
		link: `${origin}/components/${item.name}`,
		packageAdditions:
			Object.keys(item.dependencies).length > 0
				? { dependencies: { ...item.dependencies } }
				: {},
		files: filesFor(item),
		deletedFiles: [],
	};

	if (item.registryDependencies?.length) {
		addOn.dependsOn = [...item.registryDependencies];
	}

	return addOn;
}

/*
 * The shadcn index: what makes this a *registry* rather than a pile of item
 * URLs. A consumer adds one line to components.json -
 *
 *   "registries": { "@adamjurek": "<origin>/r/shadcn/{name}.json" }
 *
 * - and installs by name: `pnpm dlx shadcn@latest add @adamjurek/consent`.
 * The index itself lists names and metadata only; file contents stay in the
 * per-item responses, because an index that inlines sixty-eight components'
 * sources is a download nobody asked for.
 */
export function toShadcnIndex(origin: string): {
	$schema: string;
	name: string;
	homepage: string;
	items: Array<{
		name: string;
		type: "registry:component" | "registry:style";
		title: string;
		description: string;
		files: Array<{ path: string; type: string }>;
	}>;
} {
	return {
		$schema: "https://ui.shadcn.com/schema/registry.json",
		name: "adamjurek",
		homepage: origin,
		items: [
			{
				name: "atoms",
				type: "registry:style",
				title: "Atoms",
				description:
					"The design tokens and atomic classes every component here styles itself with.",
				files: [{ path: "sushindustries/atoms.css", type: "registry:file" }],
			},
			...listRegistry()
				.filter((item) => item.access !== "pro")
				.map((item) => ({
					name: item.name,
					type: "registry:component" as const,
					title: item.title,
					description: item.description,
					files: item.files.map((file) => ({
						path: `src/components/sushindustries/${file}`,
						type: "registry:component",
					})),
				})),
		],
	};
}

/** The index `tanstack create --add-ons <url>` and `CTA_REGISTRY` read. */
export function toRegistryIndex(origin: string): {
	"add-ons": Array<{
		name: string;
		description: string;
		url: string;
		modes: string[];
		framework: string;
	}>;
} {
	return {
		"add-ons": REGISTRY_ITEMS.map((item) => ({
			name: item.title,
			description: item.description,
			url: `${origin}/r/tanstack/${item.name}.json`,
			modes: ["file-router"],
			framework: "react",
		})),
	};
}

/*
 * Sorted once, at module scope: category in the order the taxonomy declares
 * them, title A-Z within one. The registry file itself is append-ordered -
 * whatever was built last is last - and serving that order meant the archive,
 * the API and the search all showed sixty-two items in the order of their
 * commit history, which reads as no order at all.
 */
const CATEGORY_RANK = new Map(
	REGISTRY_CATEGORIES.map((category, index) => [category.id, index]),
);

const SORTED_ITEMS: readonly RegistryItem[] = [...REGISTRY_ITEMS].sort(
	(a, b) =>
		(CATEGORY_RANK.get(a.category) ?? 99) -
			(CATEGORY_RANK.get(b.category) ?? 99) || a.title.localeCompare(b.title),
);

export function listRegistry(): readonly RegistryItem[] {
	return SORTED_ITEMS;
}

export function findRegistryItem(name: string): RegistryItem | undefined {
	return REGISTRY_ITEMS.find((item) => item.name === name);
}
