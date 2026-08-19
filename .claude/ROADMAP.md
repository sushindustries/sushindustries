# Roadmap

What has been asked for and deliberately not started, so scope cut is a record
rather than an accident. Each item names the groundwork that already exists
for it.

## The element taxonomy

The full set - Accordion, Alert, Avatar, Badge, Button Group, Calendar,
Carousel, Chart, Checkbox, Combobox, Command, Data Table, Date Picker, Dialog,
Drawer, Dropdown Menu, Hover Card, Input, Input OTP, Kbd, Menubar, Popover,
Progress, Radio Group, Resizable, Scroll Area, Select, Separator, Sheet,
Sidebar, Skeleton, Slider, Spinner, Switch, Table, Tabs, Textarea, Toast,
Toggle, Tooltip, and the rest of the shadcn-shaped list.

Groundwork done: the pipeline makes each one mechanical (`pnpm new component`,
registry entry with `version`/`kind`/`access`, demo, doctor-generated docs,
both installers, agent prompt, search entry - all from one slug). Several
already exist under other names: Command is `command-palette`, Breadcrumb,
Pagination, Typography, Hover Card is `reference`, Context Menu, Kbd is
`.palette-kbd` waiting to be extracted. Work through the list a category at a
time; each lands with the whole pipeline or not at all.

## The device code editor

The Device block with an editable pane (Markdown and atomic CSS), live-rendered
into its screen via a srcdoc iframe, per-device preview chosen by the user,
streamed through TanStack Query. Groundwork: Device, the Showcase split view,
the StackBlitz WebContainer embed (which already is the editable live copy),
and the cross-origin isolation headers.

## Theming as data

`cssVariables` in JSON per component: derive from `--syn-*`/tone/token usage in
atoms per registry item, expose at `/r/theme/<name>.json`. Groundwork: tokens
are already the only place colour exists; the doctor enforces it.

## Feedback, read back

`page_feedback` rows exist; nothing reads them yet. A stats view (or the
assistant) should surface votes per page. Groundwork: table + endpoint live.

## The tsdown 0.23 upgrade

0.22.14 is the checkpoint and the current stable. When 0.23 ships stable (it
is rc today), upgrade - the builds are warning-free, so it is safe. Never a
beta.

## TanStack Config conventions

Changesets and pkg-pr-new previews once packages publish to npm for real;
trusted publishing when there is a pipeline to trust. ESLint flat config is
deliberately not adopted - biome is this repo's one linter.
