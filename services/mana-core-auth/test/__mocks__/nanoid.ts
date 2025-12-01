/**
 * Mock implementation of nanoid for tests
 */

let counter = 0;

export const nanoid = (size?: number): string => {
	counter++;
	const id = `test-id-${counter}`;
	if (size && size < id.length) {
		return id.substring(0, size);
	}
	return id;
};

export const customAlphabet = (alphabet: string, size: number) => {
	return () => nanoid(size);
};
