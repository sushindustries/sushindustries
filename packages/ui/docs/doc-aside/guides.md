---
title: Guides
summary: Using Doc Aside well, and the mistakes that look like it is broken.
---

## Composing it

It expects to sit beside the prose it is a contents list for, in a two-column
layout with its own scroll region - it is `position: sticky` internally, so
its parent needs to be as tall as the article for the stickiness to have
anywhere to travel. A `DocAside` dropped into a short parent just sits at the
top and never appears to track anything.

## Adding a footer

```tsx
<DocAside headings={headings} footer={<FeedbackButtons />} />
```

Anything passed as `footer` renders under the contents list, inside the same
rail - a "was this helpful" control, a copy-page-as-markdown action, whatever
belongs within reach of someone who has already found this sidebar.
