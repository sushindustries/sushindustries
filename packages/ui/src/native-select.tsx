import type { ReactNode, SelectHTMLAttributes } from "react";
import { Icon } from "./icon";

export interface NativeSelectProps
	extends SelectHTMLAttributes<HTMLSelectElement> {}

/*
 * The platform's own select, wearing the site's clothes. On a phone this
 * opens the wheel; on desktop, the menu the OS renders - which is the entire
 * argument for it over a listbox rebuilt in divs. The chevron is drawn here
 * because `appearance: none` removes the native one along with the styling
 * it came to remove.
 */
export function NativeSelect(props: NativeSelectProps): ReactNode {
	return (
		<span className="select-wrap">
			<select {...props} className={`field-control ${props.className ?? ""}`} />
			<span className="select-chevron" aria-hidden="true">
				<Icon name="chevron" size={12} />
			</span>
		</span>
	);
}
