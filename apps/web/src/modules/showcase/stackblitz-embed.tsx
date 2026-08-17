import { type ReactNode, useEffect, useRef } from "react";

/*
 * The StackBlitz embed, built from a demo's source code.
 *
 * The SDK is loaded dynamically so it is tree-shaken if nothing imports this
 * file, and so it never runs on a server. It is a client-only concern: the SDK
 * touches `document` and opens a WebContainer, neither of which exists during
 * SSR, so the embed is mounted only when the StackBlitz tab is visible.
 *
 * Each demo becomes a self-contained React + TypeScript project on StackBlitz.
 * The source the author wrote beside the element is the entry point, so the
 * editable copy is the same code the reader was just looking at.
 */

interface StackblitzProject {
	readonly title: string;
	readonly description: string;
	readonly template: "create-react-app";
	readonly files: Readonly<Record<string, string>>;
	readonly dependencies: Readonly<Record<string, string>>;
}

const DEPS: Readonly<Record<string, string>> = {
	react: "^19.0.0",
	"react-dom": "^19.0.0",
	"@sushindustries/ui": "latest",
	"@sushindustries/atoms": "latest",
};

const APP_TSX = `import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Demo } from "./Demo";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Demo />
  </StrictMode>,
);
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
    <script type="module" src="/src/App.tsx"></script>
  </body>
</html>
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

function buildProject(
	title: string,
	code: string,
	language: string,
): StackblitzProject {
	const isTsx = language === "tsx" || language === "ts";

	const demoContent = isTsx
		? `export function Demo() {\n  return (\n${code
				.split("\n")
				.map((l) => `    ${l}`)
				.join("\n")}\n  );\n}\n`
		: code;

	return {
		title: `${title} - StackBlitz`,
		description: `Live demo of ${title} from sushindustries.`,
		template: "create-react-app",
		files: {
			"src/App.tsx": APP_TSX,
			"src/Demo.tsx": demoContent,
			"index.html": INDEX_HTML,
			"tsconfig.json": TSCONFIG,
		},
		dependencies: DEPS,
	};
}

export interface StackblitzEmbedProps {
	/** The demo title, used as the project name. */
	title: string;
	/** The demo source code. */
	code: string;
	/** Language for the source. */
	language: string;
}

export function StackblitzEmbed({
	title,
	code,
	language,
}: StackblitzEmbedProps): ReactNode {
	const containerRef = useRef<HTMLDivElement>(null);
	const mountedRef = useRef(false);

	useEffect(() => {
		if (mountedRef.current) return;

		// Captured before the await, not read after it. The ref can be detached
		// while the SDK chunk is in flight, and a narrowing that happened before
		// an await is not a fact about the moment the embed is mounted.
		const container = containerRef.current;
		if (!container) return;

		mountedRef.current = true;

		void (async () => {
			// The SDK's only export is its default, so the namespace object a
			// dynamic import hands back has no methods on it.
			const { default: sdk } = await import("@stackblitz/sdk");
			const project = buildProject(title, code, language);

			sdk.embedProject(container, project, {
				openFile: "src/Demo.tsx",
				view: "preview",
				theme: "light",
				height: "100%",
			});
		})();

		return () => {
			mountedRef.current = false;
		};
	}, [title, code, language]);

	return <div ref={containerRef} className="showcase-stackblitz-frame" />;
}
