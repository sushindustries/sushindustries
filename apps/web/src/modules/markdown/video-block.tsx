import { thingLd } from "@sushindustries/db/schema";
import { EMBED_PROVIDERS } from "@sushindustries/http";
import {
	type MarkdownBlockProps,
	VideoPlayer,
	type VideoProvider,
	type VideoVariant,
} from "@sushindustries/ui";
import { useStore } from "@tanstack/react-store";
import { lazy, type ReactNode, Suspense, useId } from "react";
import { playingVideo, playVideo, stopVideo } from "./video.store";

/*
 * A video, embedded in Markdown.
 *
 *   <!-- ::start:video provider="youtube" id="dQw4w9WgXcQ" title="..." -->
 *   <!-- ::end:video -->
 *
 * The block is the wiring and `VideoPlayer` is the component: the shell,
 * the poster and the buttons are installable from `packages/ui` and know
 * nothing about any vendor, and this file is where a provider name becomes an
 * actual player. That split is why the component has no dependencies while the
 * site can still play Mux.
 *
 * Everything expensive is on the far side of the play button. The player is
 * this block's child, and a child of `VideoPlayer` is only mounted while it is
 * active - so the Mux chunk is fetched by the click that needs it, and the
 * YouTube frame is created by the same one. Stopping unmounts it again.
 */

/*
 * `lazy` at module scope does not fetch at module scope: the import runs the
 * first time React renders the element, which here is the first time somebody
 * presses play. No pacer, deliberately - the pacer defers work nobody asked
 * for until the browser is idle, and this is the opposite of that.
 */
const MuxPlayer = lazy(() => import("@mux/mux-player-react"));

/*
 * The player URL and the poster both come from the provider declaration in
 * `@sushindustries/http`, which is the same object `frame-src` is built
 * from. That is the whole arrangement: a frame this block can point at is a
 * frame the policy already allows, because neither is written twice.
 */
function embedUrl(provider: VideoProvider, source: string): string | undefined {
	return EMBED_PROVIDERS[provider]?.embed?.(source);
}

/** Portrait formats reserve a portrait box, as the declaration says they do. */
function defaultRatio(provider: VideoProvider): string {
	return EMBED_PROVIDERS[provider]?.portrait ? "9 / 16" : "16 / 9";
}

function poster(
	provider: VideoProvider,
	id: string,
	given: string | undefined,
): string | undefined {
	if (given) return given;

	/*
	 * A provider's own still, which is a third-party image request and worth
	 * naming as one. It is a fraction of the player it replaces and it carries
	 * no script, but a site that wants nothing at all to leave it before a
	 * click should pass `poster` and host the frame itself.
	 */
	return EMBED_PROVIDERS[provider]?.poster?.(id);
}

function readProvider(value: string | undefined): VideoProvider {
	return value === "youtube" ||
		value === "mux" ||
		value === "tiktok" ||
		value === "reels"
		? value
		: "file";
}

function readVariant(
	value: string | undefined,
	provider: VideoProvider,
): VideoVariant {
	if (value === "cinema" || value === "card" || value === "reel") return value;
	// A portrait format defaults to the portrait variant, so an author writing
	// the shortest possible block still gets a frame the right shape.
	return provider === "tiktok" || provider === "reels" ? "reel" : "inline";
}

