import type { ReactNode } from "react";
import { Icon, type IconName } from "./icon.tsx";

export interface EmptyProps {
	/** What there is none of, stated plainly. */
	title: string;
	/** The way out: why it is empty, or what to do about it. */
	children?: ReactNode;
	/** The glyph above the title. Always drawn - a bare empty state reads as a failed render. */
	icon?: IconName;
	/** Usually a Button. */
	action?: ReactNode;
}

/*
 * Nothing, said properly. An empty state is the one screen where the
 * interface has the reader's full attention, so it says what is missing,
 * why that is fine, and what to do next - in that order, and quietly.
 */
export function Empty({
	title,
	children,
	icon = "folder-open",
	action,
}: EmptyProps): ReactNode {
	return (
		<div className="empty">
			<span className="empty-icon">
				<Icon name={icon} size={22} />
			</span>
			<p className="m-0 font-semibold">{title}</p>
			{children ? (
				<div className="text-sm fg-dim text-pretty">{children}</div>
			) : null}
			{action ? <div className="mt-2">{action}</div> : null}
		</div>
	);
}
