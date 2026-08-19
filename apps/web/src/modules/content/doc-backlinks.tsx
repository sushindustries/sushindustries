import { Icon, Ref } from "@sushindustries/ui";
import type { ReactNode } from "react";
import type {
	BacklinkRef,
	ComponentBacklinks,
	MentionSource,
} from "./components/backlinks";
import { REFERENCES } from "./references.catalogue";

/*
 * The bottom of a component page: where this element sits in the graph.
 *
 * Three rows, each rendered only when it has something to say - "uses" and
 * "used by" from the registry's own dependency edges, "mentioned in" from a
 * scan of every document body. Every chip wears a pastel tile - its
 * category's tone and glyph for components, the docs and writing tones for
 * pages and posts - so the row reads by colour and shape before by name,
 * exactly like the search results do. The component chips are the same
 * hover-card references prose mentions get.
 *
 * This is the iteration loop made visible: change an element, and its own
 * page ends with the list of places to go look.
 */

export function DocBacklinks({
	links,
}: {
	links: ComponentBacklinks;
}): ReactNode {
	const empty =
		links.uses.length === 0 &&
		links.usedBy.length === 0 &&
		links.mentionedIn.length === 0;

	if (empty) return null;

	return (
		<footer className="border-t mt-7 py-5">
			<ComponentRow label="Uses" refs={links.uses} />
			<ComponentRow label="Used by" refs={links.usedBy} />
			<MentionRow label="Mentioned in" sources={links.mentionedIn} />
		</footer>
	);
}

function Tile({ tone, icon }: Pick<MentionSource, "tone" | "icon">): ReactNode {
	return (
		<span className="tile" data-tone={tone}>
			<Icon name={icon} size={12} />
		</span>
	);
}

function ComponentRow({
	label,
	refs,
}: {
	label: string;
	refs: readonly BacklinkRef[];
}): ReactNode {
	if (refs.length === 0) return null;

	return (
		<div className="flex items-center gap-3 wrap mt-2">
			<span className="label shrink-0">{label}</span>
			<span className="flex items-center gap-3 wrap">
				{refs.map((entry) => {
					const reference = REFERENCES[entry.name];
					// A name with no reference is registry drift the doctor will
					// catch; rendering it bare would link nowhere.
					return reference ? (
						<span key={entry.name} className="inline-flex items-center gap-2">
							<Tile tone={entry.tone} icon={entry.icon} />
							<Ref reference={reference}>{reference.title}</Ref>
						</span>
					) : null;
				})}
			</span>
		</div>
	);
}

function MentionRow({
	label,
	sources,
}: {
	label: string;
	sources: readonly MentionSource[];
}): ReactNode {
	if (sources.length === 0) return null;

	return (
		<div className="flex items-center gap-3 wrap mt-2">
			<span className="label shrink-0">{label}</span>
			<span className="flex items-center gap-3 wrap">
				{sources.map((source) => (
					<span key={source.href} className="inline-flex items-center gap-2">
						<Tile tone={source.tone} icon={source.icon} />
						<a className="ref-link" href={source.href}>
							{source.title}
						</a>
					</span>
				))}
			</span>
		</div>
	);
}
