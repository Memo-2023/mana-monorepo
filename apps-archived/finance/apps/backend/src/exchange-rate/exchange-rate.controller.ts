import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '@manacore/shared-nestjs-auth';
import { ExchangeRateService } from './exchange-rate.service';

@Controller('exchange-rates')
@UseGuards(JwtAuthGuard)
export class ExchangeRateController {
	constructor(private readonly exchangeRateService: ExchangeRateService) {}

	@Get()
	getAllRates(@Query('base') baseCurrency?: string) {
		return this.exchangeRateService.getAllRates(baseCurrency);
	}

	@Get('rate')
	getRate(@Query('from') fromCurrency: string, @Query('to') toCurrency: string) {
		return this.exchangeRateService.getRate(fromCurrency, toCurrency);
	}

	@Get('convert')
	convert(
		@Query('amount') amount: number,
		@Query('from') fromCurrency: string,
		@Query('to') toCurrency: string
	) {
		return this.exchangeRateService.convert(amount, fromCurrency, toCurrency);
	}

	@Post('seed')
	seedRates() {
		return this.exchangeRateService.seedRates();
	}

	@Post('fetch')
	fetchRates() {
		return this.exchangeRateService.fetchRates();
	}
}
