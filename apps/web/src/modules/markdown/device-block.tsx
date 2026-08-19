import {
	Device,
	type DeviceKind,
	FolderShelf,
	type MarkdownBlockProps,
	type ShelfEntry,
} from "@sushindustries/ui";
import type { ReactNode } from "react";
import { SiteAssistant } from "../assistant/site-assistant";
import { findDesk } from "../content/desks/desks.catalogue";

/*
 * A machine, with a desk on it, from Markdown.
 *
 *   <!-- ::start:device from="home" kind="laptop" title="SUSHINDUSTRIES" -->
 *   <!-- ::end:device -->
 *
 * The desk is `content/desks/<from>.md`, where one line is one icon and the
 * extension on it decides what the icon is. So putting an app on the screen is
 * adding `assistant.app` to a Markdown list, and nothing here changes.
 *
 * The list is a separate file rather than the block's own body because a block
 * receives its children already rendered - by the time this function runs the
 * list is React elements, not text, and a desk built by walking rendered
 * elements would break the first time somebody put emphasis in a label.
 * Keeping it in `content/desks/` also makes a desk reusable: the same machine
 * can appear on the front page and in a post without either copying it.
 */

const KINDS: readonly DeviceKind[] = ["phone", "tablet", "laptop"];

function readKind(value: string | undefined): DeviceKind | undefined {
	return KINDS.find((kind) => kind === value);
}

/*
 * What an `.app` entry opens.
 *
 * A map from name to element, so `assistant.app` in Markdown finds the panel
 * without the catalogue knowing React exists. Adding an app is a line here and
 * a line in the desk file, which is the smallest a two-sided thing gets.
 */
const APPS: Readonly<Record<string, () => ReactNode>> = {
	assistant: () => <SiteAssistant />,
};

export function DeviceBlock({ attributes }: MarkdownBlockProps): ReactNode {
	const desk = findDesk(attributes.from ?? "home");
	if (!desk) return null;

	/*
	 * Only apps render something; everything else is a folder or a link and the
	 * shelf already knows what to do with those. Returning `undefined` for a
	 * leaf is what keeps it a link rather than a window.
	 */
	function renderEntry(entry: ShelfEntry): ReactNode {
		const app = entry.id.endsWith(".app")
			? APPS[entry.id.replace(/\.app$/, "")]
			: undefined;

		return app ? app() : undefined;
	}

	return (
		<Device kind={readKind(attributes.kind)} title={attributes.title}>
			<FolderShelf
				entries={desk.entries}
				renderEntry={renderEntry}
				rememberAs={`desk.${desk.slug}`}
			/>
		</Device>
	);
}
