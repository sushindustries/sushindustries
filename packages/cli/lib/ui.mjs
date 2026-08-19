/*
 * Terminal output, in one place.
 *
 * Colour is switched off whenever the output is not a terminal, because these
 * commands are read by people and piped by scripts, and escape codes in a log
 * file are noise nobody asked for.
 */

const plain = !process.stdout.isTTY;

const paint = (code, value) => (plain ? value : `[${code}m${value}[0m`);

export const dim = (value) => paint("2", value);
export const bold = (value) => paint("1", value);
export const green = (value) => paint("32", value);
export const yellow = (value) => paint("33", value);
export const red = (value) => paint("31", value);

export const blank = () => console.log("");
export const banner = (title) => console.log(`\n${bold(title)}\n`);
export const note = (message) => console.log(`  ${dim(message)}`);
export const ok = (message) => console.log(`${green("ok")}  ${message}`);
export const warn = (message) => console.log(`${yellow("!")}   ${message}`);
export const fail = (message) => console.error(`${red("x")}   ${message}`);

/** A `key   value` line, with the keys lined up. */
export const field = (key, value) =>
	console.log(`  ${dim(key.padEnd(12))}${value}`);

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

	const frames = ["|", "/", "-", "\\"];
	let index = 0;
	const timer = setInterval(() => {
		process.stdout.write(`\r  ${frames[index++ % frames.length]} ${label}   `);
	}, 90);

	return {
		stop(good, message) {
			clearInterval(timer);
			process.stdout.write("\r[2K");
			console.log(`  ${good ? green("ok") : yellow("--")} ${message}`);
		},
	};
}
