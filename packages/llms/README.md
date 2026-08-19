# @sushindustries/llms

[GitHub Packages](https://github.com/sushindustries/sushindustries/pkgs/npm/llms)

Generate `llms.txt`, `llms-full.txt`, `robots.txt` and `sitemap.xml` from one
description of a site.

Strings in, strings out. No framework, no filesystem, no router - the same
description can drive a server route, a build script writing files to disk, or
a test asserting the output.

## Install

```bash
pnpm add @sushindustries/llms
```

## Use

```ts
import {
	renderLlmsIndex,
	renderLlmsFull,
	renderRobots,
	renderSitemap,
	type SiteDescription,
} from "@sushindustries/llms";

const site: SiteDescription = {
	origin: "https://example.com",
	title: "Example",
	summary: "One line under the title.",
	framing: "How to read the rest of this file.",
	extraPaths: ["/", "/docs"],
	sections: [
		{
			title: "Docs",
			description: "Optional line under the section heading.",
			entries: [
				{
					path: "/docs/install",
					title: "Install",
					description: "How to install it.",
					body: "# Install\n\nRun the thing.",
				},
			],
		},
	],
};

renderLlmsIndex(site);
renderLlmsFull(site, { indexPath: "/llms.txt" });
renderSitemap(site);
renderRobots(site, {
	disallow: ["/preview/"],
	indexPaths: ["/llms.txt", "/llms-full.txt"],
	contentSignal: { aiTrain: true, search: true, aiInput: true },
});
```

## The four files are layered

| File | Is | For |
| --- | --- | --- |
| `llms.txt` | the map - one line per page | knowing what exists |
| `llms-full.txt` | the territory - every page inlined | reading it, in one request |
| `sitemap.xml` | canonical URLs | search crawlers |
| `robots.txt` | the rules, pointing at the rest | everyone |

A reader that only needs to know what exists fetches the index and stops. One
that needs the content fetches the full file and needs nothing else. Publishing
only the full version makes every lookup expensive; publishing only the index
makes it a round trip per page.

## Why `llms-full.txt` uses frontmatter, not headings

Each page is delimited by a `---` rule and introduced by its own frontmatter
block. That is the difference between a file a human can read and a file a
program can split.

Headings are ambiguous, because page content contains headings too - a parser
looking for `##` has no reliable way to know where one document ends and the
next begins. A rule followed by frontmatter is unambiguous.

```text
---
title: Install
section: Docs
description: How to install it.
source: https://example.com/docs/install
---

# Install

Run the thing.
```

## Content signals

```ts
renderRobots(site, {
	contentSignal: { aiTrain: true, search: true, aiInput: true },
});
```

```text
Content-Signal: ai-train=yes, search=yes, ai-input=yes

User-agent: *
Allow: /
```

It sits above the user-agent block because it describes the content, not one
agent's access to it. Omitting it is not the same as declining - it leaves the
question unanswered, which is how it gets answered for you.

## `noindex` and `extraPaths`

`noindex: true` keeps an entry in the plain-text indexes but out of the
sitemap. Useful for pages that exist to be embedded rather than found.

`extraPaths` covers URLs with no entry of their own - the home page, section
listings - so the sitemap is complete without inventing entries for them.

## Sharded sitemaps

For a site whose sections change on different clocks, the flat sitemap has a
sharded form: an index pointing at one urlset per section.

```ts
import {
	renderSitemapIndex,
	renderSitemapShard,
	renderUrlset,
	sitemapShards,
} from "@sushindustries/llms";

renderSitemapIndex(site); // <sitemapindex> of /sitemap-0.xml, /sitemap-1.xml, ...
renderSitemapShard(site, 0); // one shard as a <urlset>, undefined past the end
sitemapShards(site); // the shard list itself: path + the page paths in it
renderUrlset(site.origin, ["/a", "/b"]); // a urlset for any list of paths
```

Shard 0 is the paths only `extraPaths` knows about; each section with
indexable entries gets the next number. Shards are numbered rather than named
so a section can be renamed without invalidating the URL a crawler already
holds, and a section whose entries are all `noindex` gets no shard at all.
