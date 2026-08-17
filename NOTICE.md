# Notice

What in this repository is not mine, and on what terms it is here.

The code is MIT, and `LICENSE` covers it. This file covers the rest: the marks
and the model, which are not code and are not licensed by it.

## Third-party logos

`apps/web/public/logos/` holds the marks of the projects this site is built on.
They appear in exactly one place - the credits list on `/p/about`, beside the
name of the project each belongs to and a link to it.

That is **nominative use**: naming a thing by its own name and mark in order to
say "this site depends on it". It is not an endorsement, a partnership, or a
claim of any right in the mark. Every one of them remains the property of its
owner.

| File | Mark of | Terms |
| --- | --- | --- |
| `tanstack.png` | TanStack | Used to credit TanStack Start, Router, Markdown, Highlight and AI |
| `react.svg` | Meta Platforms, Inc. | React brand guidelines allow use to refer to React |
| `vite.svg` | Vite / VoidZero | MIT project, mark used to refer to Vite |
| `nitro.svg` | UnJS | MIT project, mark used to refer to Nitro |
| `drizzle.svg` | Drizzle Team | Apache-2.0 project, mark used to refer to Drizzle ORM |
| `biome.svg` | Biome Developers | MIT project, mark used to refer to Biome |
| `pnpm.svg` | pnpm | MIT project, mark used to refer to pnpm |
| `npm.svg` | npm, Inc. / GitHub | Used to refer to the npm registry |
| `shadcnui.svg` | shadcn | MIT project, mark used to refer to shadcn/ui |
| `lenis.ico` | darkroom.engineering | MIT project, mark used to refer to Lenis |
| `railway.svg` | Railway Corp. | Used to refer to Railway, which builds and runs this site |
| `groq.ico` | Groq, Inc. | Used to refer to Groq, which runs the model behind the assistant |

If you own one of these and would rather it were not here, open an issue and it
comes out the same day.

## Drawn glyphs

`packages/ui/glyphs.md` is the icon set, and every path in it was drawn for
this repository at one stroke weight. They are mine and they ship under the
MIT licence with the rest of the code.

Two of them stand for other people's brands, and those two are a different
question:

- **`github`** is the octocat, redrawn as an outline at this set's weight.
- **`linkedin`** is the wordmark's two letters in a square, redrawn the same
  way.

A redrawn mark is still a mark, and some brand guidelines - LinkedIn's among
them - ask that the logo not be altered. They are used here only as links to
my own profiles on those services, which is the narrowest use there is, and
they are not offered as a substitute for either company's official assets.
If you are installing `@sushindustries/ui` and shipping something commercial,
use the official SVGs rather than these two.

## The model

`apps/web/public/models/logo.glb` is the sushindustries mark in three
dimensions. It is mine, and unlike the code it is **not** MIT: it is the
identity of this site, so it is here to be looked at rather than reused.
Everything else in `packages/ui` that renders it - `ProductViewer`, `Device`,
`ScrollSpin` - is MIT and works with any model you point it at.
