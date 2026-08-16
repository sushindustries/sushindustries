import type { ModelConfig } from "@sushindustries/product-viewer";

/*
 * The mark, as one import.
 *
 * It used to be the string `/models/logo.glb` written out at four call sites -
 * a path that is correct until somebody moves the file, and then is wrong at
 * runtime with a 404 that renders as an empty square. One export means one
 * place to change it.
 *
 * ── Why `public/` and not a bundled `?url` import ───────────────────────────
 *
 * This was briefly `import url from "./assets/logo.glb?url"`, which is tidier:
 * the bundler emits the file, fingerprints it, and a typo becomes a build
 * error rather than a 404. It was reverted, and the reason is worth writing
 * down so it does not get "improved" back.
 *
 * The file is 2.8 MB. `public/` is copied verbatim and served straight off
 * disk, by the dev server and by Nitro alike. A bundled asset goes through the
 * transform pipeline instead, and a multi-megabyte binary in that pipeline is
 * a class of problem - dev-server 404s on a cold graph, a slower build, and a
 * cache key that changes whenever anything about the bundle does.
 *
 * Fingerprinting is what is given up. That is a real loss and an acceptable
 * one: this file changes about never, and `cache-control` on a static path is
 * a header rather than a build system.
 *
 * The rule this follows: **bundle assets that belong to a module, serve assets
 * that belong to the site.** A component's 2 kB icon sprite is the first;
 * a 2.8 MB model behind a lazy WebGL canvas is the second.
 *
 * It also stays in `apps/web` rather than moving into a package, which is the
 * repo's own rule rather than an accident - `CLAUDE.md` lists the logo among
 * the few genuinely site-specific things, beside the nav and the footer. What
 * *is* in a package is everything about how a model behaves at icon size,
 * which is `ModelMark`.
 */

export const LOGO_MODEL: ModelConfig = {
	url: "/models/logo.glb",
	/*
	 * One unit long, so the scene is in the same unit as the mark - which is
	 * what makes the camera distances inside the viewer mean something rather
	 * than being tuned to this particular export's scale.
	 */
	realLength: 1,
};