export function VideoBlock({ attributes }: MarkdownBlockProps): ReactNode {
	const blockId = useId();
	const playing = useStore(playingVideo);

	const provider = readProvider(attributes.provider);
	const source = attributes.id || attributes.src || "";
	const title = attributes.title || "Video";

	// A block with no video is an authoring mistake. Saying so beats rendering
	// an empty frame that reads as something still loading.
	if (!source) {
		return (
			<figure className="video">
				<div className="video-stage">
					<p className="label m-0 p-4">video: missing `id` or `src`</p>
				</div>
			</figure>
		);
	}

	const active = playing === blockId;
	const still = poster(provider, source, attributes.poster);

	/*
	 * The video, described in the vocabulary a search engine already reads.
	 *
	 * Built by the same function that builds a stored row's JSON-LD, from the
	 * schema package, so an author's Markdown attributes and a database row
	 * produce the same document. It is emitted here rather than in the route's
	 * head because a block does not know which page it landed on, and a video
	 * with no `VideoObject` beside it is a video no search result will ever
	 * show a thumbnail for.
	 */
	const schema = thingLd({
		type: "VideoObject",
		name: title,
		description: attributes.caption,
		image: still,
		properties: {
			// Subtype properties, spelled as schema.org spells them. Empty ones
			// are dropped by the serialiser rather than published as null.
			thumbnailUrl: still,
			uploadDate: attributes.uploaded,
			duration: attributes.duration,
			embedUrl: embedUrl(provider, source),
			contentUrl: provider === "file" ? source : undefined,
		},
	});

	return (
		<>
			<VideoPlayer
				title={title}
				provider={provider}
				variant={readVariant(attributes.variant, provider)}
				theme={attributes.theme === "dark" ? "dark" : "auto"}
				ratio={attributes.ratio || defaultRatio(provider)}
				poster={still}
				caption={attributes.caption}
				active={active}
				onActiveChange={(next) =>
					next ? playVideo(blockId) : stopVideo(blockId)
				}
			>
				<Player
					provider={provider}
					source={source}
					title={title}
					captions={attributes.captions}
				/>
			</VideoPlayer>

			<script
				type="application/ld+json"
				// biome-ignore lint/security/noDangerouslySetInnerHtml: a JSON-LD script body is data, not markup, and this is JSON.stringify output rather than anything an author wrote.
				dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
			/>
		</>
	);
}

function Player({
	provider,
	source,
	title,
	captions,
}: {
	provider: VideoProvider;
	source: string;
	title: string;
	/** A WebVTT track, for the `file` provider. */
	captions?: string;
}): ReactNode {
	if (provider === "mux") {
		return (
			<Suspense fallback={<p className="label p-4 m-0">Loading the player</p>}>
				<MuxPlayer
					playbackId={source}
					autoPlay
					streamType="on-demand"
					// Mux Data's own title, so a view in the dashboard is
					// identifiable without a second place naming the video.
					metadata={{ video_title: title }}
				/>
			</Suspense>
		);
	}

	const url = embedUrl(provider, source);

	if (url) {
		return (
			<iframe
				/*
				 * Built here, inside the branch that renders once the reader has
				 * pressed play. Written at the top of the component the URL would
				 * ship in the server's HTML, where a preconnect or a prefetch
				 * could act on it and the frame would cost something before
				 * anybody asked for it.
				 */
				src={url}
				title={title}
				/*
				 * The permissions a player actually needs, and no others. Every
				 * one of these is a capability the frame does not get unless it
				 * is named, so the list is short on purpose: `autoplay` because
				 * the reader just pressed play, `encrypted-media` because a
				 * commercial video is DRM'd, `fullscreen` because the bar has a
				 * button for it, and the two motion sensors that 360 video pans
				 * with. Nothing here grants a camera, a microphone or a location.
				 */
				allow="accelerometer; autoplay; clipboard-write; encrypted-media; fullscreen; gyroscope; picture-in-picture; web-share"
				allowFullScreen
				/*
				 * Send the origin, never the path. A reader on an unlisted page
				 * should not have its URL handed to a video host, and providers
				 * only need to know which site framed them.
				 */
				referrerPolicy="strict-origin-when-cross-origin"
			/>
		);
	}

	/*
	 * A plain file. `controls` because there is nothing to proxy them through:
	 * this is the browser's own player, and its controls are better than any
	 * row of buttons I would draw over it.
	 *
	 * Captions come from the `captions` attribute when the author has a track
	 * to give. The rule below wants one unconditionally, which a block that
	 * takes an arbitrary URL cannot promise - so it is suppressed here and
	 * answered in the docs instead.
	 */
	return (
		// biome-ignore lint/a11y/useMediaCaption: the track is the author's to supply, through the block's `captions` attribute.
		<video src={source} title={title} controls autoPlay playsInline>
			{captions ? (
				<track kind="captions" src={captions} default label="Captions" />
			) : null}
		</video>
	);
}
