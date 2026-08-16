#!/usr/bin/env node

/*
 * Every workspace must have a manifest COPY line in the Dockerfile.
 *
 * This exists because the same mistake shipped three broken deploys in a row.
 * Docker flattens a glob like `packages/＊/package.json` into one directory and
 * loses the paths pnpm needs, so the list has to be written by hand — and a
 * hand-written list of things that grows is a list that goes stale.
 *
 * The failure it catches is not subtle at build time, but it is invisible at
 * commit time, which is the only moment anyone could have fixed it cheaply.
 */

import { readdir, readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

/** Directories under `apps/` and `packages/` that carry a package.json. */
async function findWorkspaces() {
	const found = [];

	for (const group of ["apps", "packages"]) {
		let entries;
		try {
			entries = await readdir(join(root, group), { withFileTypes: true });
		} catch {
			continue;
		}

		for (const entry of entries) {
			if (!entry.isDirectory()) continue;

			try {
				await readFile(join(root, group, entry.name, "package.json"));
				found.push(`${group}/${entry.name}`);
			} catch {
				// A directory without a manifest is not a workspace.
			}
		}
	}

	return found.sort();
}

const dockerfile = await readFile(join(root, "Dockerfile"), "utf8");
const workspaces = await findWorkspaces();

const missing = workspaces.filter(
	(workspace) => !dockerfile.includes(`COPY ${workspace}/package.json`),
);

if (missing.length > 0) {
	console.error("Dockerfile is missing a manifest COPY for:\n");
	for (const workspace of missing) {
		console.error(`  COPY ${workspace}/package.json ${workspace}/`);
	}
	console.error(
		"\nAdd those lines to the deps stage. Without them the install runs\nwithout that workspace and the build fails on an unresolved import\nthat names the importer, not the missing package.",
	);
	process.exit(1);
}

console.log(`Dockerfile covers all ${workspaces.length} workspaces.`);
