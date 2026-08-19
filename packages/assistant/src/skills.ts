/*
 * `skills/*.md` in, tool definitions out.
 *
 * A skill is a thing the assistant can *do*, and its most important field is
 * prose: the `summary` is not documentation, it is the instruction the model
 * reads when deciding whether to call it. That sentence is worth reviewing,
 * which is why it lives in a Markdown file rather than inside a string three
 * arguments deep in a TypeScript object.
 *
 * This module declares shape and never implements one. What a skill actually
 * does is always about the host - searching *this* registry, reading *these*
 * docs - so a package that shipped handlers could serve exactly one site. Same
 * split as `renderMarkdown` on the panel, and `renderEntry` on the shelf.
 */

/** The three types a parameter may have. See `skills/README.md` for why three. */
export type SkillType = "string" | "number" | "boolean";

export interface SkillParameter {
	readonly name: string;
	readonly type: SkillType;
	readonly required: boolean;
	/** Prompt text. The model reads this to fill the argument. */
	readonly description: string;
}

export interface Skill {
	/** The function name the model calls. `snake_case`. */
	readonly name: string;
	/** The one line the model reads when deciding. */
	readonly summary: string;
	readonly parameters: readonly SkillParameter[];
}

/** What a bound skill is given and what it hands back. */
export type SkillArgs = Record<string, string | number | boolean | undefined>;
export type SkillHandler = (args: SkillArgs) => unknown | Promise<unknown>;

const TYPES: readonly string[] = ["string", "number", "boolean"];

function frontmatter(source: string): Record<string, string> {
	const match = /^---\r?\n([\s\S]*?)\r?\n---/.exec(source);
	if (!match?.[1]) return {};

	const out: Record<string, string> = {};

	for (const line of match[1].split("\n")) {
		const at = line.indexOf(":");
		if (at < 1) continue;

		out[line.slice(0, at).trim()] = line.slice(at + 1).trim();
	}

	return out;
}

/**
 * The rows of the `## Parameters` table.
 *
 * Walked line by line rather than matched with one expression, for the same
 * reason the persona's system section is: a regular expression that means "from
 * this heading to the next one" is easy to get subtly wrong, and wrong here
 * returns a skill with no parameters - which does not throw, does not warn, and
 * produces a tool the model calls with an empty object.
 */
function parameters(source: string): SkillParameter[] {
	const lines = source.split("\n");
	const start = lines.findIndex((line) => /^##\s+Parameters\s*$/.test(line));
	if (start < 0) return [];

	const out: SkillParameter[] = [];

	for (const line of lines.slice(start + 1)) {
		if (/^##\s/.test(line)) break;
		if (!line.startsWith("|")) continue;

		const cells = line
			.split("|")
			.slice(1, -1)
			.map((cell) => cell.trim());

		if (cells.length < 4) continue;

		const [name = "", type = "", required = "", description = ""] = cells;
		if (!name || name === "Name" || /^-+$/.test(name)) continue;

		out.push({
			name,
			type: TYPES.includes(type) ? (type as SkillType) : "string",
			/*
			 * Only the exact word counts. Anything else is a build error rather
			 * than a guess - `Required: maybe` silently meaning optional is a hole
			 * somebody falls into once and never finds.
			 */
			required: required === "yes",
			description,
		});
	}

	return out;
}

export function parseSkill(source: string): Skill | null {
	const meta = frontmatter(source);
	if (!meta.name || !meta.summary) return null;

	return {
		name: meta.name,
		summary: meta.summary,
		parameters: parameters(source),
	};
}

/**
 * Every problem with a set of skills, as sentences. Empty means usable.
 *
 * Exported so the doctor can fail a push on any of it. A malformed skill does
 * not throw at build time - it becomes a tool with a missing description or a
 * parameter the model cannot fill, which fails at the one moment nobody is
 * watching: when somebody asks a question.
 */
export function skillProblems(skills: readonly Skill[]): string[] {
	const problems: string[] = [];
	const seen = new Set<string>();

	for (const skill of skills) {
		if (!/^[a-z][a-z0-9_]*$/.test(skill.name)) {
			problems.push(
				`"${skill.name}" is not snake_case - every provider's schema expects it, and a name that has to be transformed can be transformed wrongly`,
			);
		}

		if (seen.has(skill.name)) {
			problems.push(`"${skill.name}" is declared twice`);
		}
		seen.add(skill.name);

		if (skill.summary.length < 20) {
			problems.push(
				`"${skill.name}" has a summary too short to choose on - it is the sentence the model reads when deciding whether to call it`,
			);
		}

		for (const parameter of skill.parameters) {
			if (!parameter.description) {
				problems.push(
					`"${skill.name}" parameter "${parameter.name}" has no description, so the model has nothing to fill it from`,
				);
			}
		}
	}

	return problems;
}

/**
 * A skill as JSON Schema, which is what every provider actually wants.
 *
 * Kept here rather than built with a schema library, because the shape is three
 * scalar types and a required list - and a dependency that produces this from a
 * richer type system would let a skill be written that no provider accepts.
 */
export function skillSchema(skill: Skill): {
	type: "object";
	properties: Record<string, { type: SkillType; description: string }>;
	required: string[];
} {
	const properties: Record<string, { type: SkillType; description: string }> =
		{};

	for (const parameter of skill.parameters) {
		properties[parameter.name] = {
			type: parameter.type,
			description: parameter.description,
		};
	}

	return {
		type: "object",
		properties,
		required: skill.parameters
			.filter((parameter) => parameter.required)
			.map((parameter) => parameter.name),
	};
}

export interface BoundSkill {
	readonly skill: Skill;
	readonly run: SkillHandler;
}

/**
 * Skills paired with the functions that do them.
 *
 * A skill with no handler is **left out**, rather than advertised and then
 * failing when it is called. A model told it can do something and then told it
 * cannot does not stop - it apologises and tries again, usually with different
 * arguments, and burns the reply doing it.
 */
export function bindSkills(
	skills: readonly Skill[],
	handlers: Readonly<Record<string, SkillHandler>>,
): BoundSkill[] {
	return skills
		.filter((skill) => Boolean(handlers[skill.name]))
		.map((skill) => ({
			skill,
			run: handlers[skill.name] as SkillHandler,
		}));
}
