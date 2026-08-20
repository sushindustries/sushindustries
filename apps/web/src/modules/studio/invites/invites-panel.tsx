import type { InviteSummary } from "@sushindustries/access";
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
	type Invited,
	LINK_MINUTES,
	LIVES,
	SCOPE_NAMES,
	SCOPES,
	type Scope,
} from "../../access/access.schemas";
import { CREDENTIALS } from "../studio.cache";
import { sendStudioInvite, withdrawStudioInvite } from "./invites.functions";
import { inviteKeys, invitesQueryOptions } from "./invites-query-keys";

/*
 * Invitations, on screen: send on the left, everything sent on the right.
 *
 * The same arrangement as the tokens panel, deliberately, because it is the
 * same act seen from the other end - there I mint a credential and hold it,
 * here I arrange for somebody else to. Two screens that do one thing each and
 * look alike teach the studio once.
 *
 * What this page must never do is show a link that was successfully sent. When
 * a mailer is configured the URL does not come back from the server at all, so
 * the interface cannot leak it by accident; when there is no mailer it does,
 * and the box that shows it says out loud what that costs.
 */

const when = (value: string | null) =>
	value ? new Date(value).toLocaleString() : "-";

const TONE: Record<InviteSummary["state"], string> = {
	waiting: "docs",
	collected: "",
	expired: "",
	withdrawn: "",
};

export function InvitesPanel(): ReactNode {
	const client = useQueryClient();
	const invites = useQuery(invitesQueryOptions());

	const [email, setEmail] = useState("");
	const [tokenName, setTokenName] = useState("");
	const [scopes, setScopes] = useState<readonly Scope[]>(["docs:read"]);
	const [life, setLife] = useState<string>("90");
	const [sent, setSent] = useState<Invited | null>(null);

	const send = useMutation({
		scope: CREDENTIALS,
		mutationFn: () =>
			sendStudioInvite({
				data: {
					email: email.trim().toLowerCase(),
					tokenName: tokenName.trim(),
					scopes: [...scopes],
					expiresInDays: life === "never" ? null : Number(life),
				},
			}),
		onSuccess: (result) => {
			setSent(result);
			setEmail("");
			setTokenName("");
			client.invalidateQueries({ queryKey: inviteKeys.all });
		},
	});

	const take = useMutation({
		scope: CREDENTIALS,
		mutationFn: (id: string) => withdrawStudioInvite({ data: { id } }),
		onSuccess: () => {
			client.invalidateQueries({ queryKey: inviteKeys.all });
		},
	});

	const all = invites.data ?? [];
	const waiting = all.filter((one) => one.state === "waiting");

	const toggle = (scope: Scope) =>
		setScopes((current) =>
			current.includes(scope)
				? current.filter((one) => one !== scope)
				: [...current, scope],
		);

	const columns: DataTableColumn<InviteSummary>[] = [
		{ id: "email", header: "Sent to", sortable: true },
		{ id: "tokenName", header: "For", cell: (row) => row.tokenName },
		{
			id: "scopes",
			header: "Opens",
			cell: (row) => row.scopes.join(" · "),
		},
		{
			id: "createdAt",
			header: "Sent",
			sortable: true,
			cell: (row) => when(row.createdAt),
		},
		{
			id: "state",
			header: "State",
			cell: (row) =>
				row.state === "waiting" ? (
					<span className="flex items-center gap-2">
						<Badge tone={TONE[row.state]}>waiting</Badge>
						<Button
							variant="ghost"
							disabled={take.isPending}
							onClick={() => take.mutate(row.id)}
						>
							Withdraw
						</Button>
					</span>
				) : row.state === "collected" ? (
					/*
					 * A collected invitation points at the tokens page rather than
					 * offering to take itself back. Withdrawing it would change
					 * nothing that matters - the token it produced is the live thing,
					 * and that is where it can actually be revoked.
					 */
					<Button variant="ghost" href="/studio/tokens">
						Collected · see the token
					</Button>
				) : (
					<Badge>{row.state}</Badge>
				),
		},
	];

	return (
		<Workbench
			title="invites"
			label="Giving somebody a token without ever holding it"
			maxHeight="min(74vh, 52rem)"
			rail={
				<form
					className="flex col gap-3"
					onSubmit={(event) => {
						event.preventDefault();
						if (email.trim() && tokenName.trim() && scopes.length > 0) {
							send.mutate();
						}
					}}
				>
					<p className="label">Invite someone</p>

					<Field
						label="Their email"
						hint={`The link lasts ${LINK_MINUTES} minutes and works once.`}
					>
						<Input
							type="email"
							value={email}
							maxLength={254}
							required
							placeholder="someone@example.com"
							onChange={(event) => setEmail(event.target.value)}
						/>
					</Field>

					<Field
						label="What the token is for"
						hint="How it will appear in the tokens list once they collect it."
					>
						<Input
							value={tokenName}
							maxLength={64}
							required
							placeholder="their agent"
							onChange={(event) => setTokenName(event.target.value)}
						/>
					</Field>

					<fieldset className="flex col gap-2">
						<legend className="label">What it will open</legend>
						{SCOPE_NAMES.map((scope) => (
							<Checkbox
								key={scope}
								label={SCOPES[scope].title}
								checked={scopes.includes(scope)}
								onChange={() => toggle(scope)}
							/>
						))}
					</fieldset>

					<Field label="How long their token lasts">
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
						disabled={
							send.isPending ||
							!email.trim() ||
							!tokenName.trim() ||
							scopes.length === 0
						}
					>
						{send.isPending ? "Sending…" : "Send the invitation"}
					</Button>

					{send.isError ? (
						<Alert title="That did not send" tone="caution" live>
							{(send.error as Error).message}
						</Alert>
					) : null}
				</form>
			}
			status={
				<>
					<span className="workbench-stat">
						<b>{waiting.length}</b> waiting
					</span>
					<span className="workbench-stat">
						<b>{all.filter((one) => one.state === "collected").length}</b>{" "}
						collected
					</span>
					{invites.isFetching ? (
						<span className="workbench-stat">refreshing…</span>
					) : null}
				</>
			}
		>
			<div className="flex col gap-5">
				{sent ? <Sent sent={sent} onDismiss={() => setSent(null)} /> : <Why />}

				<section className="flex col gap-3">
					<h3>Everything sent</h3>
					<DataTable
						label="Every invitation, and what became of it"
						rows={all}
						columns={columns}
						sortBy="createdAt"
						descending
						empty="Nobody has been invited. An invitation is how somebody gets a token without either of us putting it in a message."
					/>
				</section>
			</div>
		</Workbench>
	);
}

