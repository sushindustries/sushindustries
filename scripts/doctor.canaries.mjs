#!/usr/bin/env node

/*
 * Does each check actually check anything?
 *
 * The doctor is 61 checks gating every push, and until now nothing verified
 * that any of them could fail. That is not a hypothetical worry.
 * `checkGraphqlOperationsValidate` shipped with a `return` in a catch, `graphql`
 * was not resolvable from the repo root under pnpm, and for its entire life the
 * check ran, found nothing, and passed - including over an operation with a
 * misspelt field. A check that cannot fail has no symptom. It looks exactly
 * like a check that is satisfied.
 *
 * So: plant a violation, run the doctor, and assert it is reported. Twelve of
 * the checks have an early return or a swallowing catch that could turn them
 * into a no-op, and those are the ones a canary is worth writing for.
 *
 *   node scripts/doctor.canaries.mjs
 *
 * Each canary writes into the real working tree and removes it afterwards,
 * which is deliberate: the doctor reads `git ls-files` and its own root, so a
 * copy of the repo somewhere else would exercise a different thing than the one
 * that gates the push. The cleanup runs in a `finally`, and the runner refuses
 * to start if the tree is dirty in a way it would confuse.
 */

import { execFileSync } from "node:child_process";
import {
	existsSync,
	mkdirSync,
	readFileSync,
	rmSync,
	writeFileSync,
} from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

/**
 * Runs the doctor and returns which checks reported, as a set.
 *
 * The output is grouped by check name at the left margin, which is what makes
 * this parseable without a `--json` flag the doctor does not have. Adding one
 * only for the tests would be a second output format to keep in step.
 */
function doctorReports() {
	try {
		execFileSync(process.execPath, [join(root, "scripts/doctor.mjs")], {
			cwd: root,
			encoding: "utf8",
			stdio: "pipe",
		});
		return new Set();
	} catch (error) {
		const text = `${error.stdout ?? ""}${error.stderr ?? ""}`;
		return new Set(
			text
				.split("\n")
				.filter(
					(line) =>
						/^[a-z][a-z-]*$/.test(line.trim()) && line === line.trimStart(),
				)
				.map((line) => line.trim()),
		);
	}
}

/* ── the canaries ─────────────────────────────────────────────────────── */

const written = [];

/** Writes a file the canary owns, remembering it for cleanup. */
function plant(relative, contents) {
	const full = join(root, relative);
	mkdirSync(dirname(full), { recursive: true });
	writeFileSync(full, contents);
	written.push(full);
}

/** Edits an existing file, remembering its original text for restoration. */
const edits = [];
function tamper(relative, change) {
	const full = join(root, relative);
	const before = readFileSync(full, "utf8");
	edits.push([full, before]);
	writeFileSync(full, change(before));
}

function restore() {
	for (const path of written.splice(0)) {
		rmSync(path, { force: true });
	}
	for (const [path, before] of edits.splice(0)) {
		writeFileSync(path, before);
	}
}

const CANARIES = [
	{
		check: "import-protection",
		about: "a file in a server/ directory, which no deny pattern matches",
		plant: () =>
			plant(
				"apps/web/src/modules/stats/server/canary.ts",
				"export const canary = process.env.DATABASE_URL;\n",
			),
	},
	{
		check: "scripts",
		about: "a workspace script that is not a turbo task",
		plant: () =>
			tamper("packages/db/package.json", (before) =>
				before.replace(
					'"scripts": {',
					'"scripts": {\n\t\t"canary:types": "tsc --noEmit",',
				),
			),
	},
	{
		check: "operations",
		about: "a GraphQL operation naming a field the schema does not have",
		plant: () =>
			plant(
				"apollo/operations/Canary.graphql",
				"query Canary {\n\ttotals {\n\t\tfieldThatDoesNotExist\n\t}\n}\n",
			),
	},
	{
		check: "dockerfile",
		about: "a workspace with no manifest COPY line",
		plant: () =>
			plant(
				"packages/canary/package.json",
				'{\n\t"name": "@sushindustries/canary",\n\t"version": "0.0.0",\n\t"description": "A canary.",\n\t"license": "MIT"\n}\n',
			),
	},
	{
		check: "style",
		about: "an em dash in prose",
		/*
		 * The character, by code point, and not typed inline.
		 *
		 * The first version of this canary said "prose with an em dash" in
		 * words and contained none, so the check correctly reported nothing and
		 * the canary called it dead. Worth keeping as a comment: a canary that
		 * does not contain the violation tests the test, not the check, and it
		 * fails in the direction that looks like a real find.
		 *
		 * Written as an escape because this file is itself subject to the rule
		 * it is planting a violation of.
		 */
		plant: () =>
			plant("CANARY.md", `# Canary\n\nProse with an \u2014 in it.\n`),
	},
];

/* ── running them ─────────────────────────────────────────────────────── */

/*
 * Only the files a canary touches, not the whole tree.
 *
 * The first version refused on any change at all, which made it unrunnable
 * during the work it exists to protect - and a test you cannot run while
 * writing code is a test that runs once. What actually matters is narrower:
 * `tamper` restores the exact text it read, so it must not read text somebody
 * is midway through editing.
 */
const TOUCHED = ["packages/db/package.json"];

const dirty = execFileSync("git", ["status", "--porcelain", "--", ...TOUCHED], {
	cwd: root,
	encoding: "utf8",
}).trim();

if (dirty) {
	console.error("A file these canaries edit has uncommitted changes:\n");
	console.error(dirty);
	console.error("\nCommit or stash it - the canary restores what it read, and");
	console.error("reading a half-finished edit would restore that instead.");
	process.exit(2);
}

console.log("Checking that each check can fail.\n");

const clean = doctorReports();
if (clean.size > 0) {
	console.error(`The doctor already reports ${[...clean].join(", ")}.`);
	console.error("Fix that first; a canary cannot be read through it.");
	process.exit(2);
}

let failed = 0;

for (const canary of CANARIES) {
	try {
		canary.plant();
		const reported = doctorReports();

		if (reported.has(canary.check)) {
			console.log(`  ok    ${canary.check} caught ${canary.about}`);
		} else {
			failed += 1;
			console.error(`  DEAD  ${canary.check} did not catch ${canary.about}`);
			console.error(
				`        the check ran and reported nothing, which is what a`,
			);
			console.error(`        satisfied check looks like. It is not one.`);
		}
	} finally {
		restore();
	}
}

console.log("");

if (failed > 0) {
	console.error(`${failed} of ${CANARIES.length} checks cannot fail.`);
	process.exit(1);
}

console.log(`All ${CANARIES.length} checks caught their canary.`);

if (existsSync(join(root, "CANARY.md"))) {
	console.error("A canary was left behind. That is a bug in the cleanup.");
	process.exit(1);
}
