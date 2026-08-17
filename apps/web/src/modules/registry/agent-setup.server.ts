import type { RegistryItem } from "@sushindustries/ui/registry";
import type { PackageDoc } from "../content/packages/packages.schemas";

/*
 * The agent surface: setup instructions served as Markdown, at a URL.
 *
 * The pattern is Cloudflare's `agent-setup/prompt.md`, reverse-engineered. The
 * prompt a person copies is one imperative sentence naming the thing and a
 * canonical URL; everything the agent actually needs - install commands,
 * files, verification - lives at that URL as plain Markdown. The prompt stays
 * short enough to paste anywhere, the instructions stay updatable without the
 * prompt changing, and an agent that can fetch can execute.
 *
 * `.server.ts` because these render inside server route handlers. Nothing here
 * is privileged - the whole point is that other people's agents fetch it.
 */

/** The sentence a person pastes into their agent. */
export function agentPrompt(title: string, promptUrl: string): string {
	return `Fetch and execute the appropriate instructions to set me up with ${title} from ${promptUrl}`;
}

export function markdown(body: string): Response {
	return new Response(body, {
		headers: {
			"content-type": "text/markdown; charset=utf-8",
			// Agents fetch once per setup. Public because every reader gets
			// the same document.
			"cache-control": "public, max-age=300",
			"access-control-allow-origin": "*",
		},
	});
}

export function notFoundMarkdown(message: string): Response {
	return new Response(`# Not found\n\n${message}\n`, {
		status: 404,
		headers: {
			"content-type": "text/markdown; charset=utf-8",
			"access-control-allow-origin": "*",
		},
	});
}

/*
 * Instructions for one component. Written to be executed: numbered steps,
 * exact commands, and a verification the agent can actually run. The action
 * words are stated up front as a machine-readable contract - the same
 * install/read/run vocabulary the site's action badges use.
 */
export function componentPrompt(item: RegistryItem, origin: string): string {
	const deps = Object.entries(item.dependencies);

	const lines: string[] = [
		`# Set up ${item.title} (\`${item.name}\`) v${item.version} from sushindustries`,
		"",
		`${item.description}`,
		"",
		"You are configuring the current project to use this component.",
		"Actions this document asks of you: **read**, **install**, **run**.",
		"",
		"## 1. Read before touching anything",
		"",
		`- Docs page: ${origin}/components/${item.name}`,
		`- The same page as Markdown: ${origin}/r/md/${item.name}`,
		"- Components style themselves with atomic classes from `@sushindustries/atoms`. The stylesheet must be loaded once, globally, or the component arrives unstyled.",
		"",
		"## 2. Install",
		"",
		"Pick the installer the project already uses. Both copy the source files in; there is no runtime package to add for the component itself.",
		"",
		"With the TanStack CLI:",
		"",
		"```shell",
		`tanstack add ${origin}/r/tanstack/${item.name}.json`,
		"```",
		"",
		"With shadcn:",
		"",
		"```shell",
		`pnpm dlx shadcn@latest add ${origin}/r/shadcn/${item.name}.json`,
		"```",
		"",
		`Files this installs: ${item.files.map((file) => `\`${file}\``).join(", ")}.`,
		...(item.registryDependencies?.length
			? [
					"",
					`It also installs these registry items it depends on: ${item.registryDependencies.map((name) => `\`${name}\``).join(", ")}.`,
				]
			: []),
		"",
		"## 3. Runtime dependencies",
		"",
		deps.length === 0
			? "None beyond the stylesheet. Install `@sushindustries/atoms` and import `@sushindustries/atoms/atoms.css` once at the app root if the project does not already."
			: [
					"Install the packages this component imports, at the versions it was verified against:",
					"",
					"```shell",
					`pnpm add ${deps.map(([name, version]) => `${name}@${version}`).join(" ")}`,
					"```",
					"",
					"And the stylesheet, once at the app root: `@sushindustries/atoms/atoms.css`.",
				].join("\n"),
		"",
		"## 4. Verify",
		"",
		"```tsx",
		`import { ${pascal(item.name)} } from "./components/${item.name}";`,
		"```",
		"",
		"Render it once and run the project's typecheck. If styles are missing, the atoms stylesheet is not loaded - that is the only setup step people skip.",
		"",
		"## If something does not fit",
		"",
		`Do not force it. Tell the user what failed and point them at ${origin}/components/${item.name}.`,
		"",
	];

	return lines.join("\n");
}

/* Same shape for a whole package: install from npm rather than copy source. */
export function packagePrompt(pkg: PackageDoc, origin: string): string {
	return [
		`# Set up ${pkg.name} from sushindustries`,
		"",
		pkg.description,
		"",
		"You are configuring the current project to use this package.",
		"Actions this document asks of you: **read**, **install**, **run**.",
		"",
		"## 1. Read",
		"",
		`- Package page: ${origin}/packages/${pkg.slug}`,
		"- The README on that page is the package's own documentation, shipped with it.",
		"",
		"## 2. Install",
		"",
		"```shell",
		pkg.install,
		"```",
		"",
		"## 3. Verify",
		"",
		`Import it, render or call the smallest thing its README shows first, and run the project's typecheck.`,
		"",
		"## If something does not fit",
		"",
		`Do not force it. Tell the user what failed and point them at ${origin}/packages/${pkg.slug}.`,
		"",
	].join("\n");
}

function pascal(slug: string): string {
	return slug
		.split("-")
		.map((part) => part.charAt(0).toUpperCase() + part.slice(1))
		.join("");
}
