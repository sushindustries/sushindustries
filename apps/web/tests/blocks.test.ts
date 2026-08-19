import { parseHTML } from "linkedom";
import { beforeAll, describe, expect, inject, test } from "vitest";

/*
 * The Markdown blocks, checked where they end up.
 *
 * A block is the one part of this site an author writes as a comment and gets
 * back as a component, so the only honest place to check one is the served
 * page: the attributes an author typed have to survive the parser, the
 * component and SSR, and arrive as real markup.
 *
 * The video block is checked hardest because it is the one that can quietly
 * cost the most. A YouTube embed is roughly a megabyte of third-party
 * JavaScript and a set of cookies, and a page with three of them has paid for
 * all three before the reader has pressed anything. The facade is the
 * feature - so "no iframe until asked" is a test, not a comment.
 */

let base = "";
let markdownPage: Document;
let markdownHtml = "";
/** The page's markup with its scripts removed. See below for why. */
let rendered = "";

beforeAll(async () => {
	base = inject("baseUrl");
	const response = await fetch(`${base}/p/markdown`);
	expect(response.status).toBe(200);
	markdownHtml = await response.text();
	markdownPage = parseHTML(markdownHtml).document;

	/*
	 * The router serialises its loader data into a script, and that data
	 * quotes each page's raw Markdown - block markers, embed attributes and
	 * all. Asserting against the whole response therefore asks the source
	 * whether it rendered, which it always answers yes to. Everything below
	 * reads the markup with the scripts taken out, which is the page.
	 */
	const clone = parseHTML(markdownHtml).document;
	for (const script of clone.querySelectorAll("script")) script.remove();
	rendered = clone.body?.innerHTML ?? "";
});

describe("the video block", () => {
	function player(): Element {
		const found = markdownPage.querySelector(".video");
		expect(found, "no .video rendered on /p/markdown").not.toBeNull();
		return found as Element;
	}

	test("renders from its Markdown comment, server-side", () => {
		const video = player();

		expect(video.getAttribute("data-provider")).toBe("youtube");
		// Variants are data attributes, never modifier classes.
		expect(video.getAttribute("data-variant")).toBeTruthy();
		expect(video.className.split(" ")).not.toContain("video--youtube");
	});

	test("loads no third-party frame until the reader asks", () => {
		const video = player();

		expect(video.querySelector("iframe")).toBeNull();
		// Nothing may reach YouTube on first paint: not a frame, not a script.
		expect(markdownHtml).not.toContain("youtube.com/embed");
		expect(markdownHtml).not.toContain("youtube.com/iframe_api");
	});

	test("offers a real button with an accessible name", () => {
		const play = player().querySelector("button");

		expect(play).not.toBeNull();
		expect(play?.getAttribute("type")).toBe("button");
		const name =
			play?.getAttribute("aria-label") || (play?.textContent ?? "").trim();
		expect(
			name.length,
			"the play control has no accessible name",
		).toBeGreaterThan(0);
	});

	test("describes the video it is holding", () => {
		const video = player();
		const poster = video.querySelector("img");

		// A poster is a picture of content, so it carries the title rather than
		// an empty alt: a reader who cannot see it still learns what is here.
		expect(poster?.getAttribute("alt")).toBeTruthy();
		expect(video.textContent).toContain("Rick Astley");
	});

	test("reserves its box, so nothing below it jumps", () => {
		const stage = player().querySelector(".video-stage");
		const style = stage?.getAttribute("style") ?? "";

		// The ratio is the only inline style allowed here: it is data from the
		// author, and a token cannot hold an arbitrary aspect ratio.
		expect(style).toMatch(/--video-ratio:/);
	});
});

describe("every block on the showcase page", () => {
	test("renders the component, not its comment", () => {
		for (const block of ["card", "grid", "showcase", "video"]) {
			expect(
				rendered.includes(`::start:${block}`),
				`${block} left its marker in the page`,
			).toBe(false);
		}

		expect(markdownPage.querySelector(".grid-auto")).not.toBeNull();
		expect(markdownPage.querySelector(".showcase")).not.toBeNull();
		expect(markdownPage.querySelector(".video")).not.toBeNull();
	});
});
