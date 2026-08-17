import { type ReactNode, useEffect, useRef } from "react";

/*
 * The StackBlitz embed: the demo, actually running, actually editable.
 *
 * Nothing here is published to npm, so a project that says
 * `"@sushindustries/ui": "latest"` installs nothing and the embed dies on
 * boot. The honest source of the component code is the same one the
 * installers use: `/r/tanstack/<id>.json` inlines every file of an item and
 * names the items it depends on, so the embed fetches that - the demo runs
 * the exact source a `tanstack add` would copy, with the atoms stylesheet
 * bundled in as text.
 *
 * `template: "node"` boots a WebContainer that runs `npm install && npm
 * start`, which makes the project an ordinary Vite app rather than something
 * shaped for an embed. The reader gets the editor and the running result in
 * one frame, and every file is real.
 *
 * The SDK and the stylesheet are dynamic imports: both are fetched when the
 * StackBlitz tab is opened and never otherwise, so this file costs the
 * documentation page nothing.
 */

interface AddOn {
	readonly files: Readonly<Record<string, string>>;
	readonly packageAdditions?: {
		readonly dependencies?: Readonly<Record<string, string>>;
	};
	readonly dependsOn?: readonly string[];
}

/** The item, plus everything it says it needs, fetched breadth-first. */
async function collectAddOns(id: string): Promise<AddOn[]> {
	const seen = new Set<string>();
	const queue = [id];
	const out: AddOn[] = [];

	while (queue.length > 0) {
		const next = queue.shift();
		if (!next || seen.has(next)) continue;
		seen.add(next);

		const response = await fetch(`/r/tanstack/${next}.json`);
		if (!response.ok) continue;

		const addOn = (await response.json()) as AddOn;
		out.push(addOn);
		queue.push(...(addOn.dependsOn ?? []));
	}

	return out;
}

/*
 * The names the snippet actually uses, read from the code itself: JSX tags
 * that start with a capital, and hook calls. That is what makes the generated
 * import line real rather than a guess - `<Card>` in the snippet becomes
 * `import { Card }` above it.
 */
