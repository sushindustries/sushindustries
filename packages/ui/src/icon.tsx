import type { ReactNode } from "react";

/*
 * Generated from `packages/ui/glyphs.md`. Do not edit by hand.
 *
 * The set lives in Markdown because that is where each drawing can carry the
 * reason for it, and it is generated into a component because a library cannot
 * read a Markdown file at runtime without stopping being installable.
 *
 * Add a glyph with `pnpm new glyph <name>`, then `pnpm doctor --fix`.
 */

export type IconName =
	| "cube"
	| "package"
	| "note"
	| "layers"
	| "motion"
	| "grid"
	| "text"
	| "book"
	| "rule"
	| "chevron"
	| "folder"
	| "folder-open"
	| "file"
	| "dots"
	| "download"
	| "share"
	| "link"
	| "close"
	| "search"
	| "sushi"
	| "sun"
	| "moon"
	| "contrast"
	| "chat"
	| "linkedin"
	| "clock"
	| "calendar"
	| "copy"
	| "github"
	| "cursor"
	| "spark"
	| "terminal"
	| "star"
	| "check"
	| "play"
	| "pause"
	| "expand"
	| "send";

export interface IconProps {
	name: IconName;
	/** Matches the surrounding text size by default. */
	size?: number;
	className?: string;
}

