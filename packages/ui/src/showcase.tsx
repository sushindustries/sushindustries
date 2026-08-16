import { type ReactNode, useId, useState } from "react";
import { Icon } from "./icon";

export type Viewport = "mobile" | "tablet" | "desktop";

export interface ShowcaseProps {
	/** URL of a bare page rendering just the component. */
	src: string;
	title?: string;
	/** Source of the example, shown under the Code tab. */
	code?: string;
	/** Language for the code fence. */
	language?: string;
	/** Install commands, keyed by installer name. */
	install?: Readonly<Record<string, string>>;
	height?: number;
	/** Rendered code block. Passed in so this file needs no highlighter. */
	renderCode?: (code: string, language: string) => ReactNode;
}

/*
 * A component, shown at three viewport widths, with its source beside it.
 *
 * The preview is an iframe rather than a resized div. That is the only version
 * of this that tells the truth: a div at 390px still inherits the page's
 * viewport, so `@media (max-width: 860px)` never fires and a component can look
 * perfect in the showcase and break on a phone. An iframe has its own viewport,
 * so the media queries are the real ones.
 *
 * Widths are the common device classes rather than exact models — 390 is most
 * phones, 834 is a portrait tablet. Desktop is "whatever the page has", because
 * pinning it to 1280 would misreport how it behaves on a laptop.
 */
const WIDTHS: Readonly<Record<Viewport, string>> = {
	mobile: "390px",
	tablet: "834px",
	desktop: "100%",
};

const VIEWPORTS: ReadonlyArray<{ id: Viewport; label: string }> = [
	{ id: "desktop", label: "Desktop" },
	{ id: "tablet", label: "Tablet" },
	{ id: "mobile", label: "Mobile" },
];

export function Showcase({
	src,
	title,
	code,
	language = "tsx",
	install,
	height = 420,
	renderCode,
}: ShowcaseProps): ReactNode {
	const [viewport, setViewport] = useState<Viewport>("desktop");
	const [tab, setTab] = useState<"preview" | "code">("preview");
	const frameId = useId();

	const installEntries = Object.entries(install ?? {});

	return (
		<figure className="showcase">
			<div className="showcase-bar flex items-center justify-between wrap gap-2 py-2 px-3">
				<div
					className="flex items-center gap-1"
					role="tablist"
					aria-label="View"
				>
					<button
						type="button"
						className="showcase-btn"
						data-active={tab === "preview"}
						onClick={() => setTab("preview")}
					>
						Preview
					</button>
					{code ? (
						<button
							type="button"
							className="showcase-btn"
							data-active={tab === "code"}
							onClick={() => setTab("code")}
						>
							Code
						</button>
					) : null}
				</div>

				{/* Width control is meaningless while reading source. */}
				{tab === "preview" ? (
					<fieldset className="showcase-group flex items-center gap-1 m-0">
						<legend className="sr-only">Viewport width</legend>
						{VIEWPORTS.map((entry) => (
							<button
								key={entry.id}
								type="button"
								className="showcase-btn"
								data-active={viewport === entry.id}
								onClick={() => setViewport(entry.id)}
								aria-pressed={viewport === entry.id}
							>
								<Icon name="layers" size={13} />
								{entry.label}
							</button>
						))}
					</fieldset>
				) : null}
			</div>

			{tab === "preview" ? (
				<div className="showcase-stage" style={{ height }}>
					<iframe
						id={frameId}
						className="showcase-frame"
						style={{ width: WIDTHS[viewport] }}
						src={src}
						title={title ? `${title} preview` : "Component preview"}
						/*
						 * The preview is our own origin but arbitrary component code.
						 * Sandboxing costs nothing here and means a demo cannot
						 * navigate the page that embeds it.
						 */
						sandbox="allow-scripts allow-same-origin"
						loading="lazy"
					/>
				</div>
			) : (
				<div className="showcase-code">
					{code && renderCode ? (
						renderCode(code, language)
					) : (
						<pre className="code-block">{code}</pre>
					)}
				</div>
			)}

			{installEntries.length > 0 ? (
				<figcaption className="showcase-install flex col gap-2 p-3">
					{installEntries.map(([name, command]) => (
						<div key={name} className="flex items-center gap-3 min-w-0">
							<span className="label shrink-0">{name}</span>
							<code className="code flex-1 min-w-0">{command}</code>
						</div>
					))}
				</figcaption>
			) : null}
		</figure>
	);
}
