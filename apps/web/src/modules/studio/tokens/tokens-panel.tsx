import type { MintedToken, TokenSummary } from "@sushindustries/access";
import {
	Alert,
	Badge,
	Button,
	Checkbox,
	DataTable,
	type DataTableColumn,
	Field,
	Input,
	NativeSelect,
	SecretReveal,
	Workbench,
} from "@sushindustries/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { type ReactNode, useState } from "react";
import {
	LIVES,
	SCOPE_NAMES,
	SCOPES,
	type Scope,
} from "../../access/access.schemas";
import { CREDENTIALS } from "../studio.cache";
import { mintStudioToken, revokeStudioToken } from "./tokens.functions";
import { tokenKeys, tokensQueryOptions } from "./tokens-query-keys";

/*
 * Tokens, on screen: mint on the left, everything ever minted on the right.
 *
 * The same arrangement as the other sections, with one deliberate difference.
 * Everywhere else the rail is a way of choosing what to look at; here it is a
 * form, because there is nothing to choose - a token has no detail view, and
 * the only two things anybody does on this page are make one and take one
 * away.
 *
 * The screen this page is really designed around is the one after a mint. That
 * is the only moment the secret exists anywhere outside the holder's hands, and
 * the interface has to be honest that it will not come back: a box that has to
 * be dismissed, and a copy button, rather than a row in a table somebody
 * assumes they can return to.
 */

const when = (value: string | null) =>
	value ? new Date(value).toLocaleDateString() : "-";

export function TokensPanel(): ReactNode {
	const client = useQueryClient();
	const tokens = useQuery(tokensQueryOptions());

	const [name, setName] = useState("");
	const [scopes, setScopes] = useState<readonly Scope[]>(["docs:read"]);
	const [life, setLife] = useState<string>("90");
	const [minted, setMinted] = useState<MintedToken | null>(null);

	const refresh = () => client.invalidateQueries({ queryKey: tokenKeys.all });

	const create = useMutation({
		scope: CREDENTIALS,
		mutationFn: () =>
			mintStudioToken({
				data: {
					name: name.trim(),
					scopes: [...scopes],
					expiresInDays: life === "never" ? null : Number(life),
				},
			}),
		onSuccess: (result) => {
			setMinted(result);
			setName("");
			refresh();
		},
	});

	const withdraw = useMutation({
		scope: CREDENTIALS,
		mutationFn: (id: string) => revokeStudioToken({ data: { id } }),
		onSuccess: refresh,
	});

	const all = tokens.data ?? [];
	const live = all.filter((one) => one.state === "active");

	const toggle = (scope: Scope) =>
		setScopes((current) =>
			current.includes(scope)
				? current.filter((one) => one !== scope)
				: [...current, scope],
		);

	const columns: DataTableColumn<TokenSummary>[] = [
		{ id: "name", header: "Name", sortable: true },
		{ id: "prefix", header: "Token", mono: true },
		{
			id: "scopes",
			header: "Opens",
			cell: (row) => row.scopes.join(" · ") || "nothing",
		},
		{ id: "holder", header: "Holder", cell: (row) => row.holder },
		{
			id: "lastUsedAt",
			header: "Last used",
			sortable: true,
			cell: (row) => when(row.lastUsedAt),
		},
		{
			id: "expiresAt",
			header: "Expires",
			cell: (row) => (row.expiresAt ? when(row.expiresAt) : "never"),
		},
		{
			id: "state",
			header: "State",
			cell: (row) =>
				row.state === "active" ? (
					<Button
						variant="ghost"
						disabled={withdraw.isPending}
						onClick={() => withdraw.mutate(row.id)}
					>
						Revoke
					</Button>
				) : (
					<Badge>{row.state}</Badge>
				),
		},
	];

	return (
		<Workbench
			title="tokens"
			label="Keys to the endpoints this deployment serves"
			maxHeight="min(74vh, 52rem)"
			rail={
				<form
					className="flex col gap-3"
					onSubmit={(event) => {
						event.preventDefault();
						if (name.trim() && scopes.length > 0) create.mutate();
					}}
				>
					<p className="label">Mint a token</p>

					<Field
						label="What is it for"
						hint="A cron job, a laptop, a person. Whatever makes it obvious which one to revoke."
					>
						<Input
							value={name}
							maxLength={64}
							required
							placeholder="railway cron"
							onChange={(event) => setName(event.target.value)}
						/>
					</Field>

					<fieldset className="flex col gap-2">
						<legend className="label">What it opens</legend>
						{SCOPE_NAMES.map((scope) => (
							<Checkbox
								key={scope}
								label={SCOPES[scope].title}
								checked={scopes.includes(scope)}
								onChange={() => toggle(scope)}
							/>
						))}
						<p className="fg-dim text-xs">
							{scopes.length === 0
								? "A token with no scopes authenticates and opens nothing."
								: scopes.map((one) => SCOPES[one].about).join(" ")}
						</p>
					</fieldset>

					<Field label="How long it lasts">
						<NativeSelect
							value={life}
							onChange={(event) => setLife(event.target.value)}
						>
							{LIVES.map((one) => (
								<option
									key={one.label}
									value={one.days === null ? "never" : String(one.days)}
								>
									{one.label}
								</option>
							))}
						</NativeSelect>
					</Field>

					<Button
						type="submit"
						disabled={create.isPending || !name.trim() || scopes.length === 0}
					>
						{create.isPending ? "Minting…" : "Mint"}
					</Button>

					{create.isError ? (
						<Alert title="That did not mint" tone="caution" live>
							{(create.error as Error).message}
						</Alert>
					) : null}
				</form>
			}
			status={
				<>
					<span className="workbench-stat">
						<b>{live.length}</b> active
					</span>
					<span className="workbench-stat">
						<b>{all.length}</b> ever minted
					</span>
					{tokens.isFetching ? (
						<span className="workbench-stat">refreshing…</span>
					) : null}
				</>
			}
		>
			<div className="flex col gap-5">
				{minted ? (
					<Minted minted={minted} onDismiss={() => setMinted(null)} />
				) : (
					<Explanation />
				)}

				<section className="flex col gap-3">
					<h3>Everything ever minted</h3>
					<DataTable
						label="Every API token, including the revoked and expired ones"
						rows={all}
						columns={columns}
						sortBy="lastUsedAt"
						descending
						empty="No tokens yet. The endpoints still take MCP_AUTH_TOKEN, which is the shared key with no holder and no way to take it back from one caller."
					/>
				</section>
			</div>
		</Workbench>
	);
}

