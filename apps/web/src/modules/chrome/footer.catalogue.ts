import type { IconName } from "@sushindustries/ui";
import source from "../../../content/footer.md?raw";

/*
 * The footer, read from `content/footer.md` - the same parser and the same
 * contract as `nav.md`: one line is one item, indentation is nesting, and the
 * doctor rejects a glyph that is not in the table.
 */
export interface FooterLink {
	readonly label: string;
	readonly href: string;
	readonly icon?: IconName;
}

export interface FooterColumn {
	readonly label: string;
	readonly links: readonly FooterLink[];
}

const LINE =
	/^(\s*)-\s+\[([^\]]+)\]\(([^)]+)\)(?:\s+`([^`]+)`)?(?:\s+-\s+(.+))?\s*$/;

function footerSection(): string {
	const at = source.indexOf("## The footer");
	return at === -1 ? "" : source.slice(at);
}

export function footerColumns(): readonly FooterColumn[] {
	const columns: Array<{ label: string; links: FooterLink[] }> = [];

	for (const line of footerSection().split("\n")) {
		const match = LINE.exec(line);
		if (!match) continue;

		const [, indent = "", label = "", href = "", icon] = match;

		if (indent.length === 0) {
			columns.push({ label, links: [] });
			continue;
		}

		columns
			.at(-1)
			?.links.push({ label, href, icon: icon as IconName | undefined });
	}

	return columns;
}
