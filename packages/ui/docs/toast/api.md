---
title: Toast API
summary: Every prop, what it defaults to, and what happens when it is wrong.
---

<!-- generated:api -->

## Props

| Prop | Type | Default | Does |
| --- | --- | --- | --- |
| `children` | `ReactNode` | - |  |
| `duration?` | `number` | `4000` | How long a toast stays, in ms. |

<!-- /generated:api -->

## Notes

`children` here is the app content `ToastProvider` wraps, not a toast
itself - toasts are created only through `useToast().toast(message)`, a
plain string, never JSX. `duration` applies to every toast fired from that
provider; there is no per-call override, so a page that genuinely needs two
different durations needs a second, nested `ToastProvider` around just the
part that does.
