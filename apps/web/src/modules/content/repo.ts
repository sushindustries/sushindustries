/*
 * The repository, and the one fact that decides what may link to it.
 *
 * The repo is private. GitHub answers a private repo with 404 rather than 403
 * for anyone not signed into it, so every link and every fetch aimed at it is
 * a dead end for visitors - and, because the API call fires from the nav on
 * every page, a 404 in the console of every page on the site.
 *
 * The fix is not to delete the affordances; they are all correct the day the
 * repo opens. It is to route them through one boolean, so that day is a
 * one-line change rather than a hunt through five files for URLs that quietly
 * stopped working.
 *
 * `PROFILE` is a separate constant on purpose: the profile is public and its
 * links work today, which is why the nav points there instead.
 */

export const REPO_SLUG = "sushindustries/sushindustries";
export const REPO_URL = `https://github.com/${REPO_SLUG}`;
export const PROFILE_URL = "https://github.com/sushindustries";

/**
 * Whether the repository is readable by someone who is not me.
 *
 * Everything that links to or fetches the repo consults this. Flip it when the
 * repo goes public and the star count, the edit doors and the `codeRepository`
 * claim all come back on together.
 */
export const REPO_IS_PUBLIC = false;
