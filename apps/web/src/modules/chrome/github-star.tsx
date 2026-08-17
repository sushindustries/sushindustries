import { Icon } from "@sushindustries/ui";
import { useQuery } from "@tanstack/react-query";
import type { ReactNode } from "react";

/*
 * The repository, with its stars on it.
 *
 * A live count instead of a static "GitHub" word: the number is the one thing
 * about the repo that changes, and showing it makes the link a small claim
 * rather than a menu item. Fetched client-side through TanStack Query with a
 * long stale time - GitHub's unauthenticated API allows 60 requests an hour
 * per IP, and one star count does not need more than one of them.
 *
 * Renders the plain link until the number arrives, so the nav is identical on
 * server and client and nothing shifts when the query lands.
 */
const REPO = "sushindustries/sushindustries";

/*
 * The link goes to the profile, not the repo: the repo is private today, so
 * its URL is a 404 for everyone who is not me. The star count comes from the
 * repo API and simply stays hidden until the day that changes - the widget is
 * already wired for it.
 */
const PROFILE = "https://github.com/sushindustries";

export function GithubStar(): ReactNode {
	const { data } = useQuery({
		queryKey: ["github-stars", REPO],
		queryFn: async (): Promise<number | null> => {
			const response = await fetch(`https://api.github.com/repos/${REPO}`);
			if (!response.ok) return null;
			const body = (await response.json()) as { stargazers_count?: number };
			return body.stargazers_count ?? null;
		},
		staleTime: 60 * 60 * 1000,
		gcTime: 60 * 60 * 1000,
		retry: false,
	});

	return (
		<a
			href={PROFILE}
			className="nav-link flex items-center gap-2"
			target="_blank"
			rel="noreferrer"
			aria-label="GitHub"
		>
			<Icon name="github" size={15} />
			{typeof data === "number" ? (
				<span className="flex items-center gap-1 mono text-xs">
					<Icon name="star" size={11} />
					{data}
				</span>
			) : null}
		</a>
	);
}
