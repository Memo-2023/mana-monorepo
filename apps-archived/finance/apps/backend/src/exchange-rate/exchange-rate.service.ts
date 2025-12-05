import { Injectable, Inject } from '@nestjs/common';
import { eq, and, desc } from 'drizzle-orm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { DATABASE_CONNECTION, type Database } from '../db/connection';
import { exchangeRates } from '../db/schema';

// Common currencies
const SUPPORTED_CURRENCIES = [
	'EUR',
	'USD',
	'GBP',
	'CHF',
	'JPY',
	'CAD',
	'AUD',
	'CNY',
	'INR',
	'BRL',
	'MXN',
	'PLN',
	'SEK',
];

@Injectable()
export class ExchangeRateService {
	constructor(@Inject(DATABASE_CONNECTION) private db: Database) {}

	async getRate(fromCurrency: string, toCurrency: string): Promise<number> {
		if (fromCurrency === toCurrency) {
			return 1;
		}

		// Try direct rate
		const [directRate] = await this.db
			.select()
			.from(exchangeRates)
			.where(
				and(eq(exchangeRates.fromCurrency, fromCurrency), eq(exchangeRates.toCurrency, toCurrency))
			)
			.orderBy(desc(exchangeRates.date))
			.limit(1);

		if (directRate) {
			return parseFloat(directRate.rate);
		}

		// Try inverse rate
		const [inverseRate] = await this.db
			.select()
			.from(exchangeRates)
			.where(
				and(eq(exchangeRates.fromCurrency, toCurrency), eq(exchangeRates.toCurrency, fromCurrency))
			)
			.orderBy(desc(exchangeRates.date))
			.limit(1);

		if (inverseRate) {
			return 1 / parseFloat(inverseRate.rate);
		}

		// Try through EUR as base
		const [toEur] = await this.db
			.select()
			.from(exchangeRates)
			.where(and(eq(exchangeRates.fromCurrency, fromCurrency), eq(exchangeRates.toCurrency, 'EUR')))
			.orderBy(desc(exchangeRates.date))
			.limit(1);

		const [fromEur] = await this.db
			.select()
			.from(exchangeRates)
			.where(and(eq(exchangeRates.fromCurrency, 'EUR'), eq(exchangeRates.toCurrency, toCurrency)))
			.orderBy(desc(exchangeRates.date))
			.limit(1);

		if (toEur && fromEur) {
			return parseFloat(toEur.rate) * parseFloat(fromEur.rate);
		}

		// Default fallback
		return 1;
	}

	async convert(amount: number, fromCurrency: string, toCurrency: string): Promise<number> {
		const rate = await this.getRate(fromCurrency, toCurrency);
		return amount * rate;
	}

	async getAllRates(baseCurrency = 'EUR') {
		const rates = await this.db
			.select()
			.from(exchangeRates)
			.where(eq(exchangeRates.fromCurrency, baseCurrency))
			.orderBy(desc(exchangeRates.date));

		// Get latest rate for each currency pair
		const latestRates = new Map<string, (typeof rates)[0]>();
		rates.forEach((rate) => {
			if (!latestRates.has(rate.toCurrency)) {
				latestRates.set(rate.toCurrency, rate);
			}
		});

		return Array.from(latestRates.values()).map((r) => ({
			fromCurrency: r.fromCurrency,
			toCurrency: r.toCurrency,
			rate: parseFloat(r.rate),
			date: r.date,
		}));
	}

	async setRate(fromCurrency: string, toCurrency: string, rate: number) {
		const today = new Date().toISOString().split('T')[0];

		// Upsert rate
		const [existing] = await this.db
			.select()
			.from(exchangeRates)
			.where(
				and(
					eq(exchangeRates.fromCurrency, fromCurrency),
					eq(exchangeRates.toCurrency, toCurrency),
					eq(exchangeRates.date, today)
				)
			);

		if (existing) {
			const [updated] = await this.db
				.update(exchangeRates)
				.set({ rate: rate.toString() })
				.where(eq(exchangeRates.id, existing.id))
				.returning();
			return updated;
		}

		const [created] = await this.db
			.insert(exchangeRates)
			.values({
				fromCurrency,
				toCurrency,
				rate: rate.toString(),
				date: today,
			})
			.returning();

		return created;
	}

	// Fetch rates from ECB (free, no API key required)
	@Cron(CronExpression.EVERY_DAY_AT_6AM)
	async fetchRates() {
		try {
			const response = await fetch('https://api.frankfurter.app/latest?from=EUR');
			const data = await response.json();

			if (data.rates) {
				const today = data.date;
				const rates = Object.entries(data.rates) as [string, number][];

				for (const [currency, rate] of rates) {
					await this.db
						.insert(exchangeRates)
						.values({
							fromCurrency: 'EUR',
							toCurrency: currency,
							rate: rate.toString(),
							date: today,
						})
						.onConflictDoNothing();
				}

				console.log(`Fetched ${rates.length} exchange rates for ${today}`);
			}
		} catch (error) {
			console.error('Failed to fetch exchange rates:', error);
		}
	}

	async seedRates() {
		// Seed some default rates if none exist
		const existing = await this.db.select().from(exchangeRates).limit(1);

		if (existing.length > 0) {
			return { message: 'Rates already exist', seeded: false };
		}

		await this.fetchRates();
		return { message: 'Rates seeded', seeded: true };
	}
}
