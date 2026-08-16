import { createHighlighter } from "@tanstack/highlight/core";
import { css } from "@tanstack/highlight/languages/css";
import { json } from "@tanstack/highlight/languages/json";
import { plaintext } from "@tanstack/highlight/languages/plaintext";
import { shell } from "@tanstack/highlight/languages/shell";
import { ts } from "@tanstack/highlight/languages/ts";
import { tsx } from "@tanstack/highlight/languages/tsx";

/*
 * One highlighter, isomorphic, with languages listed by hand.
 *
 * Selective registration is the point of this library: only the grammars named
 * here are bundled. The list is the languages this site's READMEs actually
 * use - adding a package that documents itself in Python means adding Python
 * here, and noticing that you did.
 *
 * `plaintext` is the fallback so an unknown or missing language on a fence
 * renders as an unstyled block rather than throwing.
 */
export const highlighter = createHighlighter({
	languages: [ts, tsx, shell, json, css, plaintext],
	fallbackLanguage: "plaintext",
});

/*
 * Fences in a README are labelled the way people write them, not the way the
 * registry names them. Normalising here keeps the aliases out of every call
 * site.
 */
const ALIASES: Readonly<Record<string, string>> = {
	bash: "shell",
	sh: "shell",
	zsh: "shell",
	console: "shell",
	typescript: "ts",
	javascript: "ts",
	js: "ts",
	jsx: "tsx",
};

export function resolveLanguage(lang: string | undefined): string {
	if (!lang) return "plaintext";
	return ALIASES[lang] ?? lang;
}
