/*
 * The site's identity, as one typed record.
 *
 * This existed as the same string pasted into fifteen files - every <title>,
 * the og tags, the nav wordmark, the footer, the breadcrumb root, the llms.txt
 * header - and renaming the site meant finding all fifteen. Now the name is
 * data like everything else on this site: change it here, and every surface
 * that says it follows.
 */

export interface SiteIdentity {
	/** The visible name - hero, nav wordmark, titles, og:site_name. */
	name: string;
	/** The one-sentence description behind every default meta tag. */
	description: string;
	/** Canonical origin, no trailing slash. */
	url: string;
	github: string;
	/** The mark, site-relative: favicon, nav, and the default social image. */
	image: string;
}

export const SITE: SiteIdentity = {
	// A placeholder while the brand settles; the packages keep their
	// @sushindustries scope regardless - npm names are addresses, not copy.
	name: "Adam Jurek",
	description:
		"Small packages, built carefully. Tools, libraries and components from Adam Jurek.",
	url: "https://adamjurek.com",
	github: "https://github.com/sushindustries",
	image: "/sushi-logo.png",
};

/** `pageTitle("Components")` → `Components - Adam Jurek`. Bare → the name. */
export function pageTitle(page?: string): string {
	return page ? `${page} - ${SITE.name}` : SITE.name;
}
