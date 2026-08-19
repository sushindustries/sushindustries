/*
 * What a documentation page must contain, and how to build the half of it that
 * is derivable.
 *
 * A library, not a script: the doctor checks the contract, `pnpm new docs`
 * scaffolds against it, and `pnpm run docs` counts it. A module that ran checks on
 * import could not be imported by any of them - `scripts/templates.mjs` records
 * what that costs, having silently broken `pnpm new` for as long as the
 * template helpers lived inside the doctor. So: exports, no argv, no writes.
 *
 * Two ideas hold this together.
 *
 * **The tabs are files, and the sections are read from the site.** The list
 * lives once, in `components.catalogue.ts`, and everything here parses it from
 * there rather than restating it - the same trick `requiredTemplates()` already
 * plays. Add a tab to the museum and the contract, the scaffolder and the
 * report all learn about it without an edit.
 *
 * **The API table is generated from the source, so it cannot drift.** Which
 * inverts where documentation is written: the `Does` column is the JSDoc on the
 * prop. Improving a description means editing the interface, where it also
 * reaches every consumer's editor, and then regenerating. Editing the Markdown
 * is the wrong move and the doctor says so.
 */

import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const CATALOGUE =
	"apps/web/src/modules/content/components/components.catalogue.ts";

function read(path) {
	return readFileSync(join(root, path), "utf8");
}

/* ── the sections, from the site that renders them ───────────────────── */

/**
 * The tabs a component page can have, in the order they appear.
 *
 * Parsed out of the catalogue rather than restated, so this file cannot
 * disagree with the thing doing the rendering.
 */
export function sectionOrder() {
	const block = read(CATALOGUE).match(/SECTION_ORDER = \[([\s\S]*?)\]/)?.[1];
	return [...(block ?? "").matchAll(/"([\w-]+)"/g)].map(([, id]) => id);
}

/**
 * The registry, parsed as text.
 *
 * Text rather than an import, because `packages/ui/registry.ts` is TypeScript
 * and these are plain node scripts - the same trade the doctor has always
 * made. It lives here rather than in the doctor so the report and the checks
 * read one parser; two would eventually disagree about what a registry item is.
 */
export function readRegistry() {
	const source = read("packages/ui/registry.ts");
	const items = [];

	for (const block of source.split(/\n\t\{\n/).slice(1)) {
		const name = block.match(/name:\s*"([^"]+)"/)?.[1];
		if (!name) continue;

		const list = (key) =>
			(block.match(new RegExp(`${key}:\\s*\\[([^\\]]*)\\]`, "s"))?.[1] ?? "")
				.split(",")
				.map((entry) => entry.trim().replace(/^"|"$/g, ""))
				.filter(Boolean);

		items.push({
			name,
			files: list("files"),
			registryDependencies: list("registryDependencies"),
			title: block.match(/title:\s*"([^"]+)"/)?.[1] ?? name,
			/*
			 * Written across lines by the formatter when it is long, and it
			 * usually is - so the pattern spans newlines and tolerates an escaped
			 * quote inside the sentence.
			 */
			description: (
				block.match(/description:\s*\n?\s*"((?:[^"\\]|\\.)*)"/)?.[1] ?? ""
			).replace(/\\"/g, '"'),
			category: block.match(/category:\s*"([^"]+)"/)?.[1],
			/*
			 * The one nested structure in an item, so it gets its own parse.
			 *
			 * `list()` above cannot read it: that helper stops at the first `]`,
			 * and a variants array is objects with their own braces. Matching the
			 * block to its closing `\n\t\t]` and then splitting on the inner
			 * braces is the smallest thing that works, and the indentation is the
			 * anchor - which is what a formatter guarantees and content cannot
			 * imitate.
			 *
			 * A parser rather than an import, like everything else here: this
			 * script must run on a bare `pnpm install` with nothing built, so it
			 * cannot import a `.ts` file to read one field out of it.
			 */
			variants: variantsIn(block),
			kind: block.match(/kind:\s*"([^"]+)"/)?.[1] ?? "component",
			/*
			 * The element's own version, which is the only version a consumer of
			 * a *copied* component can cite - there is no lockfile entry for a
			 * file somebody pasted in. It was missing here for the same reason
			 * `variants` was: this parser reads what somebody needed at the time,
			 * so a field nothing had asked for yet is a field it does not know.
			 *
			 * The failure is silent and looks like data: `version: undefined`
			 * written into a generated document, which reads as a bug in the
			 * generator rather than a gap in the reader.
			 */
			version: block.match(/version:\s*"([^"]+)"/)?.[1] ?? "0.0.0",
			schema: block.match(/schema:\s*"([^"]+)"/)?.[1],
		});
	}

	return items;
}