function usedNames(code: string): string[] {
	const names = new Set<string>();

	for (const match of code.matchAll(/<([A-Z]\w+)/g)) {
		if (match[1]) names.add(match[1]);
	}
	for (const match of code.matchAll(/\b(use[A-Z]\w+)\s*\(/g)) {
		if (match[1]) names.add(match[1]);
	}
	for (const match of code.matchAll(
		/\b(parseFrontmatter|readString|readList|parseArchive|collectHeadings)\b/g,
	)) {
		if (match[1]) names.add(match[1]);
	}

	return [...names];
}

const PACKAGE_JSON = (dependencies: Readonly<Record<string, string>>): string =>
	JSON.stringify(
		{
			name: "sushindustries-demo",
			private: true,
			type: "module",
			scripts: { dev: "vite", start: "vite" },
			dependencies: {
				react: "^19.0.0",
				"react-dom": "^19.0.0",
				...dependencies,
			},
			devDependencies: {
				"@types/react": "^19.0.0",
				"@types/react-dom": "^19.0.0",
				"@vitejs/plugin-react": "^5.0.0",
				typescript: "^5.6.0",
				vite: "^6.0.0",
			},
		},
		null,
		2,
	);

const VITE_CONFIG = `import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({ plugins: [react()] });
`;

const INDEX_HTML = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Demo</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
`;

const MAIN_TSX = `import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Demo } from "./Demo";
import "./atoms.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Demo />
  </StrictMode>,
);
`;

const TSCONFIG = `{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "skipLibCheck": true,
    "noEmit": true
  },
  "include": ["src"]
}
`;

function demoFile(code: string, names: string[]): string {
	// One import per name the snippet uses, against the barrel of everything
	// the registry shipped. Unused sources stay browsable in the file tree.
	const imports =
		names.length > 0
			? `import { ${names.sort().join(", ")} } from "./components/sushindustries";\n\n`
			: "";

	const body = code.trim().startsWith("<")
		? `export function Demo() {\n  return (\n${code
				.split("\n")
				.map((line) => `    ${line}`)
				.join("\n")}\n  );\n}\n`
		: `${code}\n\nexport function Demo() {\n  return <p>Open the console - this demo is code, not UI.</p>;\n}\n`;

	return `${imports}${body}`;
}

/*
 * WebContainer embeds only run in Chromium-based browsers - they need
 * cross-origin isolation headers an embedding page does not control. On
 * anything else the same project opens on stackblitz.com instead, where
 * StackBlitz serves its own headers and every supported browser works.
 */
function isChromium(): boolean {
	interface UAData {
		readonly brands?: ReadonlyArray<{ readonly brand: string }>;
	}
	const data = (navigator as Navigator & { userAgentData?: UAData })
		.userAgentData;

	if (data?.brands) {
		return data.brands.some((entry) => /Chromium/i.test(entry.brand));
	}
	return /Chrom(e|ium)\//.test(navigator.userAgent);
}

export interface StackblitzEmbedProps {
	/** Registry id of the demo; what `/r/tanstack/<id>.json` is fetched for. */
	demoId: string;
	/** The demo title, used as the project name. */
	title: string;
	/** The demo source code. */
	code: string;
	/** Language for the source. */
	language: string;
}

export function StackblitzEmbed({
	demoId,
	title,
	code,
}: StackblitzEmbedProps): ReactNode {
	const containerRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const host = containerRef.current;
		if (!host) return;

		/*
		 * The SDK *replaces* the element it is handed with its iframe. Handing
		 * it the React-rendered div means React later tries to remove a child
		 * that no longer exists - the removeChild crash. So the SDK gets a
		 * node created here, appended here, and cleared here; React owns only
		 * the empty host around it.
		 */
		const container = document.createElement("div");
		container.style.height = "100%";
		host.appendChild(container);

		let cancelled = false;

		void (async () => {
			// The SDK's only export is its default, so the namespace object a
			// dynamic import hands back has no methods on it.
			const [{ default: sdk }, { default: atomsCss }, addOns] =
				await Promise.all([
					import("@stackblitz/sdk"),
					import("@sushindustries/atoms/atoms.css?raw"),
					collectAddOns(demoId),
				]);

			const files: Record<string, string> = {
				"package.json": "",
				"index.html": INDEX_HTML,
				"vite.config.ts": VITE_CONFIG,
				"tsconfig.json": TSCONFIG,
				"src/main.tsx": MAIN_TSX,
				"src/atoms.css": atomsCss,
			};

			const dependencies: Record<string, string> = {};
			const stems: string[] = [];

			for (const addOn of addOns) {
				Object.assign(dependencies, addOn.packageAdditions?.dependencies);
				for (const [path, content] of Object.entries(addOn.files)) {
					files[path] = content;
					const stem = path
						.split("/")
						.at(-1)
						?.replace(/\.tsx?$/, "");
					if (stem) stems.push(stem);
				}
			}

			// The barrel the demo imports from: everything the registry shipped.
			files["src/components/sushindustries/index.ts"] = stems
				.map((stem) => `export * from "./${stem}";`)
				.join("\n");

			files["package.json"] = PACKAGE_JSON(dependencies);
			files["src/Demo.tsx"] = demoFile(code, usedNames(code));

			// Unmounted while the SDK chunk was in flight: boot nothing.
			if (cancelled) return;

			const project = {
				title: `${title} - sushindustries`,
				description: `Live demo of ${title} from sushindustries.`,
				template: "node" as const,
				files,
			};

			if (!isChromium()) {
				const open = document.createElement("button");
				open.type = "button";
				open.className = "copy-btn";
				open.dataset.ground = "paper";
				open.textContent =
					"Open in StackBlitz (embeds need a Chromium browser)";
				open.addEventListener("click", () =>
					sdk.openProject(project, { openFile: "src/Demo.tsx" }),
				);
				container.replaceChildren(open);
				container.classList.add("flex", "items-center", "justify-center");
				return;
			}

			sdk.embedProject(container, project, {
				openFile: "src/Demo.tsx",
				view: "default",
				theme: "light",
				height: "100%",
			});
		})();

		return () => {
			cancelled = true;
			// Whatever the SDK left inside the host - its iframe, the fallback
			// button - is imperative DOM, so it is cleared imperatively.
			host.replaceChildren();
		};
	}, [demoId, title, code]);

	return <div ref={containerRef} className="showcase-stackblitz-frame" />;
}
