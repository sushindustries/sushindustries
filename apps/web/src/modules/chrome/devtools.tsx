import { TanStackDevtools } from "@tanstack/react-devtools";
import { PacerDevtoolsPanel } from "@tanstack/react-pacer-devtools";
import { ReactQueryDevtoolsPanel } from "@tanstack/react-query-devtools";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import type { ReactNode } from "react";

/*
 * The devtools panel, in development only.
 *
 * Two independent guards, deliberately. `import.meta.env.DEV` is statically
 * false in a production build so the whole subtree is dead code, and
 * `devtools()` in vite.config.ts strips the imports as well. Either alone
 * would do; both means a mistake in one is not a panel shipped to visitors.
 *
 * Panels are registered up front rather than added when each library first
 * gets used. They cost nothing in production, and a panel that appears only
 * after someone remembers to register it is a panel nobody opens. The
 * inverse holds too: TanStack Form's panel was here for a library this app
 * never installed and a `<form>` that does not exist anywhere in it - a
 * panel advertising a capability the site does not have is worse than no
 * panel, so it is gone rather than kept "for later".
 *
 * Query's panel reads from context, so this has to render inside
 * QueryProvider - see __root.tsx.
 */
export function Devtools(): ReactNode {
	if (!import.meta.env.DEV) return null;

	return (
		<TanStackDevtools
			plugins={[
				{ name: "TanStack Router", render: <TanStackRouterDevtoolsPanel /> },
				{ name: "TanStack Query", render: <ReactQueryDevtoolsPanel /> },
				{ name: "TanStack Pacer", render: <PacerDevtoolsPanel /> },
			]}
		/>
	);
}
