import type { ReactNode } from "react";

export interface AlertProps {
	title: string;
	children?: ReactNode;
	/** What kind of news this is. `note` is the calm default. */
	tone?: "note" | "tip" | "caution";
	/** Only interruptions are announced; page furniture is not. */
	live?: boolean;
}

/*
 * The callout, reachable from JSX. Markdown already renders `> [!NOTE]` as
 * this exact box; the component exists so an application state - a failed
 * save, a quota - can wear the same box without being written in Markdown.
 * `role="alert"` only when asked: most alerts are read in place, and a page
 * of assertive regions is a page that will not stop talking.
 */
export function Alert({
	title,
	children,
	tone = "note",
	live,
}: AlertProps): ReactNode {
	const kind = tone === "tip" ? "tip" : tone === "caution" ? "caution" : "note";

	return (
		<div
			className={`markdown-alert markdown-alert-${kind}`}
			role={live ? "alert" : undefined}
		>
			<p className="markdown-alert-title">{title}</p>
			{children ? (
				<div className="markdown-alert-content text-sm">{children}</div>
			) : null}
		</div>
	);
}
