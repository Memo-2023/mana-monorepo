/**
 * User list mapper for number-based reference system
 *
 * Allows users to reference items by number after listing them.
 * Used by Matrix bots for commands like "!select 3" or "!delete 2".
 *
 * @example
 * ```typescript
 * const mapper = new UserListMapper<Contact>();
 *
 * // After showing a list to the user
 * mapper.setList('@user:matrix.org', contacts);
 *
 * // User says "!select 3"
 * const contact = mapper.getByNumber('@user:matrix.org', 3);
 * ```
 */
export class UserListMapper<T> {
	private lists: Map<string, T[]> = new Map();

	/**
	 * Store a list for a user
	 */
	setList(userId: string, items: T[]): void {
		this.lists.set(userId, [...items]);
	}

	/**
	 * Get an item by its 1-based number
	 *
	 * @param userId - The user ID
	 * @param number - 1-based index (as shown to user)
	 * @returns The item or null if invalid
	 */
	getByNumber(userId: string, number: number): T | null {
		const items = this.lists.get(userId);
		if (!items || number < 1 || number > items.length) {
			return null;
		}
		return items[number - 1];
	}

	/**
	 * Get the full list for a user
	 */
	getList(userId: string): T[] {
		return this.lists.get(userId) || [];
	}

	/**
	 * Check if user has a stored list
	 */
	hasList(userId: string): boolean {
		return this.lists.has(userId) && this.lists.get(userId)!.length > 0;
	}

	/**
	 * Get the count of items in user's list
	 */
	getCount(userId: string): number {
		return this.lists.get(userId)?.length || 0;
	}

	/**
	 * Clear the list for a user
	 */
	clearList(userId: string): void {
		this.lists.delete(userId);
	}

	/**
	 * Clear all lists
	 */
	clearAll(): void {
		this.lists.clear();
	}
}

/**
 * Extended list mapper that also stores IDs separately
 * Useful when items have an id field that needs quick lookup
 */
export class UserIdListMapper<T extends { id: string }> extends UserListMapper<T> {
	private idMaps: Map<string, Map<number, string>> = new Map();

	override setList(userId: string, items: T[]): void {
		super.setList(userId, items);

		// Build ID map
		const idMap = new Map<number, string>();
		items.forEach((item, index) => {
			idMap.set(index + 1, item.id);
		});
		this.idMaps.set(userId, idMap);
	}

	/**
	 * Get just the ID by number (without loading full item)
	 */
	getIdByNumber(userId: string, number: number): string | null {
		return this.idMaps.get(userId)?.get(number) || null;
	}

	override clearList(userId: string): void {
		super.clearList(userId);
		this.idMaps.delete(userId);
	}

	override clearAll(): void {
		super.clearAll();
		this.idMaps.clear();
	}
}
