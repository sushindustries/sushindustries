import type { ReactNode } from "react";

export function SiteFooter(): ReactNode {
	return (
		<footer className="border-t">
			<div className="container flex items-center justify-between gap-4 wrap py-3">
				<p className="label m-0">Sushindustries</p>

				{/*
				 * The attribution is a link, not a logo. Reproducing someone's mark
				 * is a trademark question with a real answer, and naming them is
				 * the part that actually credits the work.
				 */}
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
		</footer>
	);
}
