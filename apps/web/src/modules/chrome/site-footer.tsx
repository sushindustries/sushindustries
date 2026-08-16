import type { ReactNode } from "react";

export function SiteFooter(): ReactNode {
	return (
		<footer className="border-t">
			<div className="container flex items-center justify-between gap-4 wrap py-3">
				<p className="label m-0">Sushindustries</p>
				<p className="label m-0">Built with TanStack Start</p>
			</div>
		</footer>
	);
}
