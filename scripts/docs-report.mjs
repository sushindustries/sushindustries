#!/usr/bin/env node

/*
 * What every element has documented, and what it is missing.
 *
 *   pnpm docs                 the matrix
 *   pnpm docs --todo          only the rows with a gap
 *   pnpm docs --slug <name>   one element, every finding in full
 *   pnpm docs --json          the same data, for something else to read
 *
 * **This always exits 0.** `pnpm doctor` is the gate; a report that can fail a
 * build is a second gate, and two gates disagree eventually. This one is for
 * looking at - it says where the work is, and the doctor says what is not
 * allowed to ship.
 *
 * The columns come from `sectionOrder()`, so adding a sixth tab to the museum
 * adds a sixth column here with no edit.
 */

import { readRegistry, sectionOrder, survey } from "./docs.mjs";

const argv = process.argv.slice(2);
const wantJson = argv.includes("--json");
const todoOnly = argv.includes("--todo");
const only = argv[argv.indexOf("--slug") + 1];
const wantOne = argv.includes("--slug") && only && !only.startsWith("--");

const order = sectionOrder();
const rows = survey(readRegistry());

if (wantJson) {
	console.log(JSON.stringify({ sections: order, elements: rows }, null, 2));
	process.exit(0);
}

/* ── one element, in full ────────────────────────────────────────────── */

if (wantOne) {
	const row = rows.find((one) => one.slug === only);

	if (!row) {
		console.error(`No element called "${only}".`);
		process.exit(0);
	}

	console.log(`${row.slug}  (${row.pkg})`);
	console.log(row.registered ? `  ${row.title}` : "  not in the registry");
	console.log("");

	for (const section of order) {
		const has = row.present.includes(section);
		const found = row.findings.filter((one) => one.section === section);
		const state = has ? (found.length === 0 ? "ok" : `${found.length}`) : "-";
		console.log(`  [${has ? "x" : " "}] ${section.padEnd(12)} ${state}`);

		for (const finding of found) {
			console.log(`        ${finding.rule}: ${finding.message}`);
			if (finding.hint) console.log(`        -> ${finding.hint}`);
		}
	}

	const missing = order.filter((section) => !row.present.includes(section));
	if (missing.length > 0) {
		console.log("");
		for (const section of missing) {
			console.log(`  pnpm new docs ${row.slug} ${section}`);
		}
	}

	process.exit(0);
}

/* ── the matrix ──────────────────────────────────────────────────────── */

/* Short headers, because seven full section names is wider than a terminal. */
const HEADS = { index: "home", "get-started": "start", examples: "ex" };
const head = (section) => HEADS[section] ?? section.slice(0, 6);

const width = Math.max(...rows.map((row) => row.slug.length), 7);

function state(row, section) {
	if (!row.present.includes(section)) return "[ ]";

	/*
	 * `[~]` for an API tab that exists and has drifted from the source. Drift is
	 * not absence, and a matrix that showed both as `[x]` would report a table
	 * that lies as documentation that is done.
	 */
	const drifted = row.findings.some(
		(one) => one.section === section && one.rule === "api-drift",
	);

	return drifted ? "[~]" : "[x]";
}

const shown = todoOnly
	? rows.filter(
			(row) => row.findings.length > 0 || row.present.length < order.length,
		)
	: rows;

const byPackage = new Map();
for (const row of shown) {
	byPackage.set(row.pkg, [...(byPackage.get(row.pkg) ?? []), row]);
}

for (const [pkg, group] of [...byPackage].sort()) {
	console.log(`\npackages/${pkg}  (${group.length})\n`);
	console.log(
		`  ${"element".padEnd(width)}  ${order.map((s) => head(s).padEnd(5)).join(" ")} demo  contract`,
	);

	for (const row of group) {
		const cells = order.map((s) => state(row, s).padEnd(5)).join(" ");
		const demo = row.hasDemo ? "[x] " : "[ ] ";
		const note =
			row.findings.length === 0
				? ""
				: `${row.findings.length} finding${row.findings.length === 1 ? "" : "s"}`;

		console.log(`  ${row.slug.padEnd(width)}  ${cells} ${demo} ${note}`);
	}
}

/* ── the totals, which are the point ─────────────────────────────────── */

const total = rows.length;
const counts = order.map(
	(section) =>
		`${head(section)} ${rows.filter((row) => row.present.includes(section)).length}/${total}`,
);

const clean = rows.filter((row) => row.findings.length === 0).length;
const findings = rows.reduce((sum, row) => sum + row.findings.length, 0);

console.log(`\n${total} elements`);
console.log(
	`  ${counts.join("   ")}   demo ${rows.filter((r) => r.hasDemo).length}/${total}`,
);
console.log(
	`  ${clean} clean, ${total - clean} with findings (${findings} in total)`,
);

if (!todoOnly && findings > 0) {
	console.log("\n  pnpm docs --todo        only what needs work");
	console.log("  pnpm docs --slug <name> one element, in full");
}
