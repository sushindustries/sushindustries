import {
	createContext,
	type ReactNode,
	useCallback,
	useContext,
	useMemo,
	useRef,
	useState,
} from "react";

interface ToastEntry {
	readonly id: number;
	readonly message: string;
}

interface ToastApi {
	readonly toast: (message: string) => void;
}

const ToastContext = createContext<ToastApi | undefined>(undefined);

/** The one hook. Call it anywhere under the provider; strings only. */
export function useToast(): ToastApi {
	const api = useContext(ToastContext);
	if (!api) {
		throw new Error("useToast needs a <ToastProvider> above it.");
	}
	return api;
}

export interface ToastProviderProps {
	children: ReactNode;
	/** How long a toast stays, in ms. */
	duration?: number;
}

/*
 * Toasts, kept deliberately small: strings, four seconds, bottom corner.
 * The region is `role="status"` so arrivals are announced politely, and the
 * whole system is one provider and one hook - actions, promises and progress
 * belong to the page that owns them, not to a notification.
 */
export function ToastProvider({
	children,
	duration = 4000,
}: ToastProviderProps): ReactNode {
	const [entries, setEntries] = useState<readonly ToastEntry[]>([]);
	const nextId = useRef(0);

	const toast = useCallback(
		(message: string) => {
			const id = nextId.current++;
			setEntries((current) => [...current, { id, message }]);
			setTimeout(() => {
				setEntries((current) => current.filter((entry) => entry.id !== id));
			}, duration);
		},
		[duration],
	);

	const api = useMemo(() => ({ toast }), [toast]);

	return (
		<ToastContext.Provider value={api}>
			{children}
			<div className="toasts" role="status">
				{entries.map((entry) => (
					<div key={entry.id} className="toast">
						{entry.message}
					</div>
				))}
			</div>
		</ToastContext.Provider>
	);
}
