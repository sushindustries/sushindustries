---
title: Avatar
summary: A person at glyph size: the image if it loads, initials on a toned fill if it does not.
updated:
---

Avatar renders a person at glyph size: an image if `src` loads, initials on a
toned fill if it does not or never had one. Use it for a user's face or a
byline. AvatarGroup stacks several with a `+N` overflow count past `max`, for
a list of people rather than one.

<!-- ::start:showcase demo="avatar" height="380" -->
<!-- ::end:showcase -->

## Why it is built this way

The fallback is initials on a toned fill rather than a grey silhouette,
because a grid of identical placeholder heads says "nobody is here" while a
grid of initials says who is. The image failure is tracked in state with
`onError`, not left to CSS, because a broken-image icon inside a circle is
the one result rendering worse than either the photo or the initials.

AvatarGroup overlaps its faces because overlap reads as "together" in a way a
row of separate circles does not, and past `max` the rest collapse into a
count - a row of fourteen avatars is a dataset, not a group.

> [!NOTE] Install commands are not written here
> Anything in `packages/ui/registry.ts` gets its TanStack and shadcn commands
> attached automatically, so there is nothing to keep in sync.
