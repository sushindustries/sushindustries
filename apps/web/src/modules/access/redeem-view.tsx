import type { InvitePreview, MintedToken } from "@sushindustries/access";
import { Alert, Badge, Button, Empty, SecretReveal } from "@sushindustries/ui";
import { useMutation } from "@tanstack/react-query";
import { type ReactNode, useState } from "react";
import { SITE } from "../content/site.catalogue";
import { redeemInvite } from "./access.functions";
import { knownScopes, SCOPES } from "./access.schemas";

/*
 * The page somebody lands on when they follow an invitation.
 *
 * It stays in the app rather than moving to `packages/ui`, and the test in the
 * placement rules is what decides it: this file names this site's access
 * domain and its server functions, so installed anywhere else it would mean
 * nothing. The parts of it that are visible elements - the callout, the
 * badges, the copy button - are all already components in the library, which
 * is the arrangement that rule is asking for.
 *
 * Three states and one of them is the whole point. Before: what this will
 * produce, and a button. After: the secret, once. Neither: a dead end that
 * says so without saying why, because "expired", "already used" and "never
 * existed" are the same answer to somebody holding the wrong string.
 */
export function RedeemView({
	invite,
	invitationKey,
}: {
	readonly invite: InvitePreview | null;
	readonly invitationKey: string;
}): ReactNode {
	const [minted, setMinted] = useState<MintedToken | null>(null);

	const collect = useMutation({
		mutationFn: () => redeemInvite({ data: { key: invitationKey } }),
		onSuccess: (result) => setMinted(result),
	});

	if (minted) return <Collected minted={minted} />;

	if (!invite) {
		return (
			<Page>
				<Empty title="This link does not work" icon="link">
					It may have been used already, withdrawn, or simply run out - a link
					lasts a few minutes on purpose. Ask whoever sent it for another one.
				</Empty>
			</Page>
		);
	}

	return (
		<Page>
			<div className="flex col gap-4">
				<h1>You have been given access</h1>

				<p className="fg-dim">
					Collecting this produces an API token called <b>{invite.tokenName}</b>
					. It will be shown to you once, on this page, and cannot be recovered
					afterwards.
				</p>

				<ul className="flex col gap-3">
					{knownScopes(invite.scopes).map((scope) => (
						<li key={scope} className="flex col gap-1">
							<Badge tone="docs">{SCOPES[scope].title}</Badge>
							<span className="fg-dim text-sm">{SCOPES[scope].about}</span>
						</li>
					))}
				</ul>

				<p className="fg-dim text-sm">
					{invite.expiresInDays === null
						? "The token does not expire. It can be revoked at any time by whoever invited you."
						: `The token lasts ${invite.expiresInDays} days, and can be revoked before that.`}
				</p>

				{/*
				 * A button rather than an automatic redemption on load. The link
				 * arrived in an inbox, and inboxes are read by scanners and preview
				 * fetchers that would spend a single-use credential before the person
				 * ever saw this page.
				 */}
				<div>
					<Button disabled={collect.isPending} onClick={() => collect.mutate()}>
						{collect.isPending ? "Collecting…" : "Collect my token"}
					</Button>
				</div>

				{collect.isError ? (
					<Alert title="That did not work" tone="caution" live>
						{(collect.error as Error).message}
					</Alert>
				) : null}

				{collect.isSuccess && !minted ? (
					<Alert title="This link had already been used" tone="caution" live>
						Nothing was created. If that was not you, ask for another
						invitation.
					</Alert>
				) : null}
			</div>
		</Page>
	);
}

function Collected({ minted }: { readonly minted: MintedToken }): ReactNode {
	return (
		<Page>
			<div className="flex col gap-4">
				<h1>Here it is, once</h1>

				<p className="fg-dim">
					Store it somewhere before you leave this page. Only its hash is kept,
					so nobody - including whoever invited you - can show it to you again.
				</p>

				<SecretReveal value={minted.token} label="Copy the token" />

				<h2>Using it</h2>
				<p className="fg-dim">
					It is a bearer token. Send it as an <code>Authorization</code> header,
					or hand it to an MCP client:
				</p>
				<SecretReveal
					copy={false}
					value={`claude mcp add --transport http sushindustries \\\n  ${SITE.url}/mcp \\\n  --header "Authorization: Bearer ${minted.summary.prefix}…"`}
				/>

				<p className="fg-dim text-sm">
					It opens {minted.summary.scopes.join(", ")}
					{minted.summary.expiresAt
						? ` and expires on ${new Date(minted.summary.expiresAt).toLocaleDateString()}.`
						: " and does not expire."}
				</p>
			</div>
		</Page>
	);
}

/**
 * The page frame, written out rather than borrowed from `Section`.
 *
 * `Section` takes a required `title` and renders the heading itself, which is
 * right for a marketing page built out of labelled bands and wrong for a page
 * that is one thing with one h1. Using it here would mean either two headings
 * or a heading in the wrong element, so this uses the same two classes and
 * supplies its own.
 */
function Page({ children }: { readonly children: ReactNode }): ReactNode {
	return (
		<section className="section">
			<div className="container">{children}</div>
		</section>
	);
}
