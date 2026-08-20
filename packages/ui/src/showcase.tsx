import { Fragment, type ReactNode, useEffect, useRef, useState } from "react";
import { CopyButton } from "./copy-button";
import { DEVICES } from "./device-kinds";
import { Icon } from "./icon";
import { useDeviceKind } from "./use-device-kind";

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

/**
 * The frames, derived from the machines the stylesheet already draws.
 *
 * This was six hand-written widths - 320, 390, 900, full, 1280, 1680 - beside
 * `DEVICES`, which is generated from `packages/atoms/devices.md` and says the
 * site has three: a phone, a tablet from 720 and a laptop from 1080. Two
 * tables describing one idea, and they did not agree: none of the six sat on a
 * breakpoint the stylesheet actually uses, so the showcase was reporting how a
 * component behaves at widths the design system has no opinion about.
 *
 * Three now, one per machine, read from that table. Adding a machine to
 * `devices.md` adds a frame here; nothing else has to be touched, and the
 * showcase cannot drift from the breakpoints it is meant to be demonstrating.
 *
 * The laptop is `100%` rather than its drawn width. Pinning the widest frame to
 * a number misreports how a component behaves in a real window, which is the
 * one case where the stage knows better than the table.
 */
/**
 * How tall to render each frame, which the device table cannot say.
 *
 * `DEVICES` describes the machine this site *draws* - its width and the aspect
 * of its chrome - and that is a different fact from the viewport a component
 * should be previewed in. Deriving height from that aspect gave a 704px phone
 * beside a 380px laptop: the smallest machine became the tallest frame, which
 * is exactly backwards.
 *
 * So these are real viewport heights, written down, because nothing generated
 * knows them. They are short on purpose - a frame as tall as a desktop window
 * reports `100dvh` and `min(78dvh, 720px)` as fine when on a phone they are
 * not, which is the failure the small frames exist to catch.
 *
 * The last machine takes the stage's height instead: pinning the widest frame
 * to a number misreports how a component behaves in a real window.
 */
const VIEWPORT_HEIGHT: Record<string, number> = {
	phone: 568,
	tablet: 700,
	laptop: 760,
};

