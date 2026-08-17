import { type ReactNode, useEffect, useRef, useState } from "react";
import { Icon, type IconName } from "./icon";

export interface CopyButtonProps {
	/** What lands on the clipboard. */
	text: string;
	/** Visible label at rest. The copied state always says "Copied". */
	label?: string;
	/**
	 * Which material the chip sits on. `slab` is the charcoal of a code block;
	 * `paper` is everywhere else. The chip is glass either way - the ground
	 * decides what the glass is made of.
	 */
	ground?: "slab" | "paper" | "accent";
	/** Leading glyph at rest. The tick still takes over while copied. */
	icon?: IconName;
}

/*
 * Copy, with the confirmation in the button itself.
 *
 * The copied state lasts two seconds and then hands back, because a button
 * frozen on "Copied" is a button that looks broken the second time. The reset
 * timer is cleared on unmount - a toast library for one word would be the
 * wrong trade, but a setState on an unmounted component is still a leak.
 *
 * `navigator.clipboard` only exists in secure contexts, so the failure mode is
 * silence rather than a crash: the button simply never confirms, which is also
 * the truthful rendering of what happened.
 */
export function CopyButton({
	text,
	label = "Copy",
	ground = "slab",
	icon = "copy",
}: CopyButtonProps): ReactNode {
	const [copied, setCopied] = useState(false);
	const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

	useEffect(() => () => clearTimeout(timer.current), []);

	function copy(): void {
		navigator.clipboard
			?.writeText(text)
			.then(() => {
				setCopied(true);
				clearTimeout(timer.current);
				timer.current = setTimeout(() => setCopied(false), 2000);
			})
			.catch(() => {
				/* Denied or unavailable: no confirmation is the honest state. */
			});
	}

	return (
		<button
			type="button"
			className="copy-btn"
			data-ground={ground === "slab" ? undefined : ground}
			data-copied={copied || undefined}
			onClick={copy}
			aria-label={copied ? "Copied" : label}
		>
			<Icon name={copied ? "check" : icon} size={12} />
			{copied ? "Copied" : label}
		</button>
	);
}
