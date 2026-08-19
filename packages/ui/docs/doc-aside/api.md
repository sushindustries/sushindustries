---
title: API
summary: Every prop on `DocAside`, and what the collapse does without JavaScript.
---

<!-- generated:api -->

## Props

| Prop | Type | Default | Does |
| --- | --- | --- | --- |
| `headings` | `readonly DocHeading[]` | - | The list to render. Collect it in a route loader, not in the component. |
| `label?` | `string` | `"On this page"` | Heading on desktop, button text on mobile. |
| `minHeadings?` | `number` | `2` | Renders nothing below this count. One heading is not a contents list. |
| `footer?` | `ReactNode` | - | Rendered under the contents list: feedback buttons, a copy action, whatever the page wants within reach of a reader who is already here. |

<!-- /generated:api -->

## Getting the headings

```ts
import { collectHeadings } from "@sushindustries/ui";

const headings = collectHeadings(markdownSource); // h2 by default
const h3s = collectHeadings(markdownSource, 3);
```

Collect them in a route loader, not in the component. Parsing is synchronous
and the loader runs on the server, so the contents list ends up in the cached
HTML instead of being work the browser repeats on every render.

## Why `minHeadings` defaults to 2

One heading is not a contents list, it is the page. Rendering a sidebar with a
single link is offering navigation to where the reader already is.
