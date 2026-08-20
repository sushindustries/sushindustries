import { invites } from "@sushindustries/access/invites.server";
import { tokens } from "@sushindustries/access/tokens.server";
import { accessStore } from "./access-store.server";

/*
 * Where the access domain meets this site's database. One file, one binding.
 *
 * `@sushindustries/access` holds the policy and declares the storage it needs;
 * `@sushindustries/db` implements that storage over Drizzle. Neither imports
 * the other, so this is the only place both are in scope - which makes it the
 * only place they can be checked against each other, and that check is a
 * normal typecheck of this application rather than a promise in a manifest. If
 * the port grows a method the adapter has not got, this line stops compiling.
 *
 * Bound once at module scope rather than per call. `accessStore` resolves the
 * connection lazily inside each method, so constructing it costs nothing and
 * doing it here means no route can accidentally bind a second one.
 */

const store = accessStore();

/** Minting, listing, revoking and verifying, against this site's Postgres. */
export const accessTokens = tokens(store);

/** Inviting, withdrawing, previewing and redeeming, against the same. */
export const accessInvites = invites(store);
