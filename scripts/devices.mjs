/*
 * `packages/atoms/devices.md` in, a stylesheet and a type module out.
 *
 * The three machines the site draws itself as are a table in Markdown because
 * that is where the reason for each number can sit beside the number. They are
 * generated because the same widths are needed in two languages that cannot
 * read each other:
 *
 *   the stylesheet needs literal `min-width` values, since a media query
 *   cannot ask a custom property anything
 *
 *   the client needs the same widths to tell the assistant which machine it is
 *   running on
 *
 * Before this they were written down in both places and agreed by luck.
 *
 * The doctor regenerates and compares, so editing either output by hand is a
 * change that gets reverted rather than a change that sticks.
 */

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

export const DEVICE_SOURCE = "packages/atoms/devices.md";
export const DEVICE_CSS = "packages/atoms/src/devices.css";
export const DEVICE_TYPES = "packages/ui/src/device-kinds.ts";

/*
 * Every decorative part, and the element it is drawn as.
 *
 * Listed here rather than derived from the table because the generator has to
 * emit a `display` for parts a row does *not* name - a part nobody mentions is
 * hidden, and "hidden" is a rule that has to be written to have an effect.
 */
const PARTS = ["deck", "hinge", "camera", "bar"];

/** The first cell of every row in the first table with a `Kind` header. */
function rows(body) {
	const found = [];
	let inTable = false;

	for (const line of body.split("\n")) {
		if (!line.startsWith("|")) {
			// A blank line ends the table, so later tables in the file are ignored.
			if (inTable && line.trim() === "") break;
			continue;
		}

		const cells = line
			.split("|")
			.slice(1, -1)
			.map((cell) => cell.trim());

		if (cells[0] === "Kind") {
			inTable = true;
			continue;
		}

		if (!inTable) continue;
		if (/^-+$/.test(cells[0] ?? "")) continue;
		if (cells.length < 11) continue;

		found.push(cells);
	}

	return found;
}

/** `` `3 / 6` `` -> `3 / 6`. The backticks are for reading, not for meaning. */
function bare(cell) {
	return cell.replace(/`/g, "").trim();
}

/** Every device in the table, narrowest first. */
export function readDevices() {
	const body = readFileSync(join(root, DEVICE_SOURCE), "utf8");

	return rows(body).map((cells) => {
		const [
			kind,
			from,
			width,
			aspect,
			columns,
			bezel,
			corner,
			lens,
			tilt,
			chrome,
			why,
		] = cells;

		return {
			kind: bare(kind),
			from: Number.parseInt(bare(from), 10),
			width: bare(width),
			aspect: bare(aspect),
			columns: bare(columns),
			bezel: bare(bezel),
			corner: bare(corner),
			lens: bare(lens),
			tilt: bare(tilt),
			chrome: [...chrome.matchAll(/`([^`]+)`/g)].map(([, part]) => part),
			why,
		};
	});
}

/** Every problem with the table, as sentences. Empty means it is usable. */
export function devicesProblems(devices) {
	const problems = [];

	if (devices.length === 0) {
		problems.push("no rows - the table needs a `Kind` header and at least one");
		return problems;
	}

	if (devices[0].from !== 0) {
		problems.push(
			`"${devices[0].kind}" is first and starts at ${devices[0].from}px, so nothing applies below that`,
		);
	}

	for (const [index, device] of devices.entries()) {
		if (!/^[a-z]+$/.test(device.kind)) {
			problems.push(`"${device.kind}" is not one lowercase word`);
		}

		if (Number.isNaN(device.from)) {
			problems.push(`"${device.kind}" has no readable From`);
		}

		const previous = devices[index - 1];
		if (previous && device.from <= previous.from) {
			problems.push(
				`"${device.kind}" starts at ${device.from}px, which is not past "${previous.kind}" at ${previous.from}px - the later rule would never apply`,
			);
		}

		for (const part of device.chrome) {
			if (PARTS.includes(part)) continue;
			problems.push(
				`"${device.kind}" lists chrome "${part}", which is not one of ${PARTS.join(", ")}`,
			);
		}
	}

	return problems;
}

/** The custom properties one row sets, as declaration lines. */
function declarations(device, indent) {
	const lines = [
		`--device-width: ${device.width};`,
		`--device-aspect: ${device.aspect};`,
		`--device-columns: ${device.columns};`,
		`--device-bezel: ${device.bezel};`,
		`--device-corner: ${device.corner};`,
		`--device-lens: ${device.lens};`,
		`--device-tilt: ${device.tilt};`,
		...PARTS.map(
			(part) =>
				`--device-${part}: ${device.chrome.includes(part) ? "block" : "none"};`,
		),
		/*
		 * The home indicator is the one part that takes space as well as being
		 * drawn. It sits over the bottom of the screen, so the dock has to be
		 * lifted clear of it or the two overlap - which is a layout consequence of
		 * a fact the table already states, and therefore belongs here rather than
		 * as a second column somebody has to keep in step with `Chrome`.
		 */
		`--device-floor: ${device.chrome.includes("bar") ? "14px" : "0px"};`,
	];

	return lines.map((line) => `${indent}${line}`).join("\n");
}

