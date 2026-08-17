import { Icon } from "@sushindustries/ui";
import type { ReactNode } from "react";
import { SITE } from "../content/site.catalogue";
import { footerColumns } from "./footer.catalogue";

/*
 * The footer, from `content/footer.md`.
 *
 * Columns of links with their glyphs, and one line of attribution. The
 * attribution is a link, not a logo: reproducing someone's mark is a
 * trademark question with a real answer, and naming them is the part that
 * actually credits the work.
 */
export function SiteFooter(): ReactNode {
	return (
		<footer className="border-t">
			<div className="container py-7">
				<div
					className="grid-auto"
					data-gap="5"
					style={{ "--grid-min": "12rem" } as React.CSSProperties}
				>
					{footerColumns().map((column) => (
						<div key={column.label}>
							<p className="label m-0">{column.label}</p>
							<ul className="mt-3 m-0 p-0" style={{ listStyle: "none" }}>
								{column.links.map((link) => (
									<li key={link.href} className="mt-2">
										<a
											className="flex items-center gap-2 fg-dim text-sm"
											href={link.href}
											target={
												link.href.startsWith("http") ? "_blank" : undefined
											}
											rel={
												link.href.startsWith("http")
													? "noopener noreferrer"
													: undefined
											}
										>
											{link.icon ? <Icon name={link.icon} size={13} /> : null}
											{link.label}
										</a>
									</li>
								))}
							</ul>
						</div>
					))}
				</div>

				<div className="flex items-center justify-between gap-4 wrap mt-6 py-3 border-t">
					<p className="label m-0">{SITE.name}</p>
					<p className="label m-0">
						Built on{" "}
						<a
							className="fg-accent"
							href="https://tanstack.com/start"
							target="_blank"
							rel="noopener noreferrer"
						>
							TanStack Start
						</a>
					</p>
				</div>
			</div>
		</footer>
	);
}
