import { Icon, type IconName } from "@sushindustries/ui";
import type { ReactNode } from "react";

/*
 * Wordmark left, sections centre, GitHub right.
 *
 * The centre group is hidden below the narrow breakpoint rather than folded
 * into a burger menu. There are four links; a menu that opens to show four
 * links is more interface than the thing it hides.
 *
 * Icons sit beside the labels, never instead of them. An icon alone is a
 * guessing game, and "Tools" and "Components" would both be a cube.
 *
 * Plain anchors rather than <Link>: one of these is a hash target on the home
 * page, and mixing the two kinds of navigation in one list is how a nav ends
 * up with links that only work from certain pages.
 */
const SECTIONS: ReadonlyArray<{
	label: string;
	href: string;
	icon: IconName;
}> = [
	{ label: "Tools", href: "/components/product-viewer", icon: "cube" },
	{ label: "Components", href: "/components", icon: "layers" },
	{ label: "Packages", href: "/packages", icon: "package" },
	{ label: "Writing", href: "/posts", icon: "note" },
];

export function SiteNav(): ReactNode {
	return (
		<header className="nav">
			<nav className="container flex items-center justify-between gap-4 py-3">
				<a href="/" className="flex items-center gap-3 shrink-0">
					<span className="mono text-sm font-semibold">sushindustries</span>
				</a>

				<div className="flex items-center gap-2 nav-narrow-hide">
					{SECTIONS.map((section) => (
						<a
							key={section.href}
							href={section.href}
							className="nav-link flex items-center gap-2"
						>
							<Icon name={section.icon} size={14} />
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