export function renderDevicesCss(devices) {
	const blocks = devices.map((device) => {
		/*
		 * Twice, deliberately.
		 *
		 * The query form is what a visitor gets, and it is excluded from any
		 * element that names a machine so a chosen one is not fought over by the
		 * window width. The attribute form has no query, so it wins everywhere and
		 * the choice sticks.
		 *
		 * Both selectors are two simple selectors wide, so they tie on specificity
		 * and order decides - which is why the attribute forms are all emitted
		 * after the query forms.
		 */
		const query =
			device.from === 0
				? `\t/* ${device.why} */\n\t.device:not([data-device]) {\n${declarations(device, "\t\t")}\n\t}`
				: `\t/* ${device.why} */\n\t@media (min-width: ${device.from}px) {\n\t\t.device:not([data-device]) {\n${declarations(device, "\t\t\t")}\n\t\t}\n\t}`;

		return query;
	});

	const chosen = devices.map(
		(device) =>
			`\t.device[data-device="${device.kind}"] {\n${declarations(device, "\t\t")}\n\t}`,
	);

	return `/*
 * Generated from \`${DEVICE_SOURCE}\`. Do not edit by hand.
 *
 * Which machine the site draws itself as, decided by the stylesheet rather than
 * by JavaScript. A component that measures the window renders nothing on the
 * server and the wrong thing on the first client frame; a media query is right
 * before any JavaScript arrives and cannot disagree with the server about it.
 *
 * Every rule is written twice: once under its width for an element that has not
 * chosen, and once as an attribute selector for an element that has. The two
 * forms tie on specificity, so the chosen ones come last.
 *
 * Add a machine by adding a row to the table, then \`pnpm doctor --fix\`.
 */

@layer blocks {
${blocks.join("\n\n")}

	/* Chosen by hand, in Settings or in a showcase. Beats every query above. */
${chosen.join("\n\n")}
}
`;
}

export function renderDeviceTypes(devices) {
	/*
	 * One line if it fits in eighty columns, otherwise one per line.
	 *
	 * That is the same call the formatter makes, and the generator has to make
	 * it too: the doctor compares this output to the file on disk, and biome
	 * rewrites the file on disk. Emit the union the other way and every run is
	 * "generate, format, no longer matches, generate" forever.
	 */
	const names = devices.map((device) => `"${device.kind}"`);
	const oneLine = `export type DeviceKind = ${names.join(" | ")};`;

	const union =
		oneLine.length <= 80
			? oneLine
			: `export type DeviceKind =\n${names.map((name) => `\t| ${name}`).join("\n")};`;

	const entries = devices
		.map((device) => {
			const label = device.kind[0].toUpperCase() + device.kind.slice(1);

			return `\t// ${device.why}\n\t{\n\t\tkind: "${device.kind}",\n\t\tlabel: "${label}",\n\t\tfrom: ${device.from},\n\t\twidth: "${device.width}",\n\t\taspect: "${device.aspect}",\n\t\tcolumns: ${device.columns},\n\t},`;
		})
		.join("\n");

	return `/*
 * Generated from \`${DEVICE_SOURCE}\`. Do not edit by hand.
 *
 * The same widths \`devices.css\` compiles into media queries, in a form the
 * client can read. Nothing here draws anything: it exists so that code which
 * has to *name* the current machine - the assistant telling a model where it is
 * running, a settings panel listing what you can pick - agrees with the
 * stylesheet by construction instead of by memory.
 *
 * Add a machine by adding a row to the table, then \`pnpm doctor --fix\`.
 */

${union}

export interface DeviceProfile {
	readonly kind: DeviceKind;
	/** For a menu. Capitalised, one word. */
	readonly label: string;
	/** The \`min-width\` this machine takes over at. The first is always 0. */
	readonly from: number;
	/** The widest it is ever drawn, as a CSS length. */
	readonly width: string;
	/** The shape of its screen, as an \`aspect-ratio\` value. */
	readonly aspect: string;
	/** How many icons wide its desktop is. */
	readonly columns: number;
}

/**
 * Narrowest first, which is also the order the media queries are written in.
 *
 * Typed as a non-empty tuple, so \`DEVICES[0]\` is a \`DeviceProfile\` rather than
 * a \`DeviceProfile | undefined\`. That first entry is the fallback everywhere -
 * it is the machine with no lower bound, so it is what a browser that matches
 * no query gets and what a server render assumes - and having to null-check the
 * one element that is guaranteed to exist is a check that teaches the reader
 * the wrong thing. The doctor rejects a table with no rows, which is what makes
 * this true rather than asserted.
 */
export const DEVICES: readonly [DeviceProfile, ...DeviceProfile[]] = [
${entries}
];

export const DEVICE_KINDS: readonly DeviceKind[] = DEVICES.map(
	(device) => device.kind,
);

/**
 * The media query a machine takes over at, for \`matchMedia\`.
 *
 * The widest matching query wins, exactly as the cascade resolves it - so this
 * is only useful walked from the end, which is what \`deviceKindFor\` does.
 */
export function deviceQuery(kind: DeviceKind): string {
	const device = DEVICES.find((entry) => entry.kind === kind);

	return device && device.from > 0 ? \`(min-width: \${device.from}px)\` : "all";
}

/** Which machine a viewport of this width is, without touching the DOM. */
export function deviceKindFor(width: number): DeviceKind {
	// The first row has no lower bound, so it is what nothing-matched means.
	let found: DeviceKind = "${devices[0].kind}";

	for (const device of DEVICES) {
		if (width >= device.from) found = device.kind;
	}

	return found;
}
`;
}
