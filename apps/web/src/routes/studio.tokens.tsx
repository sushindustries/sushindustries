import { createFileRoute } from "@tanstack/react-router";
import { TokensPanel } from "../modules/studio/tokens/tokens-panel";
import { tokensQueryOptions } from "../modules/studio/tokens/tokens-query-keys";

/*
 * Tokens: the keys to `/mcp`, `/graphql` and the report.
 *
 * The loader prefetches the listing and returns nothing, like every other
 * section - `ensureQueryData` fills the cache the panel is about to read, so
 * the first paint has the table in it rather than an empty frame that fills a
 * moment later.
 *
 * The listing is safe to put through SSR because a summary is safe to render
 * anywhere: it carries a prefix and a state and never a secret. The one thing
 * on this page that must not be prefetched is a mint, and a mint is a POST that
 * only happens when somebody presses the button.
 */
export const Route = createFileRoute("/studio/tokens")({
	loader: ({ context }) =>
		context.queryClient.ensureQueryData(tokensQueryOptions()),
	component: TokensPanel,
	head: () => ({
		meta: [
			{ title: "Tokens · Studio" },
			{ name: "robots", content: "noindex, nofollow" },
		],
	}),
});
