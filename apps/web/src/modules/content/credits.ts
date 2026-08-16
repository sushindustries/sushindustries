import type { CreditProps } from "@sushindustries/ui";

/*
 * What this site is built on, and who made it.
 *
 * None of this is mine. It is listed with authorship attached so that the
 * packages page and this one can never be confused for each other: that page
 * is what I wrote, this one is what I depend on.
 */
export const CREDITS: readonly CreditProps[] = [
	{
		name: "TanStack Start",
		by: "TanStack",
		href: "https://tanstack.com/start",
		role: "The framework. SSR, file routes, server functions.",
	},
	{
		name: "TanStack Router",
		by: "TanStack",
		href: "https://tanstack.com/router",
		role: "Type-safe routing and loaders.",
	},
	{
		name: "TanStack Markdown",
		by: "TanStack",
		href: "https://tanstack.com/markdown",
		role: "Parses every README on this site.",
	},
	{
		name: "TanStack Highlight",
		by: "TanStack",
		href: "https://tanstack.com/highlight",
		role: "Highlights the code, synchronously, with no client JavaScript.",
	},
	{
		name: "Nitro",
		by: "UnJS",
		href: "https://nitro.build",
		role: "Builds the Node server this runs on.",
	},
	{
		name: "Vite",
		by: "Evan You and contributors",
		href: "https://vite.dev",
		role: "The bundler and the dev server.",
	},
	{
		name: "Drizzle ORM",
		by: "Drizzle Team",
		href: "https://orm.drizzle.team",
		role: "The schema and queries behind @sushindustries/db.",
	},
	{
		name: "Lenis",
		by: "Darkroom Engineering",
		href: "https://lenis.darkroom.engineering",
		role: "The smooth scroll.",
	},
	{
		name: "React",
		by: "Meta and contributors",
		href: "https://react.dev",
		role: "The rendering model.",
	},
	{
		name: "Biome",
		by: "Biome contributors",
		href: "https://biomejs.dev",
		role: "Formats and lints every file here.",
	},
];
