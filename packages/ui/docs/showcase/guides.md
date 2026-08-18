---
title: Guides
summary: Using Showcase well, and the mistakes that look like it is broken.
---

## The widths

Not a rounded-off guess at popular phones. Each width sits on one side of a
breakpoint this stylesheet actually contains, so the set exercises every branch
in it and nothing else.

| Width | Why that number |
| --- | --- |
| 320 | the floor. Every component here works from this width up |
| 390 | the commonest real phone, still under the 860px breakpoint |
| 900 | between 860 and 1080: past the phone layout, short of the wide one |
| Desktop | whatever the page has. Pinning it to 1280 misreports a laptop |

Each frame says which width it is and why. A frame with no label is a
screenshot; a labelled one is a claim you can check.

## Compare

**Compare** puts all four side by side in a row that scrolls.

One width at a time answers "does it work here", which is usually the question
you already know the answer to. All of them at once answers "where does it stop
working", which is the one worth a screenful. The frames align to the top, so a
short component does not stretch its frame to match the tallest one and hide
the fact that it was short.

```css
.showcase-stage {
	display: flex;
	align-items: start;
	justify-content: center;
}

/* Compare is a row that scrolls. One width at a time centres instead. */
.showcase-stage[data-view="compare"] {
	justify-content: start;
	overflow-x: auto;
}
```

There is no transition on the device toggle. It gets pressed a dozen times
while reading one page, and on a control used that often an animation reads as
lag rather than as polish - the state change is the feedback.

## StackBlitz

The **StackBlitz** tab opens a live, editable copy of the demo in a real
WebContainer. The reader can change the code and see the result without leaving
the page.

The project is built from the same source the Code tab shows - the demo's
`source` string becomes `src/Demo.tsx` in a React + TypeScript project that
imports `@sushindustries/ui` and `@sushindustries/atoms`. So the editable copy
is the same code the reader was just looking at, not a reconstruction of it.

The StackBlitz SDK is wired in the app layer, not in the Showcase component
itself, for the same reason the code highlighter is: `packages/ui` has no
business depending on the StackBlitz SDK. The Showcase component takes a
`renderStackblitz` render prop and decides where it goes; the host builds the
project and hands it to the SDK.

```tsx
<Showcase
	src={`/preview/${id}?fit=full`}
	code={code}
	language={language}
	renderStackblitz={(source, lang) => (
		<StackblitzEmbed demoId={id} code={source} language={lang} />
	)}
/>
```

The tab only appears when both `code` and `renderStackblitz` are given. Leave
either off and the reader gets Preview and Code, which is the right thing for a
demo nobody can usefully edit.
