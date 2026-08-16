import atomsCss from "@sushindustries/atoms/atoms.css?url";
import { SmoothScroll } from "@sushindustries/ui";
import {
	createRootRoute,
	HeadContent,
	Outlet,
	Scripts,
	useRouterState,
} from "@tanstack/react-router";
import type { ReactNode } from "react";
import { QueryProvider } from "../integrations/tanstack-query/provider";
import { Devtools } from "../modules/chrome/devtools";
import { SiteFooter } from "../modules/chrome/site-footer";
import { SiteNav } from "../modules/chrome/site-nav";
import proseCss from "../styles/prose.css?url";

export const Route = createRootRoute({
	head: () => ({
		meta: [
			{ charSet: "utf-8" },
			{ name: "viewport", content: "width=device-width, initial-scale=1" },
			{ title: "Sushindustries" },
			{
				name: "description",
				content:
					"Small packages, built carefully. Tools, libraries and components from Sushindustries.",
			},
		],
		// Order matters: atoms defines the tokens that prose.css reads.
		links: [
			{ rel: "stylesheet", href: atomsCss },
			{ rel: "stylesheet", href: proseCss },
		],
	}),
	component: RootComponent,
});

function RootComponent(): ReactNode {
	return (
		<RootDocument>
			<Outlet />
		</RootDocument>
	);
}

function RootDocument({
	children,
}: Readonly<{ children: ReactNode }>): ReactNode {
	/*
	 * `/preview/*` renders inside an iframe - in the showcase frame and in every
	 * archive card. It gets no chrome at all.
	 *
	 * This is not a cosmetic choice. Site chrome inside a preview means the nav
	 * bar appears in the middle of a thumbnail, the devtools launcher mounts
	 * once per card, and the frame scrolls because the chrome makes it taller
	 * than the box. All three were visible before this existed.
	 *
	 * Read from router state rather than passed down, because the root renders
	 * above every route and has nothing else to ask. It resolves on the server
	 * too, so the chrome is absent in the SSR'd HTML rather than removed after
	 * hydration.
	 */
	const pathname = useRouterState({
		select: (state) => state.location.pathname,
	});

	const isBare = pathname.startsWith("/preview/");

	if (isBare) {
		return (
			<html lang="en">
				<head>
					<HeadContent />
				</head>
				<body>
					{children}
					<Scripts />
				</body>
			</html>
		);
	}

	return (
		<html lang="en">
			<head>
				<HeadContent />
			</head>
			<body>
				{/*
				 * QueryProvider wraps the page and the devtools together, because
				 * the Query panel reads the client out of context - outside it,
				 * the panel renders but shows nothing.
				 */}
				<QueryProvider>
					<SmoothScroll />
					<SiteNav />
					<main id="main">{children}</main>
					<SiteFooter />
					<Devtools />
				</QueryProvider>
				<Scripts />
			</body>
		</html>
	);
}
