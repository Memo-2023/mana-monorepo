import { pgTable, uuid, varchar, decimal, date, index } from 'drizzle-orm/pg-core';

export const exchangeRates = pgTable(
	'exchange_rates',
	{
		id: uuid('id').primaryKey().defaultRandom(),

		// Currency pair
		fromCurrency: varchar('from_currency', { length: 3 }).notNull(),
		toCurrency: varchar('to_currency', { length: 3 }).notNull(),

		// Rate
		rate: decimal('rate', { precision: 15, scale: 6 }).notNull(),

		// Date
		date: date('date').notNull(),
	},
	(table) => ({
		currencyPairIdx: index('exchange_rates_currency_pair_idx').on(
			table.fromCurrency,
			table.toCurrency
		),
		dateIdx: index('exchange_rates_date_idx').on(table.date),
	})
);

export type ExchangeRate = typeof exchangeRates.$inferSelect;
export type NewExchangeRate = typeof exchangeRates.$inferInsert;
