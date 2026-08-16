import { TanStackDevtools } from "@tanstack/react-devtools";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import type { ReactNode } from "react";

/*
 * The devtools panel, in development only.
 *
 * Two independent guards, deliberately. `import.meta.env.DEV` is statically
 * false in a production build so the whole subtree is dead code, and
 * `devtools()` in vite.config.ts strips the imports as well. Either alone
 * would do; both means a mistake in one is not a panel shipped to visitors.
 */
export function Devtools(): ReactNode {
	if (!import.meta.env.DEV) return null;

	return (
		<TanStackDevtools
			plugins={[
				{
					name: "TanStack Router",
					render: <TanStackRouterDevtoolsPanel />,
				},
			]}
		/>
	);
}
