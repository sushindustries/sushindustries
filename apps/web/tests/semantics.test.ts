import { parseHTML } from "linkedom";
import { beforeAll, describe, expect, inject, test } from "vitest";
import { sitemapPagePaths } from "./setup/roster";

/*
 * The document, checked page by page.
 *
 * The site is fully server-rendered, so everything a page claims to be - its
 * heading outline, its landmarks, its resolved Markdown blocks - is already in
 * the HTML the server sends, before any script runs. That makes the whole
 * site checkable with a fetch and a parser: no browser, a few seconds, every
 * page in the sitemap.
 *
 * The sitemap is the roster on purpose. It is built from the same site index
 * as llms.txt, so a page these tests never saw is a page no crawler was told
 * about either - and the crawl test below closes the loop by failing any page
 * the site links to but does not list.
 *
 * Every test collects offenders across all pages and asserts the list is
 * empty, so one run reports every violation instead of the first.
 */

interface Page {
	readonly path: string;
	readonly html: string;
	readonly document: Document;
}

/** Linked but deliberately unlisted: capabilities and raw files, not pages. */
const NOT_PAGES = ["/preview/", "/r/", "/api/", "/agent-setup", "/health"];

let base = "";
let pages: Page[] = [];

async function fetchAll<T, R>(
	items: readonly T[],
	limit: number,
	work: (item: T) => Promise<R>,
): Promise<R[]> {
	const results: R[] = [];
	for (let start = 0; start < items.length; start += limit) {
		const chunk = items.slice(start, start + limit);
		results.push(...(await Promise.all(chunk.map(work))));
	}
	return results;
}

beforeAll(async () => {
	base = inject("baseUrl");

	const paths = await sitemapPagePaths(base);
	expect(paths.length).toBeGreaterThan(0);

	pages = await fetchAll(paths, 10, async (path) => {
		const response = await fetch(base + path);
		expect(response.status, `${path} did not render`).toBe(200);
		const html = await response.text();
		const { document } = parseHTML(html);

		/*
		 * Scripts carry the serialized loader data, which quotes each page's raw
		 * Markdown - block markers included. The tests are about what a reader
		 * sees, so scripts and styles are out of the document from the start.
		 */
		for (const element of document.querySelectorAll("script, style")) {
			element.remove();
		}

		return { path, html, document };
	});
});

describe("every page in the sitemap", () => {
	test("declares a language and describes itself", () => {
		const offenders = pages.flatMap((page) => {
			const faults: string[] = [];
			if (page.document.documentElement.getAttribute("lang") !== "en") {
				faults.push(`${page.path}: html[lang] is not "en"`);
			}
			if (!page.document.querySelector("title")?.textContent?.trim()) {
				faults.push(`${page.path}: empty or missing <title>`);
			}
			const description = page.document
				.querySelector('meta[name="description"]')
				?.getAttribute("content");
			if (!description?.trim()) {
				faults.push(`${page.path}: empty or missing meta description`);
			}
			return faults;
		});

		expect(offenders).toStrictEqual([]);
	});

	test("carries exactly one h1", () => {
		const offenders = pages
			.map((page) => ({
				path: page.path,
				count: page.document.querySelectorAll("h1").length,
			}))
			.filter((page) => page.count !== 1)
			.map((page) => `${page.path}: ${page.count} h1 elements`);

		expect(offenders).toStrictEqual([]);
	});

	test("never skips a heading level inside main", () => {
		const offenders = pages.flatMap((page) => {
			const main = page.document.querySelector("main");
			if (!main) return [];

			const faults: string[] = [];
			let previous = 0;
			for (const heading of main.querySelectorAll("h1, h2, h3, h4, h5, h6")) {
				const level = Number(heading.tagName.slice(1));
				if (previous > 0 && level > previous + 1) {
					faults.push(
						`${page.path}: h${previous} -> h${level} at "${heading.textContent?.trim().slice(0, 60)}"`,
					);
				}
				previous = level;
			}
			return faults;
		});

		expect(offenders).toStrictEqual([]);
	});

	test("has the three landmarks, main exactly once", () => {
		const offenders = pages.flatMap((page) => {
			const faults: string[] = [];
			const mains = page.document.querySelectorAll("main").length;
			if (mains !== 1) faults.push(`${page.path}: ${mains} main elements`);
			if (!page.document.querySelector("nav")) {
				faults.push(`${page.path}: no nav`);
			}
			if (!page.document.querySelector("footer")) {
				faults.push(`${page.path}: no footer`);
			}
			return faults;
		});

		expect(offenders).toStrictEqual([]);
	});

	test("resolved every Markdown block it declared", () => {
		/*
		 * The parser swallows an unclosed `::start:` silently, taking the rest
		 * of the document with it. The doctor checks the sources; this checks
		 * the other end - no marker may survive into what the server sends.
		 */
		const offenders = pages
			.filter((page) => {
				/*
				 * Code spans are exempt: the grid and spacer pages document the
				 * block syntax, and `::start:grid` inside a `<code>` is the
				 * documentation working, not a marker that failed to resolve.
				 */
				const body = page.document.body;
				if (!body) return false;

				const clone = body.cloneNode(true) as HTMLElement;
				for (const code of clone.querySelectorAll("code, pre")) code.remove();

				const text = clone.textContent ?? "";
				return text.includes("::start:") || text.includes("::end:");
			})
			.map((page) => `${page.path}: unresolved block marker in rendered text`);

		expect(offenders).toStrictEqual([]);
	});

	test("gives every image an alt attribute", () => {
		const offenders = pages.flatMap((page) =>
			[...page.document.querySelectorAll("img:not([alt])")].map(
				(image) =>
					`${page.path}: img without alt (src=${image.getAttribute("src")})`,
			),
		);

		expect(offenders).toStrictEqual([]);
	});
});