/**
 * The secret, once.
 *
 * Not a toast. A toast is dismissed by waiting, and the thing being shown here
 * cannot be recovered by waiting for it again - so it stays until it is
 * deliberately closed, and it says plainly what closing it costs.
 */
function Minted({
	minted,
	onDismiss,
}: {
	readonly minted: MintedToken;
	readonly onDismiss: () => void;
}): ReactNode {
	return (
		<Alert title={`${minted.summary.name} is minted`} tone="tip" live>
			<p>
				This is the only time it will be shown. I store its SHA-256 and the
				first eleven characters, which is enough to recognise it in a list and
				not enough to use - so if it is lost, the answer is to revoke it and
				mint another.
			</p>

			<SecretReveal value={minted.token} label="Copy the token">
				<Button variant="ghost" onClick={onDismiss}>
					I have stored it
				</Button>
			</SecretReveal>

			<p className="fg-dim text-sm">
				Register it with an agent by pointing the MCP client at this deployment:
			</p>
			<SecretReveal
				copy={false}
				value={`claude mcp add --transport http sushindustries \\\n  <origin>/mcp \\\n  --header "Authorization: Bearer ${minted.summary.prefix}…"`}
			/>
		</Alert>
	);
}

function Explanation(): ReactNode {
	return (
		<div className="flex col gap-3">
			<h2>A token is a key with a holder</h2>
			<p className="fg-dim">
				The endpoints used to take one shared secret out of the environment.
				That answers whether a request may proceed and no other question - not
				who is holding it, not when they last used it, and not how to stop one
				holder without stopping every one of them at the same time.
			</p>
			<p className="fg-dim">
				A minted token belongs to an account, carries the scopes it was given,
				expires when it was told to, and can be taken away on its own. The
				shared secret still works and is still tried first, because a gate that
				can only be opened by a database query cannot be opened when the
				database is what is broken.
			</p>
		</div>
	);
}
