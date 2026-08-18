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
		name: "TanStack AI",
		by: "TanStack",
		href: "https://tanstack.com/ai",
		role: "Streams the assistant's replies, and runs its tool loop.",
		logo: "/logos/tanstack.png",
		docs: "https://tanstack.com/ai/latest/docs",
	},
	{
		/*
		 * DNS, and the reason the apex resolves at all.
		 *
		 * Not a CDN decision. `adamjurek.com` is a CNAME to Railway, DNS forbids
		 * a CNAME at a zone apex, and the registrar supports neither flattening
		 * nor ALIAS - so without this the site answers on `www` and nowhere else.
		 */
		name: "Cloudflare",
		by: "Cloudflare, Inc.",
		href: "https://www.cloudflare.com",
		role: "Resolves this domain, and flattens the apex CNAME that points at the server.",
		docs: "https://developers.cloudflare.com/dns/",
	},
	{
		name: "Railway",
		by: "Railway",
		href: "https://railway.com",
		role: "Builds the Dockerfile and runs the server this page came from.",
		logo: "/logos/railway.svg",
		docs: "https://docs.railway.com",
	},
	{
		/*
		 * The one that was being used without being listed.
		 *
		 * Every model reply on this site comes from here, which makes it the
		 * most load-bearing dependency on the page and the only one that was
		 * missing from its own credits list. Fixed rather than explained away.
		 */
		name: "Groq",
		by: "Groq",
		href: "https://groq.com",
		role: "Runs the model behind the assistant. Every reply on this site is theirs.",
		logo: "/logos/groq.ico",
		docs: "https://console.groq.com/docs",
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
