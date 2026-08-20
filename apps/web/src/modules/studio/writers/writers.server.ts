import { existsSync } from "node:fs";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { REPO_SLUG } from "../../content/repo";

/*
 * Shared infrastructure, not a studio feature.
 *
 * It sits beside `documents/`, `hub/` and the rest, which makes it look like
 * one, and it is not: it has no panel, no route, no query key and no section.
 * It is the thing that knows how to put a file somewhere - used by every
 * document action, by the workflows runner and by one API route - and it is
 * here rather than one level up because only the studio writes.
 *
 * The test for adding to this file: **two features need it.** A helper only
 * the documents workspace uses belongs with the documents workspace.
 */

/*
 * How a change reaches the repository, which is not the same question as what
 * the change is.
 *
 * The action layer above decides that a slug moves and which files that means.
 * This decides whether "moving a file" is `rename()` on a laptop or four calls
 * to the Git Data API against a branch - and the action layer is written once
 * because it never has to know which.
 *
 * Two writers, and the reason there are two rather than one:
 *
 *   local    the repository is on this machine. Immediate, no network, no
 *            token, and nothing is committed - the changes sit in the working
 *            tree where `git diff` and `pnpm check` can look at them, which is
 *            exactly what you want while you are still deciding.
 *
 *   github   the repository is somewhere else, which is the situation in
 *            production. Every change is a commit on a branch, because there
 *            is no working tree to leave anything in and an uncommitted edit
 *            on a server is an edit that does not exist.
 *
 * Neither is a fallback for the other. `writerFor()` picks by what is
 * configured, and reports both when both are - a studio that silently wrote to
 * a laptop when it meant to open a pull request would be the worst kind of
 * working.
 *
 * `.server.ts` because it holds a token and touches a filesystem.
 */

export interface Writer {
	readonly name: "local" | "github";

	/** One line, shown in the studio, saying where a change would land. */
	readonly destination: string;

	/** The file's text, or null if there is no such file. */
	read(path: string): Promise<string | null>;

	/**
	 * Applies every change as one unit, and says what it did.
	 *
	 * A batch rather than a call per file, because a rename is two operations
	 * that are only correct together: half a rename leaves a document at both
	 * names, and on GitHub that would be two commits with a broken state
	 * between them that CI would try to build.
	 */
	apply(batch: Batch): Promise<{ commit: string | null }>;
}

/** What to do, as data, so a plan and a write are the same object. */
export interface Batch {
	readonly message: string;
	readonly writes: readonly { path: string; text: string }[];
	readonly deletes: readonly string[];
}

/* ── local ───────────────────────────────────────────────────────────── */

/**
 * The repository root, found by looking for the thing only the root has.
 *
 * `process.cwd()` is `apps/web` under `vite dev` and the repository root under
 * the CLI, so neither is the answer on its own. Walking up for
 * `pnpm-workspace.yaml` gets the same answer from both, and stops rather than
 * guessing when there is no repository at all - which is the case in the
 * production image and is precisely when the local writer must not exist.
 */
function repoRoot(): string | null {
	const named = process.env.STUDIO_REPO_ROOT;
	if (named)
		return existsSync(join(named, "pnpm-workspace.yaml")) ? named : null;

	let at = process.cwd();
	for (let up = 0; up < 6; up++) {
		if (existsSync(join(at, "pnpm-workspace.yaml"))) return at;
		const parent = dirname(at);
		if (parent === at) break;
		at = parent;
	}
	return null;
}

/**
 * Resolves a repo-relative path, and refuses one that leaves the repo.
 *
 * The contract already rejects `..` segments, so this is the second of two
 * checks on the same thing. That is deliberate: the first is a validator a
 * future caller could forget to run, and this one is in the function that
 * actually opens the file. A path traversal needs to get past both.
 */
function inside(root: string, path: string): string {
	const full = resolve(root, path);
	if (full !== root && !full.startsWith(`${root}/`)) {
		throw new Error(`Refusing to write outside the repository: ${path}`);
	}
	return full;
}

