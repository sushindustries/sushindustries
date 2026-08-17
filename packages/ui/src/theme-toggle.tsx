import { type ReactNode, useCallback } from "react";
import { Icon, type IconName } from "./icon";

export interface ThemeOption {
	readonly id: string;
	readonly label: string;
	readonly icon: IconName;
}

export interface ThemeToggleProps {
	/** The segments, left to right. Arrows walk them and wrap at both ends. */
	readonly options: readonly ThemeOption[];
	/** The id of the pressed segment. One matching no option leaves the group with no tab stop. */
	readonly value: string;
	/**
	 * Called with the chosen id.
	 *
	 * Persisting it is the host's problem, and deliberately so: a cookie, a
	 * server function, an account setting and a `localStorage` key are four
	 * different answers with four different trade-offs, and a component that
	 * picked one would be wrong in three codebases out of four.
	 */
	onChange(id: string): void;
	/** Names the group for screen readers. The segments are icons, so nothing else says what it switches. */
	readonly label?: string;
}

/*
 * A theme switcher, and nothing about themes.
 *
 * It renders a row of choices and reports which was pressed. It does not know
 * what light or dark mean, does not touch the document, and does not store
 * anything - which is what lets the same control switch a density, a language
 * or a layout without being told it is doing something different.
 *
 * **The attribute must already be on `<html>` before this mounts.** A toggle
 * that applies the theme in an effect is a toggle that guarantees a flash: the
 * server paints one theme, the effect corrects it, and everybody sees both.
 * The host writes `data-theme` during the server render from a cookie, and this
 * only changes it afterwards.
 *
 * `radiogroup` rather than a switch, because there are three states here and a
 * switch is a lie about two of them. Arrow keys move between radios for free,
 * which is the behaviour a group of related choices should have and the one a
 * row of buttons has to be given by hand.
 */
export function ThemeToggle({
	options,
	value,
	onChange,
	label = "Theme",
}: ThemeToggleProps): ReactNode {
	/*
	 * Roving focus, in one handler.
	 *
	 * A radiogroup is one tab stop, and the arrows move within it - so exactly
	 * one option is focusable at a time and the others are `tabIndex={-1}`.
	 * Without this a three-option switcher costs three tabs to walk past, which
	 * is three tabs spent on a decoration.
	 */
	const onKeyDown = useCallback(
		(event: React.KeyboardEvent<HTMLDivElement>) => {
			const step =
				event.key === "ArrowRight" || event.key === "ArrowDown"
					? 1
					: event.key === "ArrowLeft" || event.key === "ArrowUp"
						? -1
						: 0;

			if (step === 0) return;

			event.preventDefault();

			const at = options.findIndex((option) => option.id === value);
			// Wraps, because a row that stops at the end makes the reader guess
			// whether they have reached it or whether the key is not working.
			const next = options[(at + step + options.length) % options.length];
			if (next) onChange(next.id);
		},
		[options, value, onChange],
	);

	return (
		<div
			className="theme-toggle"
			role="radiogroup"
			aria-label={label}
			onKeyDown={onKeyDown}
		>
			{options.map((option) => {
				const active = option.id === value;

				return (
					// biome-ignore lint/a11y/useSemanticElements: segmented control
					<button
						key={option.id}
						type="button"
						className="theme-toggle-option"
						/*
						 * A button with `role="radio"`, not an `<input type="radio">`.
						 *
						 * The input is the semantic form and it arrives with a
						 * browser-drawn dot, a label association and a focus ring that
						 * would all have to be undone to draw a segmented control. A
						 * button carrying the role is the pattern assistive technology
						 * expects here and the one the ARIA authoring guide shows.
						 *
						 * The suppression below has to be one line: a multi-line `//`
						 * reason detaches it from what it is suppressing, and biome then
						 * reports the rule *and* an unused suppression.
						 */
						role="radio"
						aria-checked={active}
						aria-label={option.label}
						title={option.label}
						tabIndex={active ? 0 : -1}
						onClick={() => onChange(option.id)}
					>
						<Icon name={option.icon} size={15} />
					</button>
				);
			})}
		</div>
	);
}
