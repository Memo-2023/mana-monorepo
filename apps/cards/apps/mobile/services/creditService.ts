import { get } from '../utils/apiClient';
import type { CreditBalance } from '../types/credits';

const BASE_API_URL =
	process.env.EXPO_PUBLIC_API_URL || 'https://cards-backend-111768794939.europe-west3.run.app';

/**
 * Credit Service
 * Handles all credit-related API operations
 */
export const creditService = {
	/**
	 * Get user's current credit balance
	 */
	async getBalance(): Promise<number> {
		try {
			const response = await get<CreditBalance>(`${BASE_API_URL}/v1/api/credits/balance`);
			return response.balance || 0;
		} catch (error) {
			console.error('Error fetching credit balance:', error);
			throw error;
		}
	},

	/**
	 * Get user profile including credit balance
	 */
	async getProfile(): Promise<{ user: any; credits: number }> {
		try {
			const response = await get<{ user: any; credits: number }>(`${BASE_API_URL}/v1/api/profile`);
			return response;
		} catch (error) {
			console.error('Error fetching profile:', error);
			throw error;
		}
	},
};

export default creditService;
