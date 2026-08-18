import { usePostHog } from "@posthog/react";
import { Icon } from "@sushindustries/ui";
import { useQuery } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { PROFILE_URL, REPO_IS_PUBLIC, REPO_SLUG } from "../content/repo";

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
/*
 * The link goes to the profile, not the repo: the repo is private today, so
 * its URL is a 404 for everyone who is not me. The star count comes from the
 * repo API and simply stays hidden until the day that changes - the widget is
 * already wired for it.
 */

export function GithubStar(): ReactNode {
	const posthog = usePostHog();
	const { data } = useQuery({
		queryKey: ["github-stars", REPO_SLUG],
		queryFn: async (): Promise<number | null> => {
			const response = await fetch(`https://api.github.com/repos/${REPO_SLUG}`);
			if (!response.ok) return null;
			const body = (await response.json()) as { stargazers_count?: number };
			return body.stargazers_count ?? null;
		},
		/*
		 * Not asked at all while the repo is private. Returning null on a 404
		 * hid the count, but the request still happened - one guaranteed-failing
		 * call from the nav of every page, which is a 404 in the console of
		 * every page and a request against an API with a 60-per-hour budget.
		 * The query stays here, wired and ready, and simply does not run.
		 */
		enabled: REPO_IS_PUBLIC,
		staleTime: 60 * 60 * 1000,
		gcTime: 60 * 60 * 1000,
		retry: false,
	});

	return (
		<a
			href={PROFILE_URL}
			className="nav-link flex items-center gap-2"
			target="_blank"
			rel="noreferrer"
			onClick={() => posthog.capture("github_profile_opened")}
			aria-label="GitHub"
		>
			<Icon name="github" size={15} />
			{typeof data === "number" ? (
				// The count is a claim, not a control: on the burger tier it goes,
				// the link stays - this is the only GitHub link in the chrome.
				<span className="flex items-center gap-1 mono text-xs nav-narrow-hide">
					<Icon name="star" size={11} />
					{data}
				</span>
			) : null}
		</a>
	);
}
