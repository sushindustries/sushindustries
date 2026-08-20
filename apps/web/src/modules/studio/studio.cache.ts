/*
 * Where each studio query's data comes from, as the shape of its cache key.
 *
 * Every key in the studio used to be `["studio", <feature>]` - flat, one
 * segment per feature - and that shape cannot express the sentence the studio
 * most needs to say: *a sync just rewrote the projection, so everything drawn
 * from it is now wrong.* Saying it meant listing the features, and the list was
 * never written: running `sync` invalidated the documents and nothing else, so
 * collections, insights and the hub chart went on serving pre-sync numbers
 * behind a header that said the sync had finished.
 *
 * Three of those features carried comments claiming an invalidation that no
 * code performed. That is the failure this file is built to make impossible.
 *
 * So a key now names its *origin* before it names its feature, and TanStack
 * Query's prefix matching does the rest - invalidating an origin invalidates
 * every feature under it, including ones added later, with nothing to keep in
 * step. A new section joins by choosing which of these it is built from, which
 * is a decision its author has to make anyway.
 *
 * `.ts` rather than `.catalogue.ts`: authored, not globbed. Client-safe,
 * because query keys are read on both sides.
 */

/** The one segment every studio query starts with. */
const STUDIO = "studio";

/**
 * Rebuilt from the repository by `pnpm sushindustries sync`.
 *
 * Documents, collections, insights, the hub's counts and the header's report
 * are all queries over the same projection, so they are all wrong together and
 * right together. Anything whose answer changes when a sync runs belongs here,
 * and anything here is refreshed when one does.
 */
export const PROJECTION = [STUDIO, "projection"] as const;

/**
 * Rows that are sources rather than projections: accounts, tokens, invitations.
 *
 * Separate from the projection because a sync must not touch them and a mint
 * must not invalidate a document listing. They are also the two lists where a
 * stale read is worst - a revoked token still shown as active is the one
 * mistake in this studio that would actually frighten me.
 */
export const ACCESS = [STUDIO, "access"] as const;

/**
 * What this deployment can do, rather than what it holds.
 *
 * Workflow availability depends on whether there is a checkout on disk, which
 * changes when the deployment changes and at no other time - so it is neither
 * a projection nor a source, and putting it under either would mean a sync
 * refetching a list that a sync cannot alter.
 */
export const RUNTIME = [STUDIO, "runtime"] as const;

/** A feature's root, under the origin its data comes from. */
export const rootFor = (
	origin: typeof PROJECTION | typeof ACCESS | typeof RUNTIME,
	feature: string,
) => [...origin, feature] as const;

/*
 * ── what may not run at the same time ────────────────────────────────────
 *
 * A mutation scope is the other half of the same idea: keys say what shares an
 * origin, scopes say what shares a resource. TanStack Query runs mutations in
 * series within a scope and in parallel across them, so two ids are a claim
 * that the work cannot collide.
 */

/**
 * Everything that writes to the checkout, serialised.
 *
 * Saving a document commits to the studio branch. So do the `graphql` and
 * `refs` workflows. Those sat on two different scope ids - `studio-writes` and
 * `studio-workflows` - which meant they ran in parallel, and a rename in flight
 * beside a `refs` run is exactly the case the first one's comment said it
 * existed to prevent: the second builds its tree from a ref the first is about
 * to move. The comment claimed "one write at a time, across the whole studio";
 * it was one write at a time across the documents workspace.
 *
 * One id, so the claim is true. It over-serialises slightly - a `doctor` run
 * writes nothing and still queues behind a save - and that is the right way to
 * be wrong here: these take seconds to minutes and are started by one person,
 * so the cost is a wait, and the cost of the other mistake is a lost commit.
 */
export const REPOSITORY = { id: "studio-repository" } as const;

/**
 * The credential tables. Separate because nothing here touches the checkout.
 *
 * Minting, revoking, inviting and withdrawing all write `accounts`,
 * `api_tokens` or `magic_links` and never a file - so they have no reason to
 * queue behind a six-minute reference refresh, and every reason to be ordered
 * against each other.
 */
export const CREDENTIALS = { id: "studio-credentials" } as const;
