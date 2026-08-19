import { bindSkills, parseSkill, type Skill } from "@sushindustries/assistant";
import { findComponentPage } from "../content/components/component-page";
import {
	findPackage,
	listPackages,
} from "../content/packages/packages.catalogue";
import { listRegistry } from "../registry/registry.catalogue";
import { readAllViews, readViews } from "../stats/stats.server";

/*
 * This site's skills: the declarations, bound to the functions that do them.
 *
 * The split is the same one everything else here uses. What a skill *is* lives
 * in `packages/assistant/skills/*.md` - a name, the sentence the model reads
 * when deciding, and a table of parameters. What a skill *does* is always about
 * this site, so it lives here, and the package never sees it.
 *
 * `.server.ts` because two of these read the database and all of them run
 * inside the chat handler. Nothing here is secret, but a skill that quietly
 * became importable from a component would be a registry search happening in a
 * browser for no reason.
 */

/*
 * Every skill, inlined at build time.
 *
 * `import.meta.glob` with `eager` and `?raw`, the same as the posts and the
 * package READMEs. The directory is the list: adding a skill is adding a file,
 * and there is no array here to forget to update - which is the failure this
 * pattern exists to make impossible.
 *
 * `README.md` is excluded by the glob rather than by a filter, because it has
 * no `name:` in its frontmatter and would parse to null anyway. Being explicit
 * is cheaper than explaining a null later.
 */
const FILES = import.meta.glob<string>(
	"../../../../../packages/assistant/skills/*.md",
	{ eager: true, import: "default", query: "?raw" },
);

export const skills: Skill[] = Object.entries(FILES)
	.filter(([path]) => !path.endsWith("README.md"))
	.map(([, source]) => parseSkill(source))
	.filter((skill): skill is Skill => skill !== null)
	// Sorted, so the order the model sees does not depend on the filesystem.
	.sort((a, b) => a.name.localeCompare(b.name));

/** `5` from a model that may have sent `"5"`, bounded. */
function count(value: unknown, fallback: number, max: number): number {
	const parsed = Number(value);
	if (!Number.isFinite(parsed)) return fallback;

	return Math.min(max, Math.max(1, Math.round(parsed)));
}

/*
 * The handlers.
 *
 * Every one of them returns a plain object or null and never throws. A tool
 * that throws does not fail quietly - the model apologises, guesses different
 * arguments, and calls it again, which spends the whole reply on an error the
 * reader never sees the cause of.
 */
export const boundSkills = bindSkills(skills, {
	find_component({ query, limit }) {
		const words = String(query ?? "")
			.toLowerCase()
			.split(/\s+/)
			.filter(Boolean);

		/*
		 * Scored rather than filtered, because the model asks in prose. "a
		 * laptop frame" matches nothing as a substring and should still find
		 * `device` - so each word is looked for across the name, the title, the
		 * description and the tags, and a name match is worth more than a
		 * description match.
		 */
		const scored = listRegistry().map((item) => {
			const haystack =
				`${item.name} ${item.title} ${item.description} ${(item.tags ?? []).join(" ")}`.toLowerCase();

			const score = words.reduce((total, word) => {
				if (item.name.toLowerCase().includes(word)) return total + 3;
				if (item.title.toLowerCase().includes(word)) return total + 2;
				if (haystack.includes(word)) return total + 1;
				return total;
			}, 0);

			return { item, score };
		});

		/*
		 * No words is a browse, not a search that found nothing.
		 *
		 * "Which components can I install?" is answered by the model calling
		 * this with an empty query, and scoring against zero words gives every
		 * item a score of 0 - so the filter below removed all of them and the
		 * tool returned `[]`. The model, correctly, then told the reader it did
		 * not have that information, while sitting on a registry of 66 items.
		 *
		 * An empty query means "show me what there is", which is the most
		 * obvious question anybody asks an assistant about a component library.
		 */
		const matched =
			words.length === 0 ? scored : scored.filter((entry) => entry.score > 0);

		return matched
			.sort((a, b) => b.score - a.score)
			.slice(0, count(limit, 5, 12))
			.map(({ item }) => ({
				name: item.name,
				title: item.title,
				description: item.description,
				category: item.category,
				path: `/components/${item.name}`,
			}));
	},

	read_doc({ slug }) {
		const page = findComponentPage(String(slug ?? ""), () => true);
		if (!page) return null;

		return {
			slug: page.slug,
			title: page.title,
			/*
			 * Every section joined, because the split into Home, API and Examples
			 * is a decision about a tabbed page and means nothing to a model
			 * reading for an answer.
			 */
			body: page.sections.map((section) => section.body).join("\n\n"),
		};
	},

	list_packages({ detail }) {
		return listPackages().map((entry) => ({
			name: entry.name,
			description: entry.description,
			path: `/packages/${entry.slug}`,
			/*
			 * The README is looked up rather than read off the summary, because a
			 * summary deliberately does not carry one - the packages index renders
			 * a list of names and would otherwise inline four whole documents to
			 * do it.
			 */
			...(detail === true
				? { readme: findPackage(entry.slug)?.readme ?? "" }
				: {}),
		}));
	},

	async site_stats({ path }) {
		/*
		 * The one skill that can fail at runtime, and the only one that talks to
		 * anything but the bundle. It returns null when there is no database, so
		 * a deployment without one still answers every other question.
		 */
		if (path) return await readViews(String(path));
		return await readAllViews();
	},
});
