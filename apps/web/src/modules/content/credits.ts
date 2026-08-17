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
		logo: "/logos/tanstack.png",
		docs: "https://tanstack.com/start/latest/docs",
	},
	{
		name: "TanStack Router",
		by: "TanStack",
		href: "https://tanstack.com/router",
		role: "Type-safe routing and loaders.",
		logo: "/logos/tanstack.png",
		docs: "https://tanstack.com/router/latest/docs",
	},
	{
		name: "TanStack Markdown",
		by: "TanStack",
		href: "https://tanstack.com/markdown",
		role: "Parses every README on this site.",
		logo: "/logos/tanstack.png",
		docs: "https://tanstack.com/markdown/latest/docs",
	},
	{
		name: "TanStack Highlight",
		by: "TanStack",
		href: "https://tanstack.com/highlight",
		role: "Highlights the code, synchronously, with no client JavaScript.",
		logo: "/logos/tanstack.png",
		docs: "https://tanstack.com/highlight/latest/docs",
	},
	{
		name: "Nitro",
		by: "UnJS",
		href: "https://nitro.build",
		role: "Builds the Node server this runs on.",
		logo: "/logos/nitro.svg",
		docs: "https://nitro.build/guide",
	},
	{
		name: "Vite",
		by: "Evan You and contributors",
		href: "https://vite.dev",
		role: "The bundler and the dev server.",
		logo: "/logos/vite.svg",
		docs: "https://vite.dev/guide/",
	},
	{
		name: "Drizzle ORM",
		by: "Drizzle Team",
		href: "https://orm.drizzle.team",
		role: "The schema and queries behind @sushindustries/db.",
		logo: "/logos/drizzle.svg",
		docs: "https://orm.drizzle.team/docs/overview",
	},
	{
		name: "Lenis",
		by: "Darkroom Engineering",
		href: "https://lenis.darkroom.engineering",
		role: "The smooth scroll.",
		logo: "/logos/lenis.ico",
		docs: "https://github.com/darkroomengineering/lenis#readme",
	},
	{
		name: "React",
		by: "Meta and contributors",
		href: "https://react.dev",
		role: "The rendering model.",
		logo: "/logos/react.svg",
		docs: "https://react.dev/reference/react",
	},
	{
		name: "Biome",
		by: "Biome contributors",
		href: "https://biomejs.dev",
		role: "Formats and lints every file here.",
		logo: "/logos/biome.svg",
		docs: "https://biomejs.dev/guides/getting-started/",
	},
];
