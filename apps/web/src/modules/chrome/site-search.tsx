import { CommandPalette, Icon, type PaletteEntry } from "@sushindustries/ui";
import { REGISTRY_ITEMS } from "@sushindustries/ui/registry";
import { useRouter } from "@tanstack/react-router";
import { useStore } from "@tanstack/react-store";
import { Store } from "@tanstack/store";
import { type ReactNode, useEffect } from "react";
import { listComponentDocs } from "../content/components/components.catalogue";
import { listPackages } from "../content/packages/packages.catalogue";
import { listBuiltPages } from "../content/pages/pages.catalogue";
import { listPosts } from "../content/posts/posts.catalogue";

/*
 * The site search: one palette, reachable from anywhere.
 *
 * Open state lives in a TanStack Store rather than in a component, because
 * two unrelated places write it - the trigger in the nav and a window-level
 * keydown listener - and lifting `useState` to their common ancestor would
 * make the root re-render on every keystroke of a dialog it does not contain.
 * A store notifies exactly the one subscriber that cares.
 *
 * ⌘K / Ctrl-K opens, the convention every reader already has in their hands;
 * `/` opens too when focus is not already in a field.
 */
const searchOpen = new Store(false);

function toggle(open: boolean): void {
	searchOpen.setState(() => open);
}

/*
 * Everything nameable, once at module scope: the fixed pages, every component
 * and block, every package, every post. If it has a URL, it is findable here.
 */
function buildEntries(): readonly PaletteEntry[] {
	return [
		{
			id: "page-home",
			title: "Home",
			hint: "The front page",
			href: "/",
			group: "page",
			icon: "sushi" as const,
		},
		{
			id: "page-components",
			title: "Components",
			hint: "Everything installable, filterable by category",
			href: "/components",
			group: "page",
			icon: "layers" as const,
			tone: "layout",
		},
		{
			id: "page-blocks",
			title: "Blocks",
			hint: "The assembled regions: nav, shelf, archive, device",
			href: "/components?tag=block",
			group: "page",
			icon: "grid" as const,
		},
		{
			id: "page-packages",
			title: "Packages",
			hint: "Everything published from this monorepo",
			href: "/packages",
			group: "page",
			icon: "package" as const,
		},
		{
			id: "page-writing",
			title: "Writing",
			hint: "The posts",
			href: "/posts",
			group: "page",
			icon: "note" as const,
		},
		...REGISTRY_ITEMS.map((item) => ({
			id: `component-${item.name}`,
			title: item.title,
			hint: item.description,
			href: `/components/${item.name}`,
			group: item.kind === "block" ? "block" : item.category,
			icon: "layers" as const,
			tone: item.category,
		})),
		...listPackages().map((pkg) => ({
			id: `package-${pkg.slug}`,
			title: pkg.name,
			hint: pkg.description,
			href: `/packages/${pkg.slug}`,
			group: "package",
			icon: "package" as const,
			tone: "docs",
		})),
		...listPosts().map((post) => ({
			id: `post-${post.slug}`,
			title: post.title,
			hint: post.summary,
			href: `/posts/${post.slug}`,
			group: "writing",
			icon: "note" as const,
			tone: "content",
		})),
		...listBuiltPages().map((page) => ({
			id: `built-${page.slug}`,
			title: page.title,
			hint: page.summary,
			href: `/p/${page.slug}`,
			group: "page",
			icon: "file" as const,
			tone: "layout",
		})),
		/*
		 * Every extra tab of every hand-written doc: the API page of a
		 * component is findable by name, not only by knowing which component
		 * it belongs to.
		 */
		...listComponentDocs().flatMap((doc) =>
			doc.sections
				.filter((section) => section.id !== "index")
				.map((section) => ({
					id: `doc-${doc.slug}-${section.id}`,
					title: `${doc.title} · ${section.label}`,
					hint: doc.summary,
					href: `/components/${doc.slug}?tab=${section.id}`,
					group: "docs",
					icon: "book" as const,
					tone: "docs",
				})),
		),
	];
}

const ENTRIES = buildEntries();

export function SiteSearchTrigger(): ReactNode {
	return (
		<button
			type="button"
			className="palette-trigger"
			onClick={() => toggle(true)}
			aria-label="Search the site"
		>
			<Icon name="search" size={13} />
			<span className="nav-narrow-hide">Search</span>
			<kbd className="palette-kbd">⌘K</kbd>
		</button>
	);
}

export function SiteSearch(): ReactNode {
	const open = useStore(searchOpen);
	const router = useRouter();

	useEffect(() => {
		function onKey(event: KeyboardEvent): void {
			if ((event.metaKey || event.ctrlKey) && event.key === "k") {
				event.preventDefault();
				toggle(true);
				return;
			}

			const target = event.target as HTMLElement | null;
			const typing =
				target instanceof HTMLInputElement ||
				target instanceof HTMLTextAreaElement ||
				target?.isContentEditable;

			if (event.key === "/" && !typing) {
				event.preventDefault();
				toggle(true);
			}
		}

		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, []);

	return (
		<CommandPalette
			entries={ENTRIES}
			open={open}
			onClose={() => toggle(false)}
			onSelect={(entry) => {
				toggle(false);
				void router.navigate({ href: entry.href });
			}}
			placeholder="Components, blocks, packages…"
		/>
	);
}
