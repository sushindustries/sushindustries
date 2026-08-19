---
description: Add a post, page, component or package to the site
---

Add something to the site, from the templates the repository already has. Each
`create-` tool writes only the files that are the same every time - the barrel
export, the registry entry, the Dockerfile line, the five empty documents - and
leaves everything that carries meaning blank on purpose.

What to add: $ARGUMENTS

1. `list-slugs` first. It reads the site's own sitemap, so it is the only
   answer that cannot be out of date, and it tells you whether the name is
   already taken.
2. `list-templates` to see where the files will land and which tokens each
   template takes. `read-template { name }` if you want to see the shape first.
3. The tool named after the thing: `create-post`, `create-page`, `create-desk`,
   `create-component`, `create-package` or `create-docs`.
4. Then write the parts that were left empty. A summary, a description, a demo.
   A scaffold with placeholder prose looks finished and is not.
5. `pnpm run doctor`. It fails on a registry entry with no files, a document
   with no summary, and an export nothing registers. Run `--fix` for the parts
   it can repair itself, and commit whatever it repairs.

Slugs are lowercase, digits and single hyphens, because a slug becomes a URL
and a filename. To rename one, `plan-slug-change { from, to }` lists every path
that would move and every line that mentions it.
