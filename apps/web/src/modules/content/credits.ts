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
		 * Cloudflare was listed here for a day, credited with resolving the
		 * apex. It never got the chance: the domain turned out to be
		 * Railway-registered, Railway's managed DNS answers an ANAME at the
		 * apex itself, and the zone staged at Cloudflare was never made
		 * authoritative. A credit is a statement of fact, so it left with the
		 * architecture. Railway's role grew to what it actually is now.
		 */
		name: "Railway",
		by: "Railway",
		href: "https://railway.com",
		role: "Registrar, DNS, CDN and the server this page came from - the whole path.",
		logo: "/logos/railway.svg",
		docs: "https://docs.railway.com",
	},
	{
		/*
		 * Their brand guidance permits saying a product "works with PostHog"
		 * and using the logo unmodified as secondary branding - which is
		 * exactly what this is. Used, not sponsoring: nobody here paid or
		 * endorsed anything.
		 */
		name: "PostHog",
		by: "PostHog",
		href: "https://posthog.com",
		role: "Counts the page views, and only after the consent bar hears a yes.",
		logo: "/logos/posthog.svg",
		docs: "https://posthog.com/docs",
	},
	{
		/*
		 * Transparency about tooling, stated the way trademark law asks it to
		 * be: the name used factually, no logo - a mark is quotation and
		 * quoting one needs permission this repo has not asked for - and no
		 * wording that implies endorsement. Anthropic did not review, sponsor
		 * or approve this site; it made the tool this site was built with.
		 */
		name: "Claude",
		by: "Anthropic",
		href: "https://claude.com/claude-code",
		role: "The best tool I have ever worked with. This site was built in conversation with it.",
		docs: "https://docs.claude.com",
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
