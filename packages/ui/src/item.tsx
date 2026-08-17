import type { ReactNode } from "react";
import { Icon, type IconName } from "./icon";

export interface ItemProps {
	title: string;
	/** One line under the title. */
	description?: string;
	/** Right-aligned, in the label style. */
	meta?: string;
	icon?: IconName;
	tone?: string;
	/** Renders the row as a link. */
	href?: string;
}

/*
 * One row of a list: tile, title, description, meta. The same anatomy the
 * nav panel and the palette already draw, extracted so a settings page or a
 * changelog does not rebuild it slightly differently a third time.
 */
export function Item({
	title,
	description,
	meta,
	icon,
	tone,
	href,
}: ItemProps): ReactNode {
	const body = (
		<>
			{icon ? (
				<span className="tile" data-tone={tone}>
					<Icon name={icon} size={14} />
				</span>
			) : null}
			<span className="min-w-0">
				<span className="block truncate font-semibold text-sm">{title}</span>
				{description ? (
					<span className="block truncate text-xs fg-faint">{description}</span>
				) : null}
			</span>
			{meta ? <span className="label shrink-0">{meta}</span> : null}
		</>
	);

	if (href) {
		return (
			<a className="item" href={href}>
				{body}
			</a>
		);
	}

	return <div className="item">{body}</div>;
}
