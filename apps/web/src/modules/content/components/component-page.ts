import type { RegistryItem } from "@sushindustries/ui/registry";
import { findRegistryItem } from "../../registry/registry.catalogue";
import { SITE } from "../site.catalogue";
import { type ComponentDoc, findComponentDoc } from "./components.catalogue";

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
function generateIntro(
	item: RegistryItem,
	hasDemo: boolean,
	usage?: string,
): string {
	const lines: string[] = [item.description, ""];

	if (hasDemo) {
		lines.push(`<!-- ::start:showcase demo="${item.name}" height="420" -->`);
		lines.push("<!-- ::end:showcase -->");
		lines.push("");
	}

	if (usage) {
		lines.push("## Usage");
		lines.push("");
		lines.push(
			`\`\`\`tsx
import { ${pascal(item.name)} } from "@sushindustries/ui";

${usage}
\`\`\``,
		);
		lines.push("");
	}

	return lines.join("\n");
}

/*
 * How to install it, and what arrives when you do.
 *
 * Split from the intro because it is appended to *every* Home section, not
 * only generated ones. `templates/component-index.md` has always ended with a
 * note saying install commands are attached automatically and must not be
 * written by hand - and that note was false for every component in the
 * registry. A hand-written `index.md` won outright, `pnpm run doctor` guarantees
 * every registry item has one, so the generated path this lived in never ran
 * once. Sixty-six pages documented components nobody was told how to install.
 *
 * Appended rather than prepended: the author's own words open the page, and
 * the mechanical part goes underneath where a reader expects to find it.
 */
function generateSpec(item: RegistryItem): string {
	const lines: string[] = [];

	lines.push("## Install");
	lines.push("");
	lines.push("<!-- ::start:tabs -->");
	lines.push("");
	lines.push("### TanStack");
	lines.push("");
	lines.push("```shell");
	lines.push(`tanstack add ${SITE.url}/r/tanstack/${item.name}.json`);
	lines.push("```");
	lines.push("");
	lines.push("### shadcn");
	lines.push("");
	lines.push("```shell");
	lines.push(
		`pnpm dlx shadcn@latest add ${SITE.url}/r/shadcn/${item.name}.json`,
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

function pascal(slug: string): string {
	return slug
		.split("-")
		.map((part) => part.charAt(0).toUpperCase() + part.slice(1))
		.join("");
}

export function findComponentPage(
	slug: string,
	hasDemo: (id: string) => boolean,
	/*
	 * The demo's own source, when the caller has one. It becomes the Usage
	 * section - hand-written beside the element, so the generated page shows
	 * code somebody meant rather than a templated `<X />`.
	 */
	demoSource?: (id: string) => string | undefined,
): ComponentPage | undefined {
	const written = findComponentDoc(slug);
	const item = findRegistryItem(slug);

	/*
	 * Hand-written wins outright: if somebody wrote it, they meant it. The one
	 * thing it does not get to skip is how to install the thing - that is
	 * appended from the registry, so it is right by construction rather than
	 * right until a version changes.
	 */
	if (written) {
		return {
			...written,
			/*
			 * Except an empty summary, which nobody meant: the doc template
			 * scaffolds `summary:` blank and forty pages shipped it that way,
			 * each one a page with no meta description. The registry entry
			 * always has one sentence, so an unfilled field falls back to it.
			 */
			summary: written.summary || item?.description || "",
			generated: false,
			item,
			sections: item
				? written.sections.map((section) =>
						section.id === "index"
							? { ...section, body: `${section.body}\n\n${generateSpec(item)}` }
							: section,
					)
				: written.sections,
		};
	}

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
				body: [
					generateIntro(item, hasDemo(item.name), demoSource?.(item.name)),
					generateSpec(item),
				].join("\n"),
			},
		],
	};
}
