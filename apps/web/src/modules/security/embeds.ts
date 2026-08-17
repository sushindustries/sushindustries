/*
 * Every third party this site can embed, declared once.
 *
 * A provider is two things that must agree: the URL a block points a frame at,
 * and the permission the page needs for that frame to load. Written in two
 * places they drift, and the way they drift is silent - the policy still says
 * `youtube-nocookie.com` while the block has moved to `youtube.com`, and the
 * only symptom is a reader seeing "refused to connect" on a page that worked
 * when it was built.
 *
 * So they are one declaration. The video block builds its URL from `embed()`,
 * and `csp.ts` builds `frame-src` from `frame` - the same object. Adding a
 * provider adds its permission, and there is no list to remember.
 */

export interface EmbedProvider {
	readonly id: string;
	readonly label: string;
	/** The origin a frame is loaded from. Empty when the player is not a frame. */
	readonly frame?: string;
	/** Origins the player fetches stills or media from. */
	readonly img?: readonly string[];
	readonly media?: readonly string[];
	readonly connect?: readonly string[];
	/** The player URL, from an id or a permalink. */
	readonly embed?: (source: string) => string;
	/** The provider's own still, when it publishes one at a predictable URL. */
	readonly poster?: (source: string) => string;
	/** Portrait formats reserve a portrait box. */
	readonly portrait?: boolean;
}

export const EMBED_PROVIDERS: Readonly<Record<string, EmbedProvider>> = {
	/*
	 * The no-cookie host, which is the same player served from a domain that
	 * stores nothing until playback actually starts. `rel=0` keeps the endcard
	 * to the same channel rather than offering the reader somebody else's video
	 * inside my page.
	 */
	youtube: {
		id: "youtube",
		label: "YouTube",
		frame: "https://www.youtube-nocookie.com",
		img: ["https://i.ytimg.com"],
		embed: (source) =>
			`https://www.youtube-nocookie.com/embed/${source}?autoplay=1&rel=0`,
		poster: (source) => `https://i.ytimg.com/vi/${source}/hqdefault.jpg`,
	},

	/*
	 * Mux is not a frame at all: `<mux-player>` is a custom element that fetches
	 * HLS itself, so it needs `connect-src` and `media-src` where the others
	 * need `frame-src`. That difference is exactly why this file describes
	 * origins per directive rather than keeping one list of "allowed sites".
	 */
	mux: {
		id: "mux",
		label: "Mux",
		img: ["https://image.mux.com"],
		/*
		 * A wildcard, and not for convenience.
		 *
		 * `stream.mux.com` is the URL the player is *given*; it is not the host
		 * it ends up talking to. Mux redirects playback to a regional delivery
		 * host - `manifest-gcp-us-east1-vop1.fastly.mux.com` was the one that
		 * failed here - and which region a viewer is sent to is decided by where
		 * that viewer is. Naming the hosts individually would mean a policy that
		 * passes on this machine and blocks the video for somebody on another
		 * continent, which is the worst kind of bug: correct in every test, and
		 * broken for people who cannot tell you why.
		 *
		 * The subdomain wildcard is scoped to a domain we already trust with the
		 * player itself, so it grants nothing that embedding Mux did not.
		 */
		media: ["https://stream.mux.com", "https://*.mux.com"],
		connect: [
			"https://stream.mux.com",
			"https://*.mux.com",
			"https://inferred.litix.io",
		],
		poster: (source) => `https://image.mux.com/${source}/thumbnail.webp`,
	},

	tiktok: {
		id: "tiktok",
		label: "TikTok",
		frame: "https://www.tiktok.com",
		embed: (source) => `https://www.tiktok.com/embed/v2/${source}`,
		portrait: true,
	},

	/*
	 * Facebook's plugin takes the post's permalink rather than an id, so `src`
	 * carries a whole URL for this one. `show_text=false` keeps their caption
	 * out: the page already has one under the frame, and two captions saying
	 * different things is worse than either.
	 */
	reels: {
		id: "reels",
		label: "Reels",
		frame: "https://www.facebook.com",
		embed: (source) =>
			`https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(source)}&show_text=false&autoplay=true`,
		portrait: true,
	},

	/** A file this site serves. No third party, so nothing to allow. */
	file: {
		id: "file",
		label: "Video",
	},
};

/** Origins for one directive, across every provider. Used to build the policy. */
export function embedOrigins(
	directive: "frame" | "img" | "media" | "connect",
): readonly string[] {
	const found = new Set<string>();

	for (const provider of Object.values(EMBED_PROVIDERS)) {
		if (directive === "frame") {
			if (provider.frame) found.add(provider.frame);
			continue;
		}
		for (const origin of provider[directive] ?? []) found.add(origin);
	}

	return [...found].sort();
}