describe("every component page", () => {
	test("renders its live preview", () => {
		/*
		 * Registry items only. A few pages under /components/ are concept
		 * guides rather than installable things - the motion guide, the
		 * viewer's model note - and they are identified by what the page
		 * itself publishes: an installable component emits SoftwareSourceCode
		 * structured data, a guide does not. Reading the marker off the page
		 * keeps the test from carrying its own list of exceptions.
		 */
		const offenders = pages
			.filter(
				(page) =>
					page.path.startsWith("/components/") &&
					/*
					 * The overview only. A component is five pages now - the
					 * sections became `/components/<slug>/<section>` rather than
					 * `?tab=` - and the showcase lives in the overview's Markdown,
					 * so requiring one on the API tab is requiring a demo where the
					 * page is deliberately a prop table.
					 *
					 * Two segments after the slash is the overview; three is a
					 * section of it.
					 */
					page.path.split("/").filter(Boolean).length === 2 &&
					page.html.includes("SoftwareSourceCode") &&
					!page.document.querySelector(".showcase"),
			)
			.map((page) => `${page.path}: no rendered showcase`);

		expect(offenders).toStrictEqual([]);
	});
});

describe("the link graph", () => {
	function internalLinks(): Map<string, string[]> {
		const sources = new Map<string, string[]>();
		for (const page of pages) {
			for (const anchor of page.document.querySelectorAll('a[href^="/"]')) {
				const href = anchor.getAttribute("href");
				if (!href) continue;
				const clean = href.split("#")[0] ?? "";
				if (clean.length === 0) continue;
				const from = sources.get(clean) ?? [];
				if (!from.includes(page.path)) from.push(page.path);
				sources.set(clean, from);
			}
		}
		return sources;
	}

	test("every internal link resolves", async () => {
		const links = internalLinks();
		const offenders = (
			await fetchAll(
				[...links.entries()],
				10,
				async ([href, from]): Promise<string | null> => {
					const response = await fetch(base + href, { redirect: "follow" });
					return response.status < 400
						? null
						: `${href}: ${response.status} (linked from ${from.slice(0, 3).join(", ")})`;
				},
			)
		).filter((fault): fault is string => fault !== null);

		expect(offenders).toStrictEqual([]);
	});

	test("every linked page is in the sitemap", () => {
		/*
		 * The other direction of discoverability: a page the site links to but
		 * never lists is invisible to crawlers and to llms.txt, which is how
		 * /p/markdown shipped unlisted. Capabilities and raw files are exempt -
		 * they are fetched, not indexed.
		 */
		const listed = new Set(pages.map((page) => page.path));
		const offenders = [...internalLinks().entries()]
			.filter(([href]) => {
				const path = href.split("?")[0] ?? "";
				if (NOT_PAGES.some((prefix) => path.startsWith(prefix))) return false;
				if (path.includes(".")) return false;
				return !listed.has(path);
			})
			.map(
				([href, from]) =>
					`${href}: linked from ${from.slice(0, 3).join(", ")} but not in the sitemap`,
			);

		expect(offenders).toStrictEqual([]);
	});
});
