export function debounce<T extends (...args: any[]) => any>(
	func: T,
	wait: number,
	options?: { leading?: boolean; trailing?: boolean }
): ((...args: Parameters<T>) => void) & { cancel: () => void } {
	let timeout: NodeJS.Timeout | null = null;
	let result: any;

	const leading = options?.leading ?? false;
	const trailing = options?.trailing ?? true;

	const debounced = function (this: any, ...args: Parameters<T>) {
		const context = this;
		const later = () => {
			timeout = null;
			if (trailing) result = func.apply(context, args);
		};

		const callNow = leading && !timeout;

		if (timeout) clearTimeout(timeout);
		timeout = setTimeout(later, wait);

		if (callNow) result = func.apply(context, args);

		return result;
	};

	debounced.cancel = () => {
		if (timeout) {
			clearTimeout(timeout);
			timeout = null;
		}
	};

	return debounced;
}
