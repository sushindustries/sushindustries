import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";
import { readThemeCookie, type Theme } from "./theme.schemas";

/*
 * The reader's theme, read on the server.
 *
 * This is the entire reason there is a cookie rather than a `localStorage` key.
 * The document's `data-theme` has to be correct in the **first byte** the server
 * writes, and the server can see a cookie. It cannot see `localStorage`, and it
 * cannot see `prefers-color-scheme` - so anything stored in either of those can
 * only be applied after the page has already painted, which is the flash.
 *
 * A server function rather than request middleware because the value is wanted
 * by exactly one place, the root route's loader, and a middleware would put it
 * in the context of every request including the ones that are streaming a model
 * or answering a crawler.
 *
 * `GET`, because it reads. Nothing here validates input for the good reason
 * that there is none: the only thing it touches is a header the browser sent.
 */
export const getTheme = createServerFn({ method: "GET" }).handler(
	(): Theme => readThemeCookie(getRequestHeader("cookie")),
);