function localWriter(root: string): Writer {
	return {
		name: "local",
		destination: `the working tree at ${root}`,

		async read(path) {
			try {
				return await readFile(inside(root, path), "utf8");
			} catch {
				return null;
			}
		},

		async apply(batch) {
			for (const write of batch.writes) {
				const full = inside(root, write.path);
				await mkdir(dirname(full), { recursive: true });
				await writeFile(full, write.text, "utf8");
			}

			/*
			 * Deletes last, so a move is a write-then-delete rather than the other
			 * way round. If the process dies between the two, the version that
			 * survives is the one with both copies - which is recoverable. The
			 * other order loses the file.
			 */
			for (const path of batch.deletes) {
				await rm(inside(root, path), { force: true });
			}

			// Nothing is committed. The changes are in the working tree, which is
			// where somebody about to run `pnpm check` wants them.
			return { commit: null };
		},
	};
}

/* ── github ──────────────────────────────────────────────────────────── */

const API = "https://api.github.com";

/**
 * Which branch a change lands on.
 *
 * Not `main`, and this is the one default in the file worth arguing about. It
 * earns its place twice.
 *
 * The first reason is review: a studio that commits straight to the default
 * branch is a studio where a mistyped slug is deployed before anybody has
 * looked at it. Merging is a decision a person makes with a diff in front of
 * them.
 *
 * The second is money, and it is the one that would otherwise be discovered
 * from a bill. `.github/workflows/ci.yml` fires on `push: branches: [main]`
 * and on `pull_request` - so a commit to this branch runs no jobs at all, and
 * Railway, which builds from the default branch, does not deploy. A studio
 * pointed at `main` would run the full pipeline and a container build for
 * every title somebody fixed.
 *
 * That means the branch name here is not cosmetic: **setting `STUDIO_BRANCH`
 * to `main` turns every edit into a CI run and a deploy.** If that is ever
 * wanted, the commit messages want `[skip ci]` in them first.
 */
const branch = () => process.env.STUDIO_BRANCH ?? "studio";

async function api<T>(
	token: string,
	path: string,
	init?: RequestInit,
): Promise<T> {
	const response = await fetch(`${API}${path}`, {
		...init,
		headers: {
			authorization: `Bearer ${token}`,
			accept: "application/vnd.github+json",
			"content-type": "application/json",
			"x-github-api-version": "2022-11-28",
			// GitHub returns 403 without one.
			"user-agent": "sushindustries-studio",
			...init?.headers,
		},
		signal: AbortSignal.timeout(15_000),
	});

	if (!response.ok) {
		const detail = await response.text().catch(() => "");
		throw new Error(
			`GitHub ${init?.method ?? "GET"} ${path} answered ${response.status}. ${detail.slice(0, 200)}`,
		);
	}

	return (await response.json()) as T;
}

/**
 * One commit, built out of the Git Data API rather than the Contents API.
 *
 * The Contents API writes one file per call and makes one commit per file, so
 * a rename through it is two commits with a broken tree between them - a state
 * CI would check out and try to build. The Data API is four calls whatever the
 * batch size: blobs, a tree, a commit, a ref update. More code, one commit,
 * and the repository is never in a state that did not exist on purpose.
 *
 * The tree is built with `base_tree` set to the current commit's, so a delete
 * is an entry with a null sha rather than a tree we had to enumerate first.
 */
