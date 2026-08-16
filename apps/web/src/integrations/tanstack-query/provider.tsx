import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { type ReactNode, useState } from "react";

/*
 * The Query client, one per request.
 *
 * `useState(() => new QueryClient())` rather than a module-level singleton:
 * this component renders on the server too, and a shared client there would
 * serve one visitor's cached data to the next request. The initialiser form
 * matters as well — `useState(new QueryClient())` would construct a client on
 * every render and throw the previous one away.
 */
export function QueryProvider({
	children,
}: {
	children: ReactNode;
}): ReactNode {
	const [client] = useState(
		() =>
			new QueryClient({
				defaultOptions: {
					queries: {
						/*
						 * Data rendered on the server is fresh by definition, so
						 * refetching it the moment the client hydrates is pure waste.
						 * A minute is long enough to cover a navigation and short
						 * enough that nothing looks stale.
						 */
						staleTime: 60_000,
						retry: 1,
					},
				},
			}),
	);

	return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
