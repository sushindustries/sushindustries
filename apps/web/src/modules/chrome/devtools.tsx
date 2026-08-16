import { TanStackDevtools } from "@tanstack/react-devtools";
import { FormDevtoolsPanel } from "@tanstack/react-form-devtools";
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
 * All four panels are registered up front rather than added when each library
 * first gets used. They cost nothing in production, and a panel that appears
 * only after someone remembers to register it is a panel nobody opens.
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
				{ name: "TanStack Form", render: <FormDevtoolsPanel /> },
				{ name: "TanStack Pacer", render: <PacerDevtoolsPanel /> },
			]}
		/>
	);
}
