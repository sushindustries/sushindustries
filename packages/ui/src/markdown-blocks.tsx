import { Children, isValidElement, type ReactNode, useId } from "react";

/*
 * The block layer for Markdown content.
 *
 * `<!-- ::start:name attr="x" -->` blocks come out of the parser as
 * `<md-comment-component data-component="name" data-attributes="{json}">`.
 * This dispatches on that name so a content file can reach a real React
 * component, and an unknown name renders its children instead of throwing —
 * a typo in a post should degrade to plain prose, not a 500.
 */

export interface MarkdownBlockProps {
	attributes: Readonly<Record<string, string>>;
	children?: ReactNode;
}

export type MarkdownBlocks = Readonly<
	Record<string, (props: MarkdownBlockProps) => ReactNode>
>;

interface TabDescriptor {
	slug: string;
	name: string;
}

/** `data-attributes` is JSON written by the parser; treat it as untrusted anyway. */
function readAttributes(raw: unknown): Record<string, unknown> {
	if (typeof raw !== "string" || raw.length === 0) return {};

	try {
		const parsed: unknown = JSON.parse(raw);
		return typeof parsed === "object" && parsed !== null
			? (parsed as Record<string, unknown>)
			: {};
	} catch {
		return {};
	}
}

function toStringMap(
	source: Record<string, unknown>,
): Readonly<Record<string, string>> {
	const out: Record<string, string> = {};

	for (const [key, value] of Object.entries(source)) {
		if (typeof value === "string") out[key] = value;
	}

	return out;
}

/*
 * Tabs, with no JavaScript.
 *
 * A radio group drives the panels through CSS `:checked` sibling selectors.
 * A React state version would be three lines shorter and would also mean the
 * tabs do not work until hydration — on a docs page that is the whole content,
 * so this is worth the markup.
 *
 * `useId` gives the group a name that is stable across server and client,
 * which is what keeps hydration quiet when two tabsets share a page.
 */
function Tabs({
	tabs,
	children,
}: {
	tabs: TabDescriptor[];
	children: ReactNode;
}): ReactNode {
	const groupId = useId();
	const panels = Children.toArray(children).filter(isValidElement);

	if (tabs.length === 0) return <>{children}</>;

	return (
		<div className="tabs">
			<div className="tab-list" role="tablist">
				{tabs.map((tab, index) => (
					<label key={tab.slug} className="tab-label">
						<input
							type="radio"
							name={groupId}
							defaultChecked={index === 0}
							className="tab-radio"
						/>
						<span>{tab.name}</span>
					</label>
				))}
			</div>

			{panels.map((panel, index) => (
				<div
					key={tabs[index]?.slug ?? index}
					className="tab-panel"
					data-index={index}
				>
					{panel}
				</div>
			))}
		</div>
	);
}

interface CommentComponentProps {
	"data-component"?: string;
	"data-attributes"?: string;
	children?: ReactNode;
}

/** Builds the `md-comment-component` mapping around an app's block set. */
export function createBlockDispatcher(blocks: MarkdownBlocks) {
	return function MdCommentComponent(props: CommentComponentProps): ReactNode {
		const name = props["data-component"] ?? "";
		const raw = readAttributes(props["data-attributes"]);

		if (name === "tabs") {
			const tabs = Array.isArray(raw.tabs) ? (raw.tabs as TabDescriptor[]) : [];
			return <Tabs tabs={tabs}>{props.children}</Tabs>;
		}

		const block = blocks[name];
		if (block) {
			return block({ attributes: toStringMap(raw), children: props.children });
		}

		// Unknown block: show what was inside it rather than losing the content.
		return <>{props.children}</>;
	};
}