function githubWriter(token: string): Writer {
	const [owner, repo] = REPO_SLUG.split("/");
	const base = `/repos/${owner}/${repo}`;

	return {
		name: "github",
		destination: `${REPO_SLUG} on the \`${branch()}\` branch`,

		async read(path) {
			try {
				const file = await api<{ content?: string; encoding?: string }>(
					token,
					`${base}/contents/${path}?ref=${encodeURIComponent(branch())}`,
				);
				if (file.encoding !== "base64" || !file.content) return null;
				return Buffer.from(file.content, "base64").toString("utf8");
			} catch {
				return null;
			}
		},

		async apply(batch) {
			const head = await api<{ object: { sha: string } }>(
				token,
				`${base}/git/ref/heads/${branch()}`,
			).catch(async () => {
				/*
				 * The branch does not exist yet, which is the normal state the first
				 * time anybody uses the studio on a fresh deployment. Cut it from the
				 * default branch rather than failing with a 404 that reads like a
				 * permissions problem.
				 */
				const fallback = await api<{ default_branch: string }>(token, base);
				const from = await api<{ object: { sha: string } }>(
					token,
					`${base}/git/ref/heads/${fallback.default_branch}`,
				);
				await api(token, `${base}/git/refs`, {
					method: "POST",
					body: JSON.stringify({
						ref: `refs/heads/${branch()}`,
						sha: from.object.sha,
					}),
				});
				return from;
			});

			const commit = await api<{ tree: { sha: string } }>(
				token,
				`${base}/git/commits/${head.object.sha}`,
			);

			const blobs = await Promise.all(
				batch.writes.map(async (write) => {
					const blob = await api<{ sha: string }>(token, `${base}/git/blobs`, {
						method: "POST",
						body: JSON.stringify({
							content: Buffer.from(write.text, "utf8").toString("base64"),
							encoding: "base64",
						}),
					});
					return {
						path: write.path,
						mode: "100644" as const,
						type: "blob" as const,
						sha: blob.sha,
					};
				}),
			);

			const tree = await api<{ sha: string }>(token, `${base}/git/trees`, {
				method: "POST",
				body: JSON.stringify({
					base_tree: commit.tree.sha,
					tree: [
						...blobs,
						// A null sha against a path is how the Data API says "remove
						// this". There is no delete endpoint for a tree entry.
						...batch.deletes.map((path) => ({
							path,
							mode: "100644" as const,
							type: "blob" as const,
							sha: null,
						})),
					],
				}),
			});

			const made = await api<{ sha: string }>(token, `${base}/git/commits`, {
				method: "POST",
				body: JSON.stringify({
					message: batch.message,
					tree: tree.sha,
					parents: [head.object.sha],
				}),
			});

			await api(token, `${base}/git/refs/heads/${branch()}`, {
				method: "PATCH",
				// No force. A ref that has moved under us means somebody else wrote
				// while we were building this tree, and overwriting them is how work
				// disappears without anybody being told.
				body: JSON.stringify({ sha: made.sha, force: false }),
			});

			return { commit: made.sha };
		},
	};
}

/* ── choosing ────────────────────────────────────────────────────────── */

export interface WriterOption {
	readonly name: "local" | "github";
	readonly available: boolean;

	/** Why it is or is not available, in one sentence, for the studio to show. */
	readonly reason: string;
}

/**
 * Every writer, and whether it can be used.
 *
 * Reported rather than silently resolved, because "the studio cannot write"
 * and "the studio wrote somewhere unexpected" are both states somebody needs
 * to see before they try to rename something, not after.
 */
export function writerOptions(): readonly WriterOption[] {
	const root = repoRoot();
	const token = process.env.GITHUB_WRITE_TOKEN;

	return [
		{
			name: "local",
			available: Boolean(root) && Boolean(process.env.STUDIO_LOCAL_WRITES),
			reason: !root
				? "No repository on this machine - the deployed image has no working tree."
				: process.env.STUDIO_LOCAL_WRITES
					? `Writes to the working tree at ${root}, uncommitted.`
					: "Set STUDIO_LOCAL_WRITES to allow writes to the working tree.",
		},
		{
			name: "github",
			available: Boolean(token),
			reason: token
				? `Commits to ${REPO_SLUG} on the \`${branch()}\` branch.`
				: "Set GITHUB_WRITE_TOKEN to a token with contents:write on this repository.",
		},
	];
}

/**
 * The writer a change should go through, or null if there is none.
 *
 * GitHub wins when both are configured. A machine with a checkout *and* a
 * write token is a laptop somebody has set up deliberately for the deployed
 * behaviour, and quietly preferring the local tree there would mean the thing
 * they configured last is the thing that does not happen.
 */
export function writerFor(prefer?: "local" | "github"): Writer | null {
	const root = repoRoot();
	const token = process.env.GITHUB_WRITE_TOKEN;

	const local =
		root && process.env.STUDIO_LOCAL_WRITES ? localWriter(root) : null;
	const remote = token ? githubWriter(token) : null;

	if (prefer === "local") return local;
	if (prefer === "github") return remote;
	return remote ?? local;
}

/**
 * The repository root, for the one caller that needs the path rather than a
 * writer: running `pnpm new`, which is a process rather than a file operation.
 */
export function localRoot(): string | null {
	return repoRoot();
}
