import type { RegistryItem } from "@sushindustries/ui/registry";
import {
	findRegistryItem,
	listRegistry,
} from "../../registry/registry.catalogue";
import {
	type ComponentDoc,
	findComponentDoc,
	listComponentDocs,
} from "./components.catalogue";

/*
 * A page for every component, whether or not anyone has written one.
 *
 * This is the pipeline's load-bearing piece. Adding a component to the registry
 * used to give you a card that linked nowhere, because the doc page only
 * existed if somebody also wrote Markdown for it - so seven of ten cards were
 * dead ends.
 *
 * Now the registry entry alone produces a real page: description, live
 * showcase, install commands, dependencies. Writing Markdown *replaces* the
 * generated Home section and adds tabs; it is an enhancement, not a
 * requirement. The generated page is deliberately good enough to ship, because
 * a placeholder nobody is embarrassed by is a placeholder that never gets
 * replaced - and that is the correct outcome for a component whose entire
 * story is "here it is, here is how to install it".
 */

export interface ComponentPage extends ComponentDoc {
	/** True when nothing was hand-written and this was built from the registry. */
	readonly generated: boolean;
	readonly item?: RegistryItem;
}

/*
 * The generated Home section, as Markdown.
 *
 * Markdown rather than JSX so it goes through exactly the same renderer as a
 * hand-written page - same callouts, same showcase block, same highlighting.
 * A second rendering path would be a second thing to keep in step.
 */
function generateHome(item: RegistryItem, hasDemo: boolean): string {
	const lines: string[] = [item.description, ""];

	if (hasDemo) {
		lines.push(`<!-- ::start:showcase demo="${item.name}" height="420" -->`);
		lines.push("<!-- ::end:showcase -->");
		lines.push("");
	}

	lines.push("## Install");
	lines.push("");
	lines.push("<!-- ::start:tabs -->");
	lines.push("");
	lines.push("### TanStack");
	lines.push("");
	lines.push("```shell");
	lines.push(
		`tanstack add https://sushindustries.com/r/tanstack/${item.name}.json`,
	);
	lines.push("```");
	lines.push("");
	lines.push("### shadcn");
	lines.push("");
	lines.push("```shell");
	lines.push(
		`pnpm dlx shadcn@latest add https://sushindustries.com/r/shadcn/${item.name}.json`,
	);
	lines.push("```");
	lines.push("");
	lines.push("### pnpm");
	lines.push("");
	lines.push("```shell");
	lines.push("pnpm add @sushindustries/ui @sushindustries/atoms");
	lines.push("```");
	lines.push("");
	lines.push("<!-- ::end:tabs -->");
	lines.push("");

	lines.push("## What you get");
	lines.push("");
	lines.push("| | |");
	lines.push("| --- | --- |");
	lines.push(`| Version | ${item.version} |`);
	lines.push(
		`| Category | ${item.category}${item.subcategory ? ` · ${item.subcategory}` : ""} |`,
	);
	lines.push(
		`| Files | ${item.files.map((file) => `\`${file}\``).join(", ")} |`,
	);

	const deps = Object.entries(item.dependencies);
	lines.push(
		`| Dependencies | ${deps.length === 0 ? "None" : deps.map(([name, version]) => `\`${name}@${version}\``).join(", ")} |`,
	);

	if (item.registryDependencies?.length) {
		lines.push(
			`| Also installs | ${item.registryDependencies.map((name) => `\`${name}\``).join(", ")} |`,
		);
	}

	if (item.tags?.length) {
		lines.push(`| Tags | ${item.tags.join(", ")} |`);
	}

	lines.push("");

	if (deps.length === 0) {
		lines.push(
			"> [!NOTE] No runtime dependencies\n> It brings nothing with it beyond the stylesheet.",
		);
	}

	return lines.join("\n");
}

export function findComponentPage(
	slug: string,
	hasDemo: (id: string) => boolean,
): ComponentPage | undefined {
	const written = findComponentDoc(slug);
	const item = findRegistryItem(slug);

	// Hand-written wins outright: if somebody wrote it, they meant it.
	if (written) return { ...written, generated: false, item };

	if (!item) return undefined;

	return {
		slug: item.name,
		title: item.title,
		summary: item.description,
		packageName: "@sushindustries/ui",
		generated: true,
		item,
		sections: [
			{
				id: "index",
				label: "Home",
				body: generateHome(item, hasDemo(item.name)),
			},
		],
	};
}

/** Every component that has a page - which is now every registry item. */
export function listComponentPages(): readonly string[] {
	const slugs = new Set(listRegistry().map((item) => item.name));
	for (const doc of listComponentDocs()) slugs.add(doc.slug);
	return [...slugs];
}
