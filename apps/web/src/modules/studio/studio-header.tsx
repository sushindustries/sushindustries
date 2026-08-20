import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { number, useAgo } from "./format";
import type { StudioReport } from "./overview/overview.server";
import { readySections } from "./studio.sections";

/*
 * The dashboard's own header: what this is, who is looking, and the four
 * numbers worth seeing before anything else.
 *
 * A dashboard header is a different thing from a page header and the
 * difference is what it is *for*. A page header names what you are reading; a
 * dashboard header answers the question somebody opened the page with -
 * "is it up to date, and how much is in there" - so the numbers are the header
 * rather than something under it.
 *
 * Four tiles, and four is the argument. Every count the report carries would
 * be nine, and nine numbers in a row is a row nobody reads any of. These are
 * the ones that change: how many documents, how much they cost to read, which
 * revision, and when it last ran. The rest are one scroll away in the tables.
 *
 * Wiring: it names this site's routes and this repository's tables, so it
 * stays in the app. Everything visible in it is a utility class from
 * `@sushindustries/atoms` composed in markup - no block class was needed,
 * which is usually the sign that a layout is simple enough to be right.
 */

export interface StudioHeaderProps {
	readonly report: StudioReport;
	readonly login: string;
}

export function StudioHeader({ report, login }: StudioHeaderProps): ReactNode {
	const synced = useAgo(report.syncedAt);
	const documents = report.tables.documents ?? 0;
	const tokens = report.documentsByKind.reduce(
		(total, kind) => total + kind.tokens,
		0,
	);

	const tiles = [
		{ label: "Documents", value: number(documents), note: "indexed" },
		{ label: "Tokens", value: number(tokens), note: "to read all of it" },
		{
			label: "Revision",
			value: report.revision.slice(0, 8),
			note: "content hash",
		},
		{ label: "Synced", value: synced, note: "last sync" },
	];

	return (
		<header className="flex col gap-5">
			<div className="flex items-center gap-4 items-baseline wrap">
				<h1 className="flex-1">Studio</h1>
				<p className="fg-dim mono text-xs">signed in as {login}</p>
			</div>

			{/*
			 * `studio-tiles` rather than `grid` plus an inline template. A grid
			 * template is a layout decision, and a layout decision written as a
			 * style attribute is one no stylesheet can see, theme or override.
			 */}
			<div className="studio-tiles">
				{tiles.map((tile) => (
					<div key={tile.label} className="card gap-1 p-4">
						<span className="label">{tile.label}</span>
						<span className="text-lg mono">{tile.value}</span>
						<span className="fg-dim text-xs">{tile.note}</span>
					</div>
				))}
			</div>

			<nav
				className="flex items-center gap-2 wrap"
				aria-label="Studio sections"
			>
				{/*
				 * The nav is `studio.sections.ts` rendered. It was a literal here
				 * and a second literal in the API description, and the two had
				 * already started to disagree - a section in one and not in the
				 * other, with nothing saying so.
				 */}
				<Link
					to="/studio"
					className="btn btn-ghost"
					// `exact` on the hub only. Without it this stays lit on every
					// child route, because `/studio` is a prefix of all of them.
					activeOptions={{ exact: true }}
					activeProps={{ "aria-current": "page" }}
				>
					Home
				</Link>

				{readySections().map((section) => (
					<Link
						key={section.path}
						to={section.to}
						className="btn btn-ghost"
						activeProps={{ "aria-current": "page" }}
					>
						{section.title}
					</Link>
				))}
			</nav>
		</header>
	);
}
