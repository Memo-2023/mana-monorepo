import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface PrometheusResult {
	metric: Record<string, string>;
	value: [number, string];
}

interface PrometheusResponse {
	status: string;
	data: {
		resultType: string;
		result: PrometheusResult[];
	};
}

@Injectable()
export class PrometheusService {
	private readonly logger = new Logger(PrometheusService.name);
	private readonly baseUrl: string;

	constructor(private configService: ConfigService) {
		this.baseUrl = this.configService.get<string>('prometheus.url') || 'http://localhost:9090';
	}

	async query(promql: string): Promise<PrometheusResult[]> {
		try {
			const url = `${this.baseUrl}/api/v1/query?query=${encodeURIComponent(promql)}`;
			const response = await fetch(url);

			if (!response.ok) {
				this.logger.error(`Prometheus query failed: ${response.status}`);
				return [];
			}

			const data = (await response.json()) as PrometheusResponse;
			if (data.status !== 'success') {
				this.logger.error(`Prometheus query error: ${data.status}`);
				return [];
			}

			return data.data.result;
		} catch (error) {
			this.logger.error(`Prometheus query error: ${error}`);
			return [];
		}
	}

	async getValue(promql: string): Promise<number | null> {
		const results = await this.query(promql);
		if (results.length === 0) return null;
		return parseFloat(results[0].value[1]);
	}

	async getValues(promql: string): Promise<Map<string, number>> {
		const results = await this.query(promql);
		const values = new Map<string, number>();
		for (const result of results) {
			const label =
				result.metric.job || result.metric.datname || result.metric.instance || 'unknown';
			values.set(label, parseFloat(result.value[1]));
		}
		return values;
	}
}
