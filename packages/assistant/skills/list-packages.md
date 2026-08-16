---
name: list_packages
summary: List the published packages in this monorepo, with what each one is for. Use this for questions about the repo's shape rather than its components.
---

# list_packages

## Parameters

| Name | Type | Required | Description |
| --- | --- | --- | --- |
| detail | boolean | no | Include each package's README. Off by default, because four READMEs is most of the reply |

## Returns

Every package under `packages/`, with its name, description and page path.
With `detail`, each one's README as well.

## Notes

Deliberately separate from `find_component`. A package and a component are
different sizes of thing - `@sushindustries/ui` is a package that contains two
dozen components - and one skill returning both would make the model choose a
granularity in the same breath as choosing an answer.

`detail` is off by default and the description says why. A boolean whose cost is
invisible is a boolean the model sets to true every time.
