import {
	SCHEMA_PARENTS,
	SCHEMA_PROPERTIES,
	SCHEMA_TYPES,
	type SchemaTypeName,
} from "./schema-org.generated";

/*
 * The vocabulary, and the four questions anything here ever asks of it.
 *
 * Its own entry point rather than part of `schema.ts`, because the generated
 * data is ninety kilobytes and a route that only wants a table's row type must
 * not drag it into a browser bundle. Types are free - `SchemaTypeName` is
 * erased at build - so `schema.ts` imports the name and nothing else, and this
 * module is imported only where the answers are actually needed: validation on
 * the server, and the doctor.
 */

export {
	SCHEMA_PARENTS,
	SCHEMA_PROPERTIES,
	SCHEMA_TYPES,
	type SchemaTypeName,
} from "./schema-org.generated";

const KNOWN = new Set<string>(SCHEMA_TYPES);

/** Is this a class schema.org publishes? */
export function isSchemaType(name: string): name is SchemaTypeName {
	return KNOWN.has(name);
}

/**
 * Every ancestor of a type, nearest first.
 *
 * schema.org is a multiple-inheritance graph rather than a tree - `Hotel` is
 * both a `LodgingBusiness` and a `Place` - so this walks a queue and dedupes,
 * which is the difference between "every ancestor" and "one arbitrary path
 * through the ancestors".
 */
export function schemaAncestors(
	name: SchemaTypeName,
): readonly SchemaTypeName[] {
	const seen = new Set<string>();
	const found: SchemaTypeName[] = [];
	const queue = [...(SCHEMA_PARENTS[name] ?? [])];

	while (queue.length > 0) {
		const parent = queue.shift();
		if (!parent || seen.has(parent)) continue;
		seen.add(parent);
		if (isSchemaType(parent)) found.push(parent);
		queue.push(...(SCHEMA_PARENTS[parent] ?? []));
	}

	return found;
}

/** Is `name` this type, or any subtype of it? */
export function isKindOf(name: string, ancestor: SchemaTypeName): boolean {
	if (!isSchemaType(name)) return false;
	if (name === ancestor) return true;
	return schemaAncestors(name).includes(ancestor);
}

/**
 * Every property a type may carry, inherited ones included.
 *
 * Derived rather than stored: flattening this into the generated file would
 * multiply it by the depth of the tree to save a walk nobody runs in a loop.
 */
export function schemaProperties(name: SchemaTypeName): readonly string[] {
	const found = new Set<string>(SCHEMA_PROPERTIES[name] ?? []);
	for (const ancestor of schemaAncestors(name)) {
		for (const property of SCHEMA_PROPERTIES[ancestor] ?? [])
			found.add(property);
	}
	return [...found].sort();
}

/** The properties on this object that the type does not declare. */
export function unknownProperties(
	name: SchemaTypeName,
	properties: Readonly<Record<string, unknown>>,
): readonly string[] {
	const allowed = new Set(schemaProperties(name));
	return Object.keys(properties).filter((key) => !allowed.has(key));
}
