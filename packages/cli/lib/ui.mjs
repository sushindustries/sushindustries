/*
 * Terminal output, in one place.
 *
 * Colour is switched off whenever the output is not a terminal, because these
 * commands are read by people and piped by scripts, and escape codes in a log
 * file are noise nobody asked for.
 *
 * The palette is small on purpose. Six colours that each mean one thing beat
 * twenty that mean whatever was to hand: cyan is a heading, dim is context,
 * green is a fact that landed, yellow is a fact worth noticing, red is a
 * failure, and bold is the one word on a line that matters. A command whose
 * output needs a legend has stopped communicating.
 */

const plain = !process.stdout.isTTY;

const paint = (code, value) => (plain ? value : `[${code}m${value}[0m`);

export const dim = (value) => paint("2", value);
export const bold = (value) => paint("1", value);
export const green = (value) => paint("32", value);
export const yellow = (value) => paint("33", value);
export const red = (value) => paint("31", value);
export const cyan = (value) => paint("36", value);
export const magenta = (value) => paint("35", value);

export const blank = () => console.log("");

/**
 * A heading, with a rule under it.
 *
 * The rule is drawn to the width of the title rather than the terminal, so a
 * narrow window never wraps it into a second line of dashes - which looks like
 * output rather than decoration and is read as such.
 */
export function banner(title) {
	console.log(`\n${cyan(bold(title))}`);
	console.log(cyan("─".repeat(title.length)));
	console.log("");
}

export const note = (message) => console.log(`  ${dim(message)}`);
export const ok = (message) => console.log(`  ${green("✔")}  ${message}`);
export const warn = (message) => console.log(`  ${yellow("!")}  ${message}`);
export const fail = (message) => console.error(`  ${red("✘")}  ${message}`);

/** A `key   value` line, with the keys lined up and dimmed. */
export const field = (key, value) =>
	console.log(`  ${dim(key.padEnd(12))}${bold(value)}`);

/** A counted item in a list: an index, a name, and what it is. */
export const item = (index, name, about = "") =>
	console.log(
		`  ${dim(String(index).padStart(3))}  ${name}${about ? `  ${dim(about)}` : ""}`,
	);

/**
 * Progress for something that takes long enough to wonder about.
 *
 * Falls back to one line printed up front when the output is not a terminal:
 * a spinner written to a log file is a thousand carriage returns.
 */
export function spinner(label) {
	if (plain) {
		console.log(`    ${label}`);
		return {
			stop: (good, message) =>
				console.log(`  ${good ? "ok" : "--"} ${message}`),
		};
	}

	const frames = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
	let index = 0;
	const timer = setInterval(() => {
		process.stdout.write(
			`\r  ${cyan(frames[index++ % frames.length])} ${dim(label)}   `,
		);
	}, 80);

	return {
		stop(good, message) {
			clearInterval(timer);
			process.stdout.write("\r[2K");
			console.log(`  ${good ? green("✔") : yellow("–")}  ${message}`);
		},
	};
}
