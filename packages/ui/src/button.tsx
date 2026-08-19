import type { MouseEventHandler, ReactNode } from "react";

export interface ButtonProps {
	children: ReactNode;
	/** Renders an anchor instead. A button that navigates is a link. */
	href?: string;
	/** Dropped when `href` is set - the anchor navigates instead. */
	onClick?: MouseEventHandler<HTMLButtonElement>;
	/** `pill` is the one action a section wants taken; `ghost` the alternative. */
	variant?: "pill" | "ghost";
	/** `submit` is the only reason a button in a form should be anything else. */
	type?: "button" | "submit";
	/** Reaches the button only. An `href` cannot be disabled - do not render it. */
	disabled?: boolean;
}

/*
 * Two buttons, one hierarchy, and the discipline is the point: there is no
 * third variant, because a row of three button styles is a menu wearing
 * costumes. `href` switches the element, not the look - the reader cannot
 * tell a link-shaped action from a button-shaped one, and should not have to.
 */
export function Button({
	children,
	href,
	onClick,
	variant = "pill",
	type = "button",
	disabled,
}: ButtonProps): ReactNode {
	const className = variant === "ghost" ? "btn btn-ghost" : "btn";

	if (href) {
		return (
			<a className={className} href={href}>
				{children}
			</a>
		);
	}

	return (
		<button
			type={type}
			className={className}
			onClick={onClick}
			disabled={disabled}
		>
			{children}
		</button>
	);
}
