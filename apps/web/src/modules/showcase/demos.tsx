import { type Demo, demos } from "@sushindustries/ui/demos";
import { lazy } from "react";
import { LOGO_MODEL } from "../chrome/logo";
import { SITE } from "../content/site.catalogue";
import { askAssistant } from "../markdown/questions.store";
import { pacedImport } from "./paced-import";

/*
 * The library's demos, bound to this site.
 *
 * The examples themselves live in `@sushindustries/ui/demos`, because they
 * are the library's and a project that installs the components has a reason
 * to want them. What this file adds is the four things the demos are not
 * allowed to know: this site's URL, its mark, its assistant, and how it
 * chooses to load the viewer - lazily, and paced, so the preview iframe does
 * not fetch three.js until it is about to be seen.
 *
 * Bound once at module scope. The result is a plain record, and building it
 * per lookup would remount every demo's lazy component on every render.
 */

const ProductViewer = lazy(() =>
	pacedImport(() => import("@sushindustries/react-product-viewer")),
);

const DEMOS = demos({
	siteUrl: SITE.url,
	model: LOGO_MODEL,
	onAsk: askAssistant,
	ProductViewer,
});

export function findDemo(id: string): Demo | undefined {
	return DEMOS[id];
}
