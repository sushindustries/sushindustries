import atomsCss from "@sushindustries/atoms/atoms.css?url";
import viewerCss from "@sushindustries/react-product-viewer/styles.css?url";
import type { QueryClient } from "@tanstack/react-query";
import {
	createRootRouteWithContext,
	HeadContent,
	Outlet,
	Scripts,
	useRouterState,
} from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Measure } from "../integrations/posthog/provider";
import { Devtools } from "../modules/chrome/devtools";
import { SiteFooter } from "../modules/chrome/site-footer";
import { SiteNav } from "../modules/chrome/site-nav";
import {
	graph,
	personNode,
	webSiteNode,
} from "../modules/content/schema-graph";
import { pageTitle, SITE } from "../modules/content/site.catalogue";
import { ldScript } from "../modules/content/structured-data";
import { getTheme } from "../modules/theme/theme.functions";
import proseCss from "../styles/prose.css?url";

/*
 * The router context, declared where the tree starts so every route inherits
 * the type. `queryClient` is the per-request client `getRouter()` makes -
 * having it here is what lets a loader write
 * `context.queryClient.ensureQueryData(...)` and have the result dehydrate
 * into the SSR stream instead of fetching again on the client.
 */
export interface RouterContext {
	queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<RouterContext>()({
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
			{ title: pageTitle() },
			{
				name: "description",
				content: SITE.description,
			},
			// The mark, wherever a link to this site unfurls.
			{ property: "og:image", content: "/sushi-logo.png" },
			{ property: "og:site_name", content: SITE.name },
			{ property: "og:type", content: "website" },
		],
		// Order matters: atoms defines the tokens that prose.css reads.
		links: [
			{ rel: "icon", href: "/sushi-logo.png", type: "image/png" },
			{ rel: "apple-touch-icon", href: "/sushi-logo.png" },
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
		/*
		 * The two anchors of the entity graph, on every page.
		 *
		 * Everything else that gets published - a component, a video, a review
		 * written in a Markdown block - refers to these by `@id` rather than
		 * describing the site and me again. Emitting them at the root is what
		 * makes those references resolvable on whichever page they appear,
		 * which is the difference between a graph and a pile of nodes.
		 */
		scripts: [ldScript(graph([webSiteNode(), personNode()]))],
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

	/*
	 * A card preview is a picture, so it ships no JavaScript.
	 *
	 * The archive renders up to eighteen of these iframes per page, each with
	 * `pointer-events: none` over it - nothing in them can be interacted with.
	 * Hydrating them anyway meant eighteen full app instances competing for
	 * the one main thread, which is what made clicking a card feel slow: the
	 * navigation had to queue behind seventeen hydrations nobody could use.
	 * Omitting <Scripts /> makes each card pure SSR'd HTML and CSS.
	 */
	const isStill = useRouterState({
		select: (state) =>
			(state.location.search as { fit?: string }).fit === "card",
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
					{isStill ? null : <Scripts />}
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
				 * No QueryClientProvider here - `setupRouterSsrQueryIntegration`
				 * in router.tsx wraps the whole router render in one, which is
				 * why the devtools' Query panel below still finds the client.
				 */}
				{/*
				 * Lenis is not mounted.
				 *
				 * It hijacks the wheel to animate the scroll position itself,
				 * which means every scrollable thing inside the page has to opt
				 * out by hand - 23 `data-lenis-prevent` attributes, a veil that
				 * disables pointer events on embeds mid-gesture, and a fight with
				 * every iframe, canvas and overflow container on the site. The
				 * result was scrolling that felt unpredictable, which is the one
				 * thing smooth scrolling is supposed to fix.
				 *
				 * Native scrolling has none of those failure modes and is what
				 * the reader's own settings, trackpad and accessibility
				 * preferences already agree on.
				 *
				 * `SmoothScroll` stays in `packages/ui` and stays published: it
				 * is a correct component and installing it is a reasonable
				 * choice. This site just does not make it.
				 */}
				{/*
				 * Measurement wraps the chrome but not the previews: the bare
				 * branch above never mounts it, so the archive's eighteen
				 * iframes ask nobody anything and count nothing. One page,
				 * one question, one counter.
				 */}
				<Measure>
					<SiteNav theme={theme} />
					<main id="main" className="flex-1">
						{children}
					</main>
					<SiteFooter />
				</Measure>
				<Devtools />
				<Scripts />
			</body>
		</html>
	);
}
