import {
	type ReactNode,
	useCallback,
	useEffect,
	useId,
	useRef,
	useState,
} from "react";
import { Icon } from "./icon";

/*
 * A video, held behind a picture of itself.
 *
 * Nothing about a video player is expensive until somebody presses play, and
 * every embed on the market gets that backwards: a YouTube iframe is around a
 * megabyte of third-party JavaScript and a set of cookies, spent on arrival,
 * on a page where most readers scroll past. Three of them in a document is
 * three of those. So this renders a poster and a button, and the player it is
 * given does not exist in the DOM until the button is pressed.
 *
 * The player itself is `children`, which is the whole reason this is
 * installable. A component that owned its own embed would own its vendor too:
 * you could not use it without that vendor's package, its account, or its
 * network. Here the shell is the component and the player is whatever the host
 * hands it - Mux, a YouTube frame, a plain `<video>`. This file imports none of
 * them and cannot tell them apart.
 *
 * Stop is the other half, and it is not the same as pause. Pressing it unmounts
 * the player: playback ends, the network goes quiet, and the third party stops
 * watching. A pause button leaves all three running, which is why this one says
 * stop and means it.
 */

export type VideoProvider = "youtube" | "mux" | "tiktok" | "reels" | "file";

/**
 * `inline` sits in the prose column, `cinema` breaks its width on a wide
 * screen, `card` is the compact one for a grid, and `reel` is the portrait
 * one: capped in width and centred, because a 9:16 video given the column's
 * full width is taller than the screen it is being read on.
 */
export type VideoVariant = "inline" | "cinema" | "card" | "reel";

/**
 * `auto` follows the site. `dark` keeps the shell dark in both, which is what
 * a full-bleed or portrait video usually wants around it.
 */
export type VideoTheme = "auto" | "dark";

export interface VideoPlayerProps {
	/**
	 * What the video is. Required, and used three times: the poster's alt
	 * text, the caption under the frame, and the button's accessible name -
	 * "Play" alone tells a screen-reader user nothing on a page with four of
	 * these.
	 */
	title: string;
	/** Only ever a data attribute and a label. Nothing here behaves on it. */
	provider?: VideoProvider;
	/** The still. Without one the frame is a plain ground and the title. */
	poster?: string;
	/** Rendered as `data-variant`, never a modifier class. */
	variant?: VideoVariant;
	/**
	 * Forces the dark frame instead of following the page. `auto` is omitted
	 * rather than written, because a page full of `data-theme="auto"` says
	 * nothing and the selector wants a theme somebody chose.
	 */
	theme?: VideoTheme;
	/** CSS aspect ratio for the reserved box, e.g. `16 / 9`. */
	ratio?: string;
	/** A line under the frame. The title is already shown; this is the rest. */
	caption?: ReactNode;
	/** Where it is hosted, shown on the frame: "YouTube", "Mux". */
	sourceLabel?: string;
	/**
	 * Controlled activation. Leave both out and the component owns its own
	 * state; pass them and the host can enforce one playing video per page.
	 */
	active?: boolean;
	/** Fires in both modes, so a host can coordinate without taking ownership. */
	onActiveChange?: (active: boolean) => void;
	/** The real player. Mounted only while active, so stopping unmounts it. */
	children?: ReactNode;
}

const LABELS: Record<VideoProvider, string> = {
	youtube: "YouTube",
	mux: "Mux",
	tiktok: "TikTok",
	reels: "Reels",
	file: "Video",
};

export function VideoPlayer({
	title,
	provider = "file",
	poster,
	variant = "inline",
	theme = "auto",
	ratio = "16 / 9",
	caption,
	sourceLabel,
	active,
	onActiveChange,
	children,
}: VideoPlayerProps): ReactNode {
	const [ownActive, setOwnActive] = useState(false);
	const stage = useRef<HTMLDivElement>(null);
	const captionId = useId();

	// Controlled when the host passes `active`, uncontrolled otherwise. Both
	// call `onActiveChange`, so a host can coordinate without taking ownership.
	const isActive = active ?? ownActive;

	const setActive = useCallback(
		(next: boolean) => {
			if (active === undefined) setOwnActive(next);
			onActiveChange?.(next);
		},
		[active, onActiveChange],
	);

	/*
	 * Escape stops it, not just fullscreen.
	 *
	 * A reader who has pressed play, gone fullscreen and pressed Escape is
	 * back on the page with a video still running behind the text. Escape here
	 * means "put it back", which is what it meant the first time.
	 */
	useEffect(() => {
		if (!isActive) return;

		const onKey = (event: KeyboardEvent) => {
			if (event.key !== "Escape") return;
			if (document.fullscreenElement) return;
			setActive(false);
		};

		document.addEventListener("keydown", onKey);
		return () => document.removeEventListener("keydown", onKey);
	}, [isActive, setActive]);

	/*
	 * Fullscreen is asked of the stage, not the player.
	 *
	 * The stage is an element this component owns, so it works the same for an
	 * iframe nobody can reach into and a `<video>` with its own controls - and
	 * `requestFullscreen` returns a promise that rejects when the browser or a
	 * permissions policy says no, which is a refusal rather than an error.
	 */
	const goFullscreen = useCallback(() => {
		stage.current?.requestFullscreen?.().catch(() => {});
	}, []);

	const label = sourceLabel ?? LABELS[provider];

	return (
		<figure
			className="video"
			data-provider={provider}
			data-variant={variant}
			// Omitted rather than set to "auto": a page full of `data-theme="auto"`
			// says nothing, and the selector wants a theme that was chosen.
			data-theme={theme === "auto" ? undefined : theme}
			data-active={isActive || undefined}
		>
			<div
				className="video-stage"
				ref={stage}
				// The one inline style here: an author's aspect ratio is data, and
				// no token can hold an arbitrary one.
				style={{ "--video-ratio": ratio } as React.CSSProperties}
			>
				{isActive ? (
					children
				) : (
					<button
						type="button"
						className="video-poster"
						onClick={() => setActive(true)}
						aria-label={`Play ${title}`}
						aria-describedby={captionId}
					>
						{poster ? (
							/*
							 * The poster carries the title rather than an empty alt.
							 * It is a picture of the content, not decoration: a reader
							 * who cannot see it should still learn what is here.
							 */
							<img
								className="video-still"
								src={poster}
								alt={title}
								loading="lazy"
								decoding="async"
							/>
						) : null}

						<span className="video-play">
							<Icon name="play" size={22} />
						</span>

						<span className="video-badge">{label}</span>
					</button>
				)}
			</div>

			<figcaption
				className="flex items-center justify-between gap-3 wrap fg-dim text-sm"
				id={captionId}
			>
				<span className="min-w-0">{title}</span>

				{isActive ? (
					<span className="flex items-center gap-2">
						<button
							type="button"
							className="video-btn"
							onClick={() => setActive(false)}
							aria-label={`Stop ${title}`}
						>
							<Icon name="pause" size={13} />
							Stop
						</button>

						<button
							type="button"
							className="video-btn"
							onClick={goFullscreen}
							aria-label={`Show ${title} fullscreen`}
						>
							<Icon name="expand" size={13} />
						</button>
					</span>
				) : null}
			</figcaption>

			{caption ? (
				<p className="video-caption m-0 fg-faint text-sm">{caption}</p>
			) : null}
		</figure>
	);
}