const PATHS: Record<IconName, ReactNode> = {
	// An isometric cube. The 3D viewer.
	cube: (
		<>
			<path d="M12 2.5 21 7v10l-9 4.5L3 17V7z" />
			<path d="M3 7l9 4.5L21 7" />
			<path d="M12 11.5v10" />
		</>
	),
	// A taped box seen from above.
	package: (
		<>
			<path d="M3 7.5 12 3l9 4.5v9L12 21l-9-4.5z" />
			<path d="M7.5 5.25 16.5 9.75V18" />
		</>
	),
	// A page with a folded corner and two lines of writing.
	note: (
		<>
			<path d="M5 3h9l5 5v13H5z" />
			<path d="M14 3v5h5" />
			<path d="M9 13h6M9 17h4" />
		</>
	),
	// Two stacked plates. Components, which are things on things.
	layers: (
		<>
			<path d="M12 3 3 8l9 5 9-5z" />
			<path d="M3 13.5 12 18.5l9-5" />
		</>
	),
	// An arc with a leading dot: something travelling, not something spinning.
	motion: (
		<>
			<path d="M3 17c4-9 14-9 18 0" />
			<path d="M20 14.5a2 2 0 1 1-4 0 2 2 0 0 1 4 0" />
		</>
	),
	// Four cells. Layout, and what the Grid component does.
	grid: (
		<>
			<path d="M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z" />
		</>
	),
	// Ragged lines. Prose, which is what content means here.
	text: (
		<>
			<path d="M4 6h16M4 11h12M4 16h14M4 21h8" />
		</>
	),
	// An open book. Docs.
	book: (
		<>
			<path d="M4 4h6a3 3 0 0 1 3 3v13a2.5 2.5 0 0 0-2.5-2.5H4z" />
			<path d="M20 4h-6a3 3 0 0 0-3 3v13a2.5 2.5 0 0 1 2.5-2.5H20z" />
		</>
	),
	// A gap held open between two rules. The Spacer, drawn as the thing it inserts.
	rule: (
		<>
			<path d="M4 6h16M4 18h16" />
			<path d="M12 10v4" />
		</>
	),
	// Down. Rotated by CSS wherever it needs to point elsewhere.
	chevron: (
		<>
			<path d="M6 9.5 12 15l6-5.5" />
		</>
	),
	// A tab and a body. The one shape everyone already reads as "things are in here".
	folder: (
		<>
			<path d="M3 6.5A1.5 1.5 0 0 1 4.5 5h4l2 2.5h9A1.5 1.5 0 0 1 21 9v8.5a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 17.5z" />
		</>
	),
	// The same folder with its front leaning away. Open, without a second metaphor.
	"folder-open": (
		<>
			<path d="M3 7a1.5 1.5 0 0 1 1.5-1.5h4L11 8h8A1.5 1.5 0 0 1 20.5 9.5v1" />
			<path d="M3 17.2 5.4 11a1.5 1.5 0 0 1 1.4-1h14.1a1 1 0 0 1 .95 1.3L19.8 18a1.5 1.5 0 0 1-1.4 1H4.5A1.5 1.5 0 0 1 3 17.5z" />
		</>
	),
	// A page with a folded corner and two lines. A thing, not a container.
	file: (
		<>
			<path d="M6 3h8l4 4v14H6z" />
			<path d="M14 3v4h4" />
			<path d="M9 12h6M9 16h4" />
		</>
	),
	// Three dots. The menu you can reach without a right mouse button.
	dots: (
		<>
			<path d="M12 5.5a1 1 0 1 0 0-.01" />
			<path d="M12 12.5a1 1 0 1 0 0-.01" />
			<path d="M12 19.5a1 1 0 1 0 0-.01" />
		</>
	),
	// An arrow into a tray. Down means onto your machine.
	download: (
		<>
			<path d="M12 3v11" />
			<path d="M7.5 10 12 14.5 16.5 10" />
			<path d="M4 17.5v2A1.5 1.5 0 0 0 5.5 21h13a1.5 1.5 0 0 0 1.5-1.5v-2" />
		</>
	),
	// The download arrow, reversed. Up means away from here.
	share: (
		<>
			<path d="M12 16V4" />
			<path d="M7.5 8.5 12 4l4.5 4.5" />
			<path d="M4 15v4.5A1.5 1.5 0 0 0 5.5 21h13a1.5 1.5 0 0 0 1.5-1.5V15" />
		</>
	),
	// Two links of a chain.
	link: (
		<>
			<path d="M10 13.5a3.5 3.5 0 0 0 5 0l3-3a3.54 3.54 0 0 0-5-5l-1.2 1.2" />
			<path d="M14 10.5a3.5 3.5 0 0 0-5 0l-3 3a3.54 3.54 0 0 0 5 5l1.2-1.2" />
		</>
	),
	// A cross. Nothing else means close.
	close: (
		<>
			<path d="M6 6l12 12M18 6 6 18" />
		</>
	),
	// A lens and a handle.
	search: (
		<>
			<path d="M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14z" />
			<path d="M16.2 16.2 21 21" />
		</>
	),
	// A maki roll seen end on, which is the only angle at which a roll is legible at 24px: nori, rice, filling, three concentric circles. The four ticks are the tell - they are register marks rather than decoration, and they are what stops it reading as a record, a target or a loading spinner.
	sushi: (
		<>
			<path d="M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z" />
			<path d="M12 7.5a4.5 4.5 0 1 0 0 9 4.5 4.5 0 0 0 0-9z" />
			<path d="M12 10.5a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3z" />
			<path d="M3.2 12h1.6" />
			<path d="M19.2 12h1.6" />
			<path d="M12 3.2v1.6" />
			<path d="M12 19.2v1.6" />
		</>
	),
	// A disc and eight rays. Eight rather than four, because four reads as a compass; and the rays are detached from the disc so the whole thing still resolves at 15px.
	sun: (
		<>
			<path d="M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z" />
			<path d="M12 2.5v2" />
			<path d="M12 19.5v2" />
			<path d="M4.2 4.2l1.4 1.4" />
			<path d="M18.4 18.4l1.4 1.4" />
			<path d="M2.5 12h2" />
			<path d="M19.5 12h2" />
			<path d="M4.2 19.8l1.4-1.4" />
			<path d="M18.4 5.6l1.4-1.4" />
		</>
	),
	// One crescent, cut by an offset circle rather than drawn as a shape. A moon with stars beside it is three marks fighting for the same 15 pixels.
	moon: (
		<>
			<path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" />
		</>
	),
	// A circle half filled: the standard mark for "follow the system", and the only one of the three that means a rule rather than a state.
	contrast: (
		<>
			<path d="M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z" />
			<path d="M12 3v18a9 9 0 0 0 0-18z" />
		</>
	),
	// One speech bubble with a tail, and no second bubble behind it. Two bubbles say conversation and are half the size each at 24px, where the tail is the only part that still reads.
	chat: (
		<>
			<path d="M4 5h16v11H9l-5 4z" />
		</>
	),
	// The wordmark reduced to its two letters in a square, drawn at this stroke weight rather than pasted in as a logo.
	linkedin: (
		<>
			<path d="M4 4h16v16H4z" />
			<path d="M8 10.5v6" />
			<path d="M8 7.6v.1" />
			<path d="M11.6 16.5v-6" />
			<path d="M11.6 13.2a2.6 2.6 0 0 1 5.2 0v3.3" />
		</>
	),
	// A face and two hands.
	clock: (
		<>
			<path d="M12 4a8 8 0 1 0 0 16 8 8 0 0 0 0-16z" />
			<path d="M12 7.6V12l3 1.8" />
		</>
	),
	// A month, with the header band ruled off and two rings above it. Beside the clock it is unmistakably a date rather than a duration, which is the only distinction the two have to carry.
	calendar: (
		<>
			<path d="M4 7.5A1.5 1.5 0 0 1 5.5 6h13A1.5 1.5 0 0 1 20 7.5v11a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 18.5z" />
			<path d="M4 10.5h16" />
			<path d="M8.5 3.5v4" />
			<path d="M15.5 3.5v4" />
		</>
	),
	// Two pages, the front one whole and the back one implied by two edges. The duplicate is the message, not the clipboard.
	copy: (
		<>
			<path d="M9 8.5h10.5V21H9z" />
			<path d="M5 15.5v-12h9" />
		</>
	),
	// The octocat as an outline, at this set's stroke rather than as a pasted logo - the tentacle-arm is the part that makes it read at 15px.
	github: (
		<>
			<path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
			<path d="M9 18c-4.51 2-5-2-7-2" />
		</>
	),
	// A pointer, mid-click. The editor named after it uses the same shape for the same reason.
	cursor: (
		<>
			<path d="M6 3.5 19 11l-5.6 1.6L10 19z" />
		</>
	),
	// A six-ray asterisk: the generic mark for an AI assistant, drawn at this set's stroke rather than borrowed from any one vendor.
	spark: (
		<>
			<path d="M12 3v18" />
			<path d="M4.2 7.5l15.6 9" />
			<path d="M19.8 7.5 4.2 16.5" />
		</>
	),
	// A frame, a prompt chevron, a cursor line. The shell, drawn as the window it runs in.
	terminal: (
		<>
			<path d="M4 5h16v14H4z" />
			<path d="M7.5 9.5 10.5 12l-3 2.5" />
			<path d="M12.5 15h4" />
		</>
	),
	// Five points, closed. The one shape GitHub taught everyone to press.
	star: (
		<>
			<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z" />
		</>
	),
	// A tick. It replaces the copy glyph for a moment, so it is drawn at the same weight and nothing else moves.
	check: (
		<>
			<path d="M5 13l4.5 4.5L19 7.5" />
		</>
	),
	// A right-pointing triangle, closed. The one control nobody has to be taught.
	play: (
		<>
			<path d="M8.5 5.5 18.5 12l-10 6.5z" />
		</>
	),
	// Two bars at the play triangle's height, so the button does not change size when it changes meaning.
	pause: (
		<>
			<path d="M9.5 5.5v13M14.5 5.5v13" />
		</>
	),
	// Two corners and the arrows leaving them. Fullscreen, drawn as the direction it goes.
	expand: (
		<>
			<path d="M9.5 4.5h-5v5" />
			<path d="M14.5 19.5h5v-5" />
			<path d="M4.5 4.5 10 10" />
			<path d="M19.5 19.5 14 14" />
		</>
	),
	// A paper aeroplane. The second stroke is the near wing's crease, and it is the whole glyph: without it this is an arrowhead at 13px, and an arrowhead already means something else here.
	send: (
		<>
			<path d="M21.5 2.5 2.5 10.2l7.3 2.9 2.9 7.3z" />
			<path d="M21.5 2.5 9.8 13.1" />
		</>
	),
};

export function Icon({ name, size = 16, className }: IconProps): ReactNode {
	return (
		<svg
			className={className}
			width={size}
			height={size}
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="1.5"
			strokeLinecap="round"
			strokeLinejoin="round"
			// Decorative: every icon here sits beside its own text label.
			aria-hidden="true"
			focusable="false"
		>
			{PATHS[name]}
		</svg>
	);
}