export const SHOWCASE_DEVICES: readonly ShowcaseDevice[] = DEVICES.map(
	(profile) => {
		return {
			id: profile.kind,
			label: profile.label,
			/*
			 * Its own width, including the widest.
			 *
			 * The laptop was `100%`, which is meaningless in the compare row:
			 * three frames in a horizontally scrolling flex container, and one
			 * of them asking for all of a container that is already wider than
			 * the stage. The row overflowed and the frames were clipped.
			 *
			 * The table's width is the honest number - it is what the stylesheet
			 * draws a laptop at - and using it means the compare row is the sum
			 * of three real widths, which is a thing that can scroll properly.
			 */
			width: profile.width,
			height: VIEWPORT_HEIGHT[profile.kind] ?? 640,
			note:
				profile.from === 0
					? "the floor, the narrowest this promises to work at"
					: `from ${profile.from}px, where the stylesheet switches to it`,
		};
	},
);

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
	/** Installer logos, keyed by the same names. Their marks, quoted as images. */
	installLogos?: Readonly<Record<string, string>>;
	/** Height of the desktop frame, which has no device height of its own. */
	height?: number;
	/** Rendered code block. Passed in so this file needs no highlighter. */
	renderCode?: (code: string, language: string) => ReactNode;
	/**
	 * Renders the StackBlitz embed for the Code tab.
	 *
	 * Passed in for the same reason as `renderCode`: this package has no
	 * business depending on the StackBlitz SDK. The host builds a project
	 * from the demo's source and hands it to the SDK; this component only
	 * decides where it goes and when it is visible.
	 */
	renderStackblitz?: (code: string, language: string) => ReactNode;
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
type Tab = "preview" | "code" | "stackblitz";

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
				/*
				 * Sandbox flags are inherited by anything this frame embeds, so
				 * a demo containing a video player is two frames deep and the
				 * player only gets what is granted here. With the minimal set a
				 * third-party player never loads at all - the nested frame ends
				 * on a browser error page before it makes a request - which
				 * looks like a broken component and is a missing token.
				 *
				 * What is still withheld is the part that matters: no
				 * `allow-top-navigation`, so a demo cannot navigate the page
				 * that embeds it.
				 */
				sandbox="allow-scripts allow-same-origin allow-presentation allow-popups allow-popups-to-escape-sandbox allow-forms"
				/*
				 * Permissions are delegated, or a demo that embeds a player is a
				 * demo of a broken player. A frame gets no autoplay, no
				 * fullscreen and no encrypted media unless the frame above it
				 * says so, and a video component previewed here is two frames
				 * deep - so the grant has to be made at this level for the
				 * player inside to receive it. Nothing here grants a camera, a
				 * microphone or a location.
				 */
				allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
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
	installLogos,
	height = 420,
	renderCode,
	renderStackblitz,
}: ShowcaseProps): ReactNode {
	/*
	 * Opens on the machine the reader is actually using.
	 *
	 * It opened on `compare` - three frames side by side before anybody had
	 * asked a question. That is the right view for deciding whether a component
	 * survives every width, and the wrong one for arriving: most readers want to
	 * see the thing, at their own size, and then compare if they care.
	 *
	 * The server cannot know the width, so the first render is the narrowest
	 * machine - the same answer `devices.css` gives an element that matches no
	 * query - and `useDeviceKind` corrects it on mount. Reading `innerWidth`
	 * here instead would disagree with the stylesheet the moment a scrollbar is
	 * involved, which is the bug that hook exists to avoid.
	 */
	const measured = useDeviceKind();
	const [view, setView] = useState<View>(DEVICES[0].kind);

	/*
	 * Only until the reader picks one. After a click this stops following the
	 * window, because a view that changes under somebody resizing their browser
	 * is a view they cannot hold still.
	 */
	const picked = useRef(false);

	useEffect(() => {
		if (picked.current || !measured) return;
		setView(measured);
	}, [measured]);

	function choose(next: View): void {
		picked.current = true;
		setView(next);
	}
	const [tab, setTab] = useState<Tab>("preview");

	const installEntries = Object.entries(install ?? {});
	const shown =
		view === "compare"
			? SHOWCASE_DEVICES
			: SHOWCASE_DEVICES.filter((device) => device.id === view);

	const hasStackblitz = Boolean(code && renderStackblitz);

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
					{hasStackblitz ? (
						<button
							type="button"
							className="showcase-btn"
							data-active={tab === "stackblitz"}
							onClick={() => setTab("stackblitz")}
						>
							StackBlitz
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
							onClick={() => choose("compare")}
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
								onClick={() => choose(device.id)}
							>
								{device.label}
							</button>
						))}
					</fieldset>
				) : null}
			</div>

			{tab === "preview" ? (
				<div className="showcase-stage" data-view={view} data-lenis-prevent>
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
			) : tab === "stackblitz" && hasStackblitz ? (
				/*
				 * The StackBlitz embed. A live, editable copy of the demo running
				 * in a real WebContainer - the reader can change the code and see
				 * the result without leaving the page.
				 */
				<div className="showcase-stackblitz" style={{ height: height + 40 }}>
					{renderStackblitz?.(code ?? "", language)}
				</div>
			) : (
				/*
				 * Code, beside the thing it makes. The split answers "and what
				 * does that render?" without a tab switch: the same iframe the
				 * Preview tab uses, so it costs one lazy document and stays
				 * honest about media queries. On a narrow screen the split
				 * stacks, code first, because the code is what this tab is for.
				 *
				 * The copy button lives here rather than inside `renderCode`, so
				 * the figure's code is copyable whether the host highlighted it
				 * or the fallback <pre> rendered it plain.
				 */
				<div className="showcase-split">
					<div className="showcase-code code-shell" data-lenis-prevent>
						{code && renderCode ? (
							renderCode(code, language)
						) : (
							<pre className="code-block">{code}</pre>
						)}
						{code ? <CopyButton text={code} /> : null}
					</div>
					<iframe
						className="showcase-viewport"
						style={{ height }}
						src={src}
						title={title ? `${title}, running` : "The example, running"}
						sandbox="allow-scripts allow-same-origin"
						loading="lazy"
					/>
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
							<span className="label flex items-center gap-2">
								{installLogos?.[name] ? (
									<img
										className="install-logo"
										src={installLogos[name]}
										alt=""
										loading="lazy"
									/>
								) : null}
								{name}
							</span>
							<code className="code min-w-0">
								{command}
								<CopyButton text={command} ground="paper" />
							</code>
						</Fragment>
					))}
				</figcaption>
			) : null}
		</figure>
	);
}
