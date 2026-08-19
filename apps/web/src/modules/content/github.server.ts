import { REPO_IS_PUBLIC, REPO_SLUG } from "./repo";

/*
 * The repository, from GitHub's public API.
 *
 * No token, deliberately. Everything read here is visible to anyone with the
 * URL, so a credential would be a second thing to hold, rotate and eventually
 * leak in exchange for nothing. The cost is the unauthenticated rate limit -
 * sixty requests an hour per address - which is what the cache below is for.
 *
 * Null on failure rather than throwing. The rest of the graph is a local
 * projection and should keep answering when somebody else's API does not; a
 * resolver that takes the whole query down because GitHub is rate-limiting is
 * a resolver that made the network its problem and then everyone's.
 *
 * `.server.ts` because it makes outbound requests on the server's behalf.
 */

const API = "https://api.github.com";

/**
 * How long an answer is reused.
 *
 * Five minutes, set against the limit rather than against freshness: at sixty
 * requests an hour, four fields refreshed per query means fifteen queries an
 * hour before this stops working at all. Nothing here changes faster than a
 * deploy, so the staleness costs nothing and the cache is what makes the
 * fields usable rather than a demo.
 */
const TTL = 5 * 60 * 1000;

const cache = new Map<string, { at: number; value: unknown }>();

async function get<T>(path: string): Promise<T | null> {
	/*
	 * The one flag the rest of the site already consults. GitHub answers a
	 * private repo with 404 rather than 403 for anyone not signed into it, so
	 * without this every field here would look like a bug rather than a
	 * permission - and asking at all would burn the rate limit to learn nothing.
	 */
	if (!REPO_IS_PUBLIC) return null;

	const hit = cache.get(path);
	if (hit && Date.now() - hit.at < TTL) return hit.value as T;

	try {
		const response = await fetch(`${API}${path}`, {
			headers: {
				accept: "application/vnd.github+json",
				"x-github-api-version": "2022-11-28",
				// GitHub asks for one and returns 403 without it.
				"user-agent": "sushindustries-graph",
			},
			signal: AbortSignal.timeout(6000),
		});

		if (!response.ok) {
			/*
			 * Cached as null too. A 403 from the rate limiter means the next
			 * fifty-nine requests would also fail, and retrying each one is how a
			 * rate limit becomes an outage.
			 */
			cache.set(path, { at: Date.now(), value: null });
			return null;
		}

		const value = (await response.json()) as T;
		cache.set(path, { at: Date.now(), value });
		return value;
	} catch {
		cache.set(path, { at: Date.now(), value: null });
		return null;
	}
}

interface RepoResponse {
	full_name: string;
	description: string | null;
	default_branch: string;
	stargazers_count: number;
	open_issues_count: number;
	pushed_at: string;
	html_url: string;
}

export const githubResolvers = {
	Query: {
		async repository() {
			const repo = await get<RepoResponse>(`/repos/${REPO_SLUG}`);
			if (!repo) return null;

			return {
				nameWithOwner: repo.full_name,
				description: repo.description,
				defaultBranch: repo.default_branch,
				stars: repo.stargazers_count,
				openIssues: repo.open_issues_count,
				pushedAt: repo.pushed_at,
				url: repo.html_url,
			};
		},
	},

	Repository: {
		async commits(_: unknown, args: { limit?: number }) {
			const rows = await get<
				{
					sha: string;
					html_url: string;
					commit: {
						message: string;
						author: { name: string; date: string } | null;
					};
				}[]
			>(`/repos/${REPO_SLUG}/commits?per_page=${cap(args.limit)}`);

			return (rows ?? []).map((row) => ({
				sha: row.sha,
				// The first line only. Everything after it is the reasoning, which
				// in this repo runs to paragraphs and is not what a list wants.
				title: row.commit.message.split("\n")[0] ?? "",
				author: row.commit.author?.name ?? null,
				committedAt: row.commit.author?.date ?? "",
				url: row.html_url,
			}));
		},

		async pullRequests(_: unknown, args: { limit?: number }) {
			const rows = await get<
				{
					number: number;
					title: string;
					draft: boolean;
					created_at: string;
					html_url: string;
					user: { login: string } | null;
				}[]
			>(`/repos/${REPO_SLUG}/pulls?state=open&per_page=${cap(args.limit)}`);

			return (rows ?? []).map((row) => ({
				number: row.number,
				title: row.title,
				author: row.user?.login ?? null,
				draft: row.draft,
				createdAt: row.created_at,
				url: row.html_url,
			}));
		},

		async workflowRuns(_: unknown, args: { limit?: number }) {
			const body = await get<{
				workflow_runs: {
					name: string;
					status: string;
					conclusion: string | null;
					head_branch: string | null;
					run_started_at: string;
					html_url: string;
				}[];
			}>(`/repos/${REPO_SLUG}/actions/runs?per_page=${cap(args.limit)}`);

			return (body?.workflow_runs ?? []).map((row) => ({
				name: row.name,
				status: row.status,
				conclusion: row.conclusion,
				branch: row.head_branch,
				startedAt: row.run_started_at,
				url: row.html_url,
			}));
		},
	},
};

/** GitHub's own ceiling is 100 per page; asking for more is a silent truncation. */
const cap = (limit?: number) => Math.min(Math.max(limit ?? 10, 1), 100);