/**
 * The `variants` of one registry item, out of its source block.
 *
 * Returns an empty array for an item with none, which is most of them - a
 * variants list of one is an element pretending to have a choice.
 */
function variantsIn(block) {
	const list = block.match(/\n\t\tvariants:\s*\[\n([\s\S]*?)\n\t\t\],/)?.[1];
	if (!list) return [];

	return [...list.matchAll(/\{([^{}]*)\}/g)]
		.map(([, body]) => ({
			prop: body.match(/prop:\s*"([^"]+)"/)?.[1],
			value: body.match(/value:\s*"([^"]+)"/)?.[1],
			about: body.match(/about:\s*\n?\s*"((?:[^"\\]|\\.)*)"/)?.[1] ?? "",
			default: /default:\s*true/.test(body),
		}))
		.filter((one) => one.prop && one.value);
}

/**
 * The demo ids, read as the keys of the `DEMOS` object.
 *
 * A substring search was the obvious shortcut and it was wrong: `demos.tsx`
 * contains `tone="motion"` and `category: "motion"` as ordinary data, so
 * `"motion"` looked like a demo that does not exist and the atoms motion guide
 * was told to add a showcase block that would render nothing.
 *
 * Keys are the one thing at a single tab of indentation followed by a colon
 * and a brace, which is structure rather than content and cannot be matched by
 * a string somebody wrote inside a demo.
 */
let demoIds;

