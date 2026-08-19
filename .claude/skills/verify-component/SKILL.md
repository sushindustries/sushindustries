---
name: verify-component
description: Verify that a component in this repo is correctly implemented, imported, rendered and interactive - in the running site, not just in the type checker. Use when asked to test or verify a component ("/verify-component <slug>"), all components ("/verify-component --all"), or the whole site ("/verify-site"). Automated PASS is never VERIFIED; VERIFIED requires explicit human approval.
---

# Verify a component

Automated checks prove that a component compiles, renders and behaves in a
browser. They cannot prove it looks right to a person. So this workflow ends at
`AUTOMATED_PASSED` and stops; only the human's explicit `APPROVE` turns that
into `VERIFIED`.

```text
NOT_TESTED -> IMPLEMENTED -> AUTOMATED_PASSED -> HUMAN_VERIFICATION_REQUIRED
                                                   -> VERIFIED   (human said APPROVE)
                                                   -> FIX_REQUIRED (human described a problem)
FIX_REQUIRED -> IMPLEMENTED (after the fix)
VERIFIED -> NOT_TESTED      (when the implementation changes substantially)
```

## What counts as a component here

Everything with a docs directory: `packages/<pkg>/docs/<slug>/`. Enumerate them
live with `ls -d packages/*/docs/*/` - there is no list to maintain. The site
renders each one at `http://localhost:3000/components/<slug>`, and **that page
is the test harness**. Do not create a `/test/components` route; it would ship
to production and pollute the sitemap.

Some slugs are hooks (`use-*`) or pure functions (`frontmatter`). For those the
render, interaction and visual steps do not apply - say so in the report
instead of faking them.

## The workflow, per component

1. **Find the source.** `packages/<pkg>/src/<slug>.tsx` (or `.ts`). Read it.
   Note the exported names, the props interface and its JSDoc (the API docs are
   generated from it), and every `data-*` attribute it writes - in this repo a
   variant is a prop that writes a data attribute, so the props interface IS
   the list of variants and states to test.

2. **Find real references.** Grep `apps/web/src` and `packages/*/src` for the
   component's import. The pages that use it are part of the test surface: a
   component must work where it is actually used, not only on its docs page.

3. **Static checks.** `pnpm run typecheck` and `pnpm exec biome check .` must
   already pass. If they do not, stop: status is `FIX_REQUIRED` before a
   browser ever opens.

4. **Run the suite.** `pnpm run test` runs semantics over HTTP and geometry in
   Chromium at phone and desktop widths for every sitemap page - which includes
   every `/components/<slug>` page. A layout failure here is a real failure.

5. **Open it in the browser.** `pnpm dev`, then drive Chromium with the
   chrome-devtools tools against `http://localhost:3000/components/<slug>`:
   - snapshot the page and confirm the component actually rendered;
   - exercise each documented variant and state (the data attributes from
     step 1), plus click and keyboard interaction where the component has any;
   - `resize_page` to 360 and 1280 wide - the widths the CI layout tests use;
   - `list_console_messages` and `list_network_requests`: no errors, no failed
     requests attributable to the component;
   - keyboard reachability, visible focus, sensible roles and labels;
   - if the component animates, check it respects `prefers-reduced-motion`
     (emulate it) and that first paint has no hydration mismatch in console.

6. **Open one or two real references** from step 2 and repeat the render,
   console and interaction checks in that context.

7. **Report and stop.** Print a per-check PASS/FAIL table (source, import,
   render, props, variants, interaction, references, console, network,
   accessibility). All relevant checks green means `AUTOMATED_PASSED` - then
   write exactly this and wait:

   > Automated tests passed. Human verification required.
   > Open http://localhost:3000/components/<slug> and check appearance,
   > spacing, responsive behavior, hover, focus, and the real usages listed
   > above. Reply APPROVE, or describe the problem.

8. **Record the outcome** in `registry.json` next to this file. `APPROVE`
   writes `{"status": "VERIFIED", "lastVerified": "<date>", "verifiedBy":
   "human"}` under the slug; a described problem writes `FIX_REQUIRED` with a
   `problem` field. A slug absent from the registry is `NOT_TESTED` - never
   seed entries just to say that.

## `/verify-component --all` and `/verify-site`

Enumerate the slugs, skip ones already `VERIFIED` whose source is unchanged
since `lastVerified` (`git log -1 --format=%cs -- <source>`), run the workflow
per component, and end with one report plus one human-verification queue. Do
not mark anything VERIFIED in bulk. `/verify-site` additionally builds
(`pnpm run build`), boots the built server, and walks the important routes
(`/`, `/components`, `/packages`, `/posts` and one detail page of each) with
the same console, network and accessibility checks.

## Non-negotiable rules

- PASS is not VERIFIED. Only a human makes VERIFIED.
- Never claim a component works because TypeScript compiled or a unit test
  passed. Test it in the running application.
- Never hide a failure, assume visual correctness, or fabricate a result. If a
  check cannot be performed, report that it was not performed.
- Keep evidence: the report table, the console output, and screenshots for
  anything visual that failed.
- A substantial change to a VERIFIED component invalidates its verification -
  set it back to NOT_TESTED (delete its registry entry) in the same change.

The original specification this was adapted from is `original-spec.md` beside
this file; where the two disagree, this file wins because it matches how the
repo actually works.
