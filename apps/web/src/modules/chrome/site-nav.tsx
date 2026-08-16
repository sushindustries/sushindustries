import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

/*
 * Logo left, sections centre, socials right.
 *
 * The centre group is hidden below the narrow breakpoint rather than folded
 * into a burger menu. There are four links; a menu that opens to show four
 * links is more interface than the thing it hides.
 */
const SECTIONS = [
	{ label: "Components", href: "/components" },
	{ label: "Packages", href: "/packages" },
	{ label: "Built on", href: "/#built-on" },
	{ label: "Writing", href: "/posts" },
] as const;

export function SiteNav(): ReactNode {
	return (
		<header className="nav">
			<nav className="container flex items-center justify-between gap-4 py-3">
				<Link to="/" className="flex items-center gap-3 shrink-0">
					<span className="mono text-sm font-semibold">sushindustries</span>
				</Link>

				<div className="flex items-center gap-2 nav-narrow-hide">
					{SECTIONS.map((section) => (
						<a key={section.href} href={section.href} className="nav-link">
							{section.label}
						</a>
					))}
				</div>

				<a
					href="https://github.com/sushindustries"
					className="nav-link shrink-0"
					target="_blank"
					rel="noreferrer"
				>
					GitHub
				</a>
			</nav>
		</header>
	);
}
