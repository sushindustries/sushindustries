import { Fragment, type ReactNode, useState } from "react";
import { Icon } from "./icon";

/**
 * The viewports a component is checked at.
 *
 * Not a rounded-off guess at popular phones. Each width sits on one side of a
 * breakpoint the stylesheet actually contains, so the set exercises every
 * branch in it and nothing else:
 *
 *   320   the floor. Every component here has to work from this width up, and
 *         320 is where the SE and most in-app browsers land. Survive it and
 *         you survive anything.
 *   390   the commonest real phone, still under the 860px breakpoint.
 *   900   between 860 and 1080: past the phone layout, short of the wide one.
 *   full  whatever the page has, because pinning desktop to one number
 *         misreports how a component behaves on a laptop.
 */
export interface ShowcaseDevice {
	readonly id: string;
	readonly label: string;
	/** CSS width of the frame. `100%` means "whatever the stage has". */
	readonly width: string;
	/**
	 * Height of the simulated viewport.
	 *
	 * Real device heights, because a frame as tall as the desktop window
	 * reports `100dvh` and `min(78dvh, 720px)` as fine when on a phone they
	 * are not.
	 */
	readonly height: number;
	/** Why this width. Shown beside the frame, so the set explains itself. */
	readonly note: string;
}

export const SHOWCASE_DEVICES: readonly ShowcaseDevice[] = [
	{
		id: "floor",
		label: "320",
		width: "320px",
		height: 568,
		note: "the floor, the narrowest this promises to work at",
	},
	{
		id: "mobile",
		label: "Mobile",
		width: "390px",
		height: 667,
		note: "under the 860px breakpoint",
	},
	{
		id: "tablet",
		label: "Tablet",
		width: "900px",
		height: 700,
		note: "between 860 and 1080",
	},
	{
		id: "desktop",
		label: "Desktop",
		width: "100%",
		height: 0,
		note: "whatever the page has",
	},
];

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
	/** Height of the desktop frame, which has no device height of its own. */
	height?: number;
	/** Rendered code block. Passed in so this file needs no highlighter. */
	renderCode?: (code: string, language: string) => ReactNode;
}

/*
 * A component, at every width it has to survive, with its source beside it.
 *
 * The preview is an iframe rather than a resized div. That is the only version
 * of this that tells the truth: a div at 390px still inherits the page's
 * viewport, so `@media (max-width: 860px)` never fires and a component can look
 * perfect in the showcase and break on a phone. An iframe has its own viewport,
 * so the media queries are the real ones.
 *
 * Compare is the default rather than an extra. One width at a time answers
 * "does it work here", which is the question you already know the answer to.
 * All of them at once answers "where does it stop working", which is the one
 * worth a screenful.
 */
type View = "compare" | string;

function Frame({
	device,
	src,
	title,
	fallbackHeight,
}: {
	device: ShowcaseDevice;
	src: string;
	title?: string;
	fallbackHeight: number;
}): ReactNode {
	const height = device.height || fallbackHeight;

	return (
		<figure className="showcase-frame" style={{ width: device.width }}>
			{/*
			 * The label is never hidden, including when one device is selected.
			 * A frame with no label is a screenshot; a frame that says 320 and
			 * why 320 is a claim you can check.
			 */}
			<figcaption className="showcase-frame-label flex items-baseline gap-2">
				<strong>{device.label}</strong>
				<span>{device.width.replace("px", "")}</span>
				<span className="showcase-frame-note">{device.note}</span>
			</figcaption>

			<iframe
				className="showcase-viewport"
				style={{ height }}
				src={src}
				title={
					title ? `${title} at ${device.label}` : `Preview at ${device.label}`
				}
				/*
				 * Our own origin, but arbitrary component code. Sandboxing costs
				 * nothing here and means a demo cannot navigate the page that
				 * embeds it.
				 */
				sandbox="allow-scripts allow-same-origin"
				loading="lazy"
			/>
		</figure>
	);
}

export function Showcase({
	src,
	title,
	code,
	language = "tsx",
	install,
	height = 420,
	renderCode,
}: ShowcaseProps): ReactNode {
	const [view, setView] = useState<View>("desktop");
	const [tab, setTab] = useState<"preview" | "code">("preview");

	const installEntries = Object.entries(install ?? {});
	const shown =
		view === "compare"
			? SHOWCASE_DEVICES
			: SHOWCASE_DEVICES.filter((device) => device.id === view);

	return (
		<figure className="showcase">
			<div className="showcase-bar flex items-center justify-between wrap gap-2 py-2 px-3">
				<div className="showcase-group flex items-center gap-1">
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
					<fieldset className="showcase-devices flex items-center m-0">
						<legend className="sr-only">Viewport width</legend>

						<button
							type="button"
							className="showcase-device"
							data-active={view === "compare"}
							aria-pressed={view === "compare"}
							onClick={() => setView("compare")}
						>
							<Icon name="layers" size={13} />
							Compare
						</button>

						{SHOWCASE_DEVICES.map((device) => (
							<button
								key={device.id}
								type="button"
								className="showcase-device"
								data-active={view === device.id}
								aria-pressed={view === device.id}
								onClick={() => setView(device.id)}
							>
								{device.label}
							</button>
						))}
					</fieldset>
				) : null}
			</div>

			{tab === "preview" ? (
				<div className="showcase-stage" data-view={view}>
					{shown.map((device) => (
						<Frame
							key={device.id}
							device={device}
							src={src}
							title={title}
							fallbackHeight={height}
						/>
					))}
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
				/*
				 * A two-column grid, not a stack of flex rows.
				 *
				 * Rows sized themselves before this, so "TanStack" and "shadcn"
				 * pushed their commands to different x positions and the block read
				 * as two unrelated lines. A shared `max-content` column makes every
				 * label the width of the longest one, which is the only way the
				 * commands line up.
				 */
				<figcaption className="showcase-install p-3">
					{installEntries.map(([name, command]) => (
						<Fragment key={name}>
							<span className="label">{name}</span>
							<code className="code min-w-0">{command}</code>
						</Fragment>
					))}
				</figcaption>
			) : null}
		</figure>
	);
}