export function demoNames() {
	if (demoIds) return demoIds;

	const source = read("apps/web/src/modules/showcase/demos.tsx");
	demoIds = new Set(
		[...source.matchAll(/^\t"?([\w-]+)"?:\s*\{/gm)].map(([, id]) => id),
	);

	return demoIds;
}

export function hasDemo(slug) {
	return demoNames().has(slug);
}

/* ── reading the source ──────────────────────────────────────────────── */

/*
 * Syntax only. `createSourceFile` parses one file; a `Program` would pull in
 * `lib.d.ts` and every transitive import to answer questions this does not ask.
 * The type wanted here is the type *as written* - `PaginationProps["renderLink"]`
 * should document itself as that, not as the function type it resolves to.
 */
function parse(path) {
	return ts.createSourceFile(
		path,
		read(path),
		ts.ScriptTarget.Latest,
		true,
		ts.ScriptKind.TSX,
	);
}

function isExported(node) {
	return Boolean(
		node.modifiers?.some((one) => one.kind === ts.SyntaxKind.ExportKeyword),
	);
}

/**
 * A member's JSDoc, flattened to one line. Empty when absent.
 *
 * The whole comment, not the first sentence. Truncating looked tidy and threw
 * away the useful half - "The still. Without one the frame is a plain ground
 * and the title." became "The still" - and it split on abbreviations, so a
 * ratio documented as "e.g. `16 / 9`" was cut to "for the reserved box, e.g".
 */
function docOf(node) {
	const [doc] = ts.getJSDocCommentsAndTags(node);
	if (!doc) return "";

	return (ts.getTextOfJSDocComment(doc.comment) ?? "")
		.replace(/\s+/g, " ")
		.trim();
}

/*
 * A type as written, flattened to one line for a table cell.
 *
 * `getText` returns the source verbatim, which for an inline object type means
 * the JSDoc comments written inside it come along. Those are documentation for
 * a shape nobody is filling in by hand; in a cell they are noise.
 */
function typeText(node, source) {
	if (!node) return "unknown";

	return node
		.getText(source)
		.replace(/\/\*[\s\S]*?\*\//g, "")
		.replace(/\/\/[^\n]*/g, "")
		.replace(/\s+/g, " ")
		.trim();
}

/*
 * Defaults live in the implementation, not the interface.
 *
 * `function ScrollSpin({ revolutions = 2, tilt = 8 }: ScrollSpinProps)` is
 * where the number 2 is written, and it is the only place it is written. A
 * `@default` tag would be a second copy, and a second copy of a number is a
 * number that will disagree with itself.
 */
function defaultsFor(source, interfaceName) {
	const defaults = new Map();

	function visit(node) {
		const isFunction =
			ts.isFunctionDeclaration(node) ||
			ts.isArrowFunction(node) ||
			ts.isFunctionExpression(node);

		if (isFunction && node.parameters.length > 0) {
			const [param] = node.parameters;

			if (
				typeText(param.type, source) === interfaceName &&
				ts.isObjectBindingPattern(param.name)
			) {
				for (const element of param.name.elements) {
					if (!element.initializer) continue;

					defaults.set(
						(element.propertyName ?? element.name).getText(source),
						element.initializer.getText(source).replace(/\s+/g, " "),
					);
				}
			}
		}

		ts.forEachChild(node, visit);
	}

	visit(source);
	return defaults;
}

function membersOf(declaration, source, interfaceName) {
	const defaults = defaultsFor(source, interfaceName);

	return declaration.members.filter(ts.isPropertySignature).map((member) => ({
		prop: member.name.getText(source),
		optional: Boolean(member.questionToken),
		type: typeText(member.type, source),
		default: defaults.get(member.name.getText(source)),
		doc: docOf(member),
	}));
}

/**
 * Every exported `*Props` interface in a file, with its members.
 *
 * More than one is normal: `archive.tsx` also exports the props of the thing it
 * composes. The first is the component's own table and the rest become
 * sub-tables, because a prop typed `PaginationProps["renderLink"]` is
 * undocumented until the reader can see what that is.
 */
export function readProps(sourcePath) {
	if (!existsSync(join(root, sourcePath))) return [];

	const source = parse(sourcePath);
	const found = [];

	for (const node of source.statements) {
		if (!isExported(node)) continue;

		if (ts.isInterfaceDeclaration(node) && node.name.text.endsWith("Props")) {
			found.push({
				name: node.name.text,
				generics: node.typeParameters?.map((one) => one.getText(source)) ?? [],
				/*
				 * Reported, never inlined. `InputProps extends
				 * InputHTMLAttributes<HTMLInputElement>` would otherwise render two
				 * hundred rows documenting the DOM rather than the component.
				 */
				extends:
					node.heritageClauses?.flatMap((clause) =>
						clause.types.map((one) => one.getText(source)),
					) ?? [],
				members: membersOf(node, source, node.name.text),
			});
			continue;
		}

		if (ts.isTypeAliasDeclaration(node) && node.name.text.endsWith("Props")) {
			found.push({
				name: node.name.text,
				generics: [],
				extends: [],
				alias: typeText(node.type, source),
				members: ts.isTypeLiteralNode(node.type)
					? membersOf(node.type, source, node.name.text)
					: [],
			});
		}
	}

	return found;
}

/**
 * The exported functions in a file, for the things that are not components.
 *
 * A hook has no props interface and never will. Its API is its signature, and
 * the signature is just as derivable - so `use-scroll-turn` gets a real API tab
 * rather than an apology for not having one.
 */
export function readSignatures(sourcePath) {
	if (!existsSync(join(root, sourcePath))) return [];

	const source = parse(sourcePath);
	const found = [];

	for (const node of source.statements) {
		if (!isExported(node)) continue;
		if (!ts.isFunctionDeclaration(node) || !node.name) continue;

		found.push({
			name: node.name.text,
			doc: docOf(node),
			signature: `${node.name.text}(${node.parameters
				.map((one) => one.getText(source).replace(/\s+/g, " "))
				.join(", ")}): ${typeText(node.type, source)}`,
			parameters: node.parameters.map((one) => ({
				name: one.name.getText(source),
				optional: Boolean(one.questionToken ?? one.initializer),
				type: typeText(one.type, source),
				default: one.initializer?.getText(source),
			})),
		});
	}

	return found;
}

/* ── rendering the API tab ───────────────────────────────────────────── */

/** A markdown cell. The pipe is the one character a table cannot survive. */
function cell(value) {
	return value.replaceAll("|", "\\|");
}

function propsTable(members) {
	const lines = [
		"| Prop | Type | Default | Does |",
		"| --- | --- | --- | --- |",
	];

	for (const member of members) {
		lines.push(
			`| \`${member.prop}${member.optional ? "?" : ""}\` ` +
				`| \`${cell(member.type)}\` ` +
				`| ${member.default ? `\`${cell(member.default)}\`` : "-"} ` +
				`| ${cell(member.doc)} |`,
		);
	}

	return lines.join("\n");
}

/**
 * The generated half of an `api.md`, from `## Props` to the heading after it.
 *
 * The doctor compares this against what is on disk exactly, so anything
 * hand-written has to live below it. That boundary is the whole design: above
 * it nothing can go stale, and below it nothing is regenerated away.
 */
export function renderApiSection(sourcePath) {
	const interfaces = readProps(sourcePath);
	const lines = [];

	if (interfaces.length === 0) {
		const signatures = readSignatures(sourcePath);
		if (signatures.length === 0) return "";

		/*
		 * `## Signature`, not `## Props`. A hook has no props and never will, and
		 * a heading that promises a table the file cannot contain is the kind of
		 * documentation that makes a reader think something is missing.
		 */
		lines.push("## Signature", "");

		for (const signature of signatures) {
			lines.push("```ts", signature.signature, "```", "");
			if (signature.doc) lines.push(signature.doc, "");
		}

		return lines.join("\n").trimEnd();
	}

	const [own, ...rest] = interfaces;

	lines.push("## Props", "");

	if (own.extends.length > 0) {
		lines.push(
			`Accepts every prop of ${own.extends
				.map((one) => `\`${one}\``)
				.join(" and ")}${own.members.length > 0 ? ", plus:" : "."}`,
			"",
		);
	}

	if (own.alias) lines.push(`\`${own.name}\` is \`${own.alias}\`.`, "");

	if (own.members.length > 0) lines.push(propsTable(own.members), "");

	for (const other of rest) {
		if (other.members.length === 0) continue;
		lines.push(`### ${other.name}`, "", propsTable(other.members), "");
	}

	return lines.join("\n").trimEnd();
}

/*
 * The fence around the generated half.
 *
 * An explicit marker rather than "from `## Props` to the next heading", because
 * that guess destroyed work. `scroll-spin/api.md` had `### revolutions`,
 * `### tilt` and a `[!CAUTION]` callout sitting under its table; they are `###`
 * rather than `##`, so a region that ran to the next `##` swallowed all three
 * and `--fix` deleted eighteen lines of somebody's writing.
 *
 * Stopping at `###` instead is not the fix either - the generator emits `###`
 * sub-tables of its own. A boundary that has to be inferred from content will
 * always be wrong for some file, so it is stated.
 */
export const API_OPEN = "<!-- generated:api -->";
export const API_CLOSE = "<!-- /generated:api -->";

/** The generated region as it currently sits on disk, fence excluded. */
export function generatedApiRegion(body) {
	const from = body.indexOf(API_OPEN);
	const to = body.indexOf(API_CLOSE);
	if (from === -1 || to === -1 || to < from) return undefined;

	return body.slice(from + API_OPEN.length, to).trim();
}

/** The same region with its fence, ready to write. */
export function fencedApi(section) {
	return `${API_OPEN}\n\n${section.trim()}\n\n${API_CLOSE}`;
}

/** A whole `api.md`, for a tab that does not exist yet. */
export function renderApiDoc(title, sourcePath) {
	const section = renderApiSection(sourcePath);
	const isSignature = section.startsWith("## Signature");

	return `${[
		"---",
		`title: ${title} API`,
		isSignature
			? "summary: What it takes, what it gives back, and what it does between."
			: "summary: Every prop, what it defaults to, and what happens when it is wrong.",
		"---",
		"",
		fencedApi(section),
		"",
		"## Notes",
		"",
		"Anything the types cannot say: which combinations are meaningless, which",
		"prop is ignored when another is set, and what it does when handed",
		"something it cannot render.",
		"",
	].join("\n")}`;
}

/* ── the contract ────────────────────────────────────────────────────── */

/*
 * Headings the templates themselves create, which are prose by design.
 *
 * The "a heading earns its place" rule below would otherwise punish exactly the
 * sections `templates/component-*.md` tell an author to write, which trains
 * people to delete good content. `checkTemplates` cross-checks this list, so a
 * template that grows a new prose heading is a template the doctor asks about.
 */
export const PROSE_SECTIONS = [
	"Why it is built this way",
	"What it does not do",
	"When not to use it",
	"What this example is not",
	"What you should see",
	"If nothing happens",
	"Notes",
];

/*
 * Props whose name is the whole documentation.
 *
 * `children: ReactNode` does not need a sentence, and forcing one produces
 * "The children." forty times - a comment that restates its subject, which is
 * the opposite of the house rule that comments explain why. The exemption
 * lapses the moment a prop has a default, because then the default is the thing
 * that needs explaining and the name says nothing about it.
 */
const SELF_EVIDENT = new Set(["children", "className", "title", "label"]);

export function needsDoc(member) {
	if (member.doc) return false;
	if (member.default) return true;

	return !SELF_EVIDENT.has(member.prop);
}

/*
 * A block that shows the element running, which is what Home owes a reader.
 *
 * Narrow on purpose: `grid` and `spacer` are blocks, but a page that only laid
 * something out has still not shown the component it documents.
 */
const LIVE_BLOCK = /<!--\s*::start:(showcase|viewer|device|shelf)\b/;

/*
 * Any registered block at all, for the "a heading earns its place" rule.
 *
 * Wider than `LIVE_BLOCK`, and the difference is a real finding: a section of
 * `spacer/guides.md` demonstrates the component with an inline
 * `<!-- ::start:spacer -->` and was reported as prose with nothing to copy,
 * because the narrow pattern did not know that block. The two questions are
 * different - "does Home show the thing" and "does this heading hand the
 * reader anything" - so they get two patterns rather than one compromise.
 */
const ANY_BLOCK = /<!--\s*::start:[a-z-]+/;

function withoutFrontmatter(body) {
	return body.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, "");
}

function countWords(text) {
	return text
		.replace(/```[\s\S]*?```/g, "")
		.replace(/<!--[\s\S]*?-->/g, "")
		.split(/\s+/)
		.filter(Boolean).length;
}

/**
 * The lead paragraph: the first prose block, and the line that has to survive
 * being read on its own.
 *
 * It is the meta description, the `llms.txt` entry and the sentence under the
 * heading. Defined narrowly on purpose - a heading, a comment, a callout or a
 * fence is not a lead, so a page that opens with its demo has no lead and the
 * contract says so rather than silently accepting the first thing it finds.
 */
function leadParagraph(body) {
	for (const block of withoutFrontmatter(body).split(/\r?\n\s*\r?\n/)) {
		const text = block.trim();
		if (!text) continue;
		if (/^(#|<!--|>|```|\||-\s)/.test(text)) continue;

		return text;
	}

	return "";
}

/** Every `##` heading with the body under it, up to the next one. */
function sections(body) {
	const stripped = withoutFrontmatter(body).replace(/```[\s\S]*?```/g, (run) =>
		run.replace(/^##/gm, "  "),
	);

	const found = [];
	const pattern = /^## (.+)$/gm;
	let match = pattern.exec(stripped);

	while (match) {
		const start = match.index + match[0].length;
		const next = pattern.exec(stripped);

		found.push({
			heading: match[1].trim(),
			body: stripped.slice(start, next ? next.index : undefined),
		});

		match = next;
	}

	return found;
}

function carriesSomethingToTake(body) {
	return (
		/```/.test(body) ||
		/^\s*\|/m.test(body) ||
		ANY_BLOCK.test(body) ||
		/^>\s*\[!/m.test(body)
	);
}

export const LEAD_WORDS = 60;
export const INDEX_WORDS = 350;
export const PROSE_WORDS = 80;

/**
 * One document against the contract.
 *
 * Returns findings; it does not report them. The doctor turns a finding into a
 * failure and `pnpm run docs` turns it into a row, and both read the same list -
 * which is the only way the gate and the report cannot disagree.
 *
 * `context` is passed in rather than discovered, for the same reason.
 */
export function evaluateDoc(section, body, context = {}) {
	const findings = [];
	const add = (rule, message, hint) => findings.push({ rule, message, hint });

	if (!/^---\r?\n/.test(body)) {
		add("frontmatter", "no frontmatter block");
	} else {
		const block = /^---\r?\n([\s\S]*?)\r?\n---/.exec(body)?.[1] ?? "";
		for (const key of ["title", "summary"]) {
			const value = new RegExp(`^${key}:(.*)$`, "m").exec(block)?.[1];
			if (value === undefined) add("frontmatter", `missing \`${key}:\``);
			else if (!value.trim()) add("frontmatter", `\`${key}:\` is empty`);
		}
	}

	for (const one of sections(body)) {
		if (PROSE_SECTIONS.includes(one.heading)) continue;
		if (carriesSomethingToTake(one.body)) continue;
		if (countWords(one.body) <= PROSE_WORDS) continue;

		add(
			"unearned-heading",
			`\`## ${one.heading}\` runs to ${countWords(one.body)} words with nothing to copy`,
			"give it the example it is describing, or move it into guides",
		);
	}

	if (section === "index") {
		const lead = leadParagraph(body);

		if (!lead) {
			add(
				"lead",
				"no lead paragraph",
				"one paragraph before the first heading - it is the meta description and the llms.txt line",
			);
		} else if (countWords(lead) > LEAD_WORDS) {
			add(
				"lead",
				`lead paragraph is ${countWords(lead)} words (limit ${LEAD_WORDS})`,
			);
		}

		if (context.hasDemo && !LIVE_BLOCK.test(body)) {
			add(
				"live-block",
				"a demo exists but Home does not show it",
				`add <!-- ::start:showcase demo="${context.slug}" height="380" -->`,
			);
		}

		const words = countWords(body);
		if (words > INDEX_WORDS) {
			add(
				"index-length",
				`Home is ${words} words (limit ${INDEX_WORDS})`,
				`it is carrying another tab: pnpm new docs ${context.slug} guides, then move whole sections into it`,
			);
		}
	}

	if (section === "get-started" && !/```tsx/.test(body)) {
		add("no-code", "Get Started with no `tsx` example");
	}

	if (section === "examples") {
		if (!LIVE_BLOCK.test(body))
			add("live-block", "Examples with nothing running");
		if (!/```tsx/.test(body)) add("no-code", "Examples with no `tsx` example");
	}

	if (section === "api" && context.expectedApi) {
		const found = generatedApiRegion(body);

		if (!found) {
			add("api-drift", "no generated API section", "pnpm run doctor --fix");
		} else if (found !== context.expectedApi.trim()) {
			add(
				"api-drift",
				"the API section does not match the source",
				"pnpm run doctor --fix - and edit the JSDoc, not this table",
			);
		}
	}

	return findings;
}

/* ── the survey ──────────────────────────────────────────────────────── */

/** Every documented slug on disk, with the sections it has. */
export function docSlugs() {
	const found = [];

	for (const pkg of readdirSync(join(root, "packages"))) {
		const docs = join(root, "packages", pkg, "docs");
		if (!existsSync(docs) || !statSync(docs).isDirectory()) continue;

		for (const slug of readdirSync(docs)) {
			const dir = join(docs, slug);
			if (!statSync(dir).isDirectory()) continue;

			found.push({
				pkg,
				slug,
				dir: `packages/${pkg}/docs/${slug}`,
				sections: readdirSync(dir)
					.filter((file) => file.endsWith(".md"))
					.map((file) => file.replace(/\.md$/, "")),
			});
		}
	}

	return found.sort((a, b) => a.slug.localeCompare(b.slug));
}

/**
 * Every element, what it has, and what the contract says about it.
 *
 * Registry-driven with the doc-only slugs unioned in, the same shape
 * `listComponentPages` uses on the site - an element with a page and no row
 * here would be an element the report cannot see.
 */
export function survey(registry = readRegistry()) {
	const order = sectionOrder();
	const onDisk = new Map(docSlugs().map((one) => [one.slug, one]));
	const items = new Map(registry.map((item) => [item.name, item]));

	const slugs = [...new Set([...items.keys(), ...onDisk.keys()])].sort();

	return slugs.map((slug) => {
		const item = items.get(slug);
		const docs = onDisk.get(slug);
		const source = item ? `packages/ui/src/${item.files[0]}` : undefined;
		const expectedApi = source ? renderApiSection(source) : "";

		const findings = [];
		for (const section of order) {
			if (!docs?.sections.includes(section)) continue;

			const path = `${docs.dir}/${section}.md`;
			for (const finding of evaluateDoc(section, read(path), {
				slug,
				hasDemo: hasDemo(slug),
				expectedApi,
			})) {
				findings.push({ ...finding, path, section });
			}
		}

		return {
			slug,
			pkg: docs?.pkg ?? "ui",
			title: item?.title ?? slug,
			registered: Boolean(item),
			source,
			hasDemo: hasDemo(slug),
			present: order.filter((section) => docs?.sections.includes(section)),
			findings,
		};
	});
}
