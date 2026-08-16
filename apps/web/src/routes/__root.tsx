import atomsCss from "@sushindustries/atoms/atoms.css?url";
import { SmoothScroll } from "@sushindustries/ui";
import {
	createRootRoute,
	HeadContent,
	Outlet,
	Scripts,
} from "@tanstack/react-router";
import type { ReactNode } from "react";
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
	return (
		<html lang="en">
			<head>
				<HeadContent />
			</head>
			<body>
				<SmoothScroll />
				<SiteNav />
				<main id="main">{children}</main>
				<SiteFooter />
				<Scripts />
			</body>
		</html>
	);
}
