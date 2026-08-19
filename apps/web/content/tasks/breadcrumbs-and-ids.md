---
title: Breadcrumbs and stable ids
summary: The studio is five sections deep in places and the only way back is the browser.
area: studio
status: todo
effort: s
order: 120
draft: false
---

The studio is five sections deep in places and the only way back is the
browser. Nothing on a page says where it sits, and the ids that would make a
row addressable are computed per component.

## What it touches

A breadcrumb built from the section table and the route, and one id scheme
shared by the list, the viewer and the URL.

## Done means

Every studio page shows its trail, and a row's id is the same string in the
list, the URL and the API.

## What it is not

Not a site-wide breadcrumb change. `Breadcrumb` already exists and the public
pages use it correctly.