/**
 * What happened to the invitation just created.
 *
 * Three outcomes and three different things to say. A sent link is finished
 * business; a link with no mailer has to be carried by hand and is worth
 * saying so about; a failed send left a live invitation and the link, which is
 * recoverable and reads as an error rather than a success.
 */
function Sent({
	sent,
	onDismiss,
}: {
	readonly sent: Invited;
	readonly onDismiss: () => void;
}): ReactNode {
	if (sent.delivered === "sent") {
		return (
			<Alert title={`Sent to ${sent.summary.email}`} tone="tip" live>
				<p>
					The link is in their inbox and never came back through this page,
					which is what makes collecting it evidence that the address was
					theirs. It works once, within {LINK_MINUTES} minutes.
				</p>
				<Button variant="ghost" onClick={onDismiss}>
					Done
				</Button>
			</Alert>
		);
	}

	return (
		<Alert
			title={
				sent.delivered === "failed"
					? "The invitation exists, but sending it failed"
					: `Nothing was sent to ${sent.summary.email}`
			}
			tone="caution"
			live
		>
			<p>{sent.detail}</p>
			<p>
				The invitation is live either way, so hand this over yourself. It works
				once, within {LINK_MINUTES} minutes, and whoever opens it gets the token
				- which means passing it along is not proof of anything about who
				receives it, the way a delivered email would be.
			</p>

			{sent.url ? (
				<SecretReveal value={sent.url} label="Copy the link">
					<Button variant="ghost" onClick={onDismiss}>
						Done
					</Button>
				</SecretReveal>
			) : (
				<Button variant="ghost" onClick={onDismiss}>
					Done
				</Button>
			)}
		</Alert>
	);
}

function Why(): ReactNode {
	return (
		<div className="flex col gap-3">
			<h2>Nothing exists until the link is used</h2>
			<p className="fg-dim">
				An invitation is not a token in an email. It is a record that says which
				scopes a token <em>would</em> carry, and the credential is minted at the
				moment somebody collects it - so an invitation sitting unread opens
				nothing, and one that is never collected can be withdrawn without ever
				having been a key.
			</p>
			<p className="fg-dim">
				It is also the only way anybody but me gets in. Signing in to this
				studio is one GitHub login checked against the repository owner and no
				link changes that; what a link grants is an API token, which is a
				different thing with a much smaller surface.
			</p>
			<p className="fg-dim">
				The address matters because receiving the link is the only proof of an
				email this system ever collects. That is why the account is created when
				it is redeemed rather than when it is sent.
			</p>
		</div>
	);
}
