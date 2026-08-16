import atomsCss from "@sushindustries/atoms/atoms.css?url";
import viewerCss from "@sushindustries/react-product-viewer/styles.css?url";
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
import { getTheme } from "../modules/theme/theme.functions";
import proseCss from "../styles/prose.css?url";

export const Route = createRootRoute({
	/*
	 * The theme, resolved before anything renders.
	 *
	 * A root loader is the one place that can put a value into the *first byte*
	 * the server writes, which is the whole requirement: `data-theme` has to be
	 * correct on `<html>` before paint, or the page shows one theme and then
	 * corrects itself. That correction is the flash, and no amount of CSS fixes
	 * it - the server simply cannot see `localStorage` or a media query.
	 *
	 * A cookie it can see, and `getTheme` reads it out of the request header.
	 */
	loader: () => getTheme(),
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
			/*
			 * The viewer ships its own stylesheet and nothing was importing it,
			 * so `.pv-viewer` had no size and every canvas on the site collapsed
			 * to nothing. It is small and it is needed on the home page, so it is
			 * linked here rather than imported inside the lazy island - a
			 * stylesheet that arrives with the 600 kB chunk arrives after the
			 * canvas it is meant to size.
			 */
			{ rel: "stylesheet", href: viewerCss },
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
	 * The theme the root loader resolved, which on the server is a cookie and on
	 * the client is whatever the last navigation carried. It is read here rather
	 * than passed down because both document shells below need it and one of
	 * them renders no components at all.
	 */
	const theme = Route.useLoaderData();

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
			// The preview iframes get the theme too, or a demo renders in the
			// opposite one to the page framing it.
			<html lang="en" data-theme={theme} data-pv-theme={theme}>
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
		/*
		 * Both themes are written here, in the first byte, from a cookie.
		 *
		 * `data-theme` is what `atoms.css` selects on. It has to be correct
		 * before paint or the page renders one theme and corrects itself, and
		 * that correction is a flash nothing in CSS can prevent - the server
		 * cannot see `localStorage` and cannot evaluate a media query.
		 *
		 * `data-pv-theme` pins the *viewer* to the same answer.
		 * `@sushindustries/react-product-viewer` themes itself from
		 * `prefers-color-scheme`, which is the right default for a package that
		 * does not know what it has been dropped into. This site does know. Left
		 * alone, a machine set to dark drew a dark canvas and a dark loading
		 * scrim inside a light page - two themes on one screen, decided by an
		 * operating system setting neither of them asked about.
		 *
		 * Pinning at the consumer rather than editing the package keeps the
		 * package correct for everybody else.
		 */
		<html lang="en" data-theme={theme} data-pv-theme={theme}>
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
					<SiteNav theme={theme} />
					<main id="main">{children}</main>
					<SiteFooter />
					<Devtools />
				</QueryProvider>
				<Scripts />
			</body>
		</html>
	);
}
