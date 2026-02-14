import { Injectable, Logger } from '@nestjs/common';
import { PrometheusService } from '../prometheus/prometheus.service';

@Injectable()
export class InfrastructureService {
	private readonly logger = new Logger(InfrastructureService.name);

	constructor(private readonly prometheus: PrometheusService) {}

	async generateSystemReport(): Promise<string> {
		const [cpu, memory, disk, uptime, load] = await Promise.all([
			this.prometheus.getValue('100 - (avg(rate(node_cpu_seconds_total{mode="idle"}[5m])) * 100)'),
			this.prometheus.getValue(
				'100 * (1 - ((node_memory_free_bytes + node_memory_cached_bytes + node_memory_buffers_bytes) / node_memory_total_bytes))'
			),
			this.prometheus.getValue(
				'100 - ((node_filesystem_avail_bytes{mountpoint="/",fstype!="rootfs"} / node_filesystem_size_bytes{mountpoint="/",fstype!="rootfs"}) * 100)'
			),
			this.prometheus.getValue('time() - node_boot_time_seconds'),
			this.prometheus.getValue('node_load1'),
		]);

		if (cpu === null && memory === null) {
			return '❌ Keine System-Metriken verfügbar. Node Exporter nicht erreichbar.';
		}

		const formatUptime = (seconds: number): string => {
			const days = Math.floor(seconds / 86400);
			const hours = Math.floor((seconds % 86400) / 3600);
			const mins = Math.floor((seconds % 3600) / 60);
			if (days > 0) return `${days}d ${hours}h`;
			if (hours > 0) return `${hours}h ${mins}m`;
			return `${mins}m`;
		};

		const getStatusIcon = (value: number, warn: number, crit: number): string => {
			if (value >= crit) return '🔴';
			if (value >= warn) return '🟡';
			return '🟢';
		};

		let report = '**🖥️ Mac Mini System Status**\n\n';
		report += `${getStatusIcon(cpu || 0, 70, 85)} **CPU:** ${cpu?.toFixed(1) || '?'}%\n`;
		report += `${getStatusIcon(memory || 0, 70, 85)} **Memory:** ${memory?.toFixed(1) || '?'}%\n`;
		report += `${getStatusIcon(disk || 0, 70, 85)} **Disk:** ${disk?.toFixed(1) || '?'}%\n`;
		report += `⏱️ **Uptime:** ${uptime ? formatUptime(uptime) : '?'}\n`;
		report += `📊 **Load (1m):** ${load?.toFixed(2) || '?'}`;

		return report;
	}

	async generateServicesReport(): Promise<string> {
		const services = [
			{ job: 'mana-core-auth', name: 'Auth' },
			{ job: 'chat-backend', name: 'Chat' },
			{ job: 'todo-backend', name: 'Todo' },
			{ job: 'calendar-backend', name: 'Calendar' },
			{ job: 'clock-backend', name: 'Clock' },
			{ job: 'contacts-backend', name: 'Contacts' },
			{ job: 'zitare-backend', name: 'Zitare' },
			{ job: 'picture-backend', name: 'Picture' },
		];

		const results = await this.prometheus.query('up');
		const statusMap = new Map<string, number>();
		for (const result of results) {
			statusMap.set(result.metric.job, parseFloat(result.value[1]));
		}

		// Also check infrastructure
		const pgUp = await this.prometheus.getValue('pg_up');
		const redisUp = await this.prometheus.getValue('redis_up');

		let report = '**🔧 Service Status**\n\n';
		let allUp = true;

		for (const service of services) {
			const status = statusMap.get(service.job);
			if (status === 1) {
				report += `🟢 ${service.name}\n`;
			} else if (status === 0) {
				report += `🔴 ${service.name}\n`;
				allUp = false;
			} else {
				report += `⚪ ${service.name} (nicht konfiguriert)\n`;
			}
		}

		report += '\n**Infrastruktur:**\n';
		report += pgUp === 1 ? '🟢 PostgreSQL\n' : '🔴 PostgreSQL\n';
		report += redisUp === 1 ? '🟢 Redis' : '🔴 Redis';

		if (allUp && pgUp === 1 && redisUp === 1) {
			report =
				'**🔧 Service Status**\n\n✅ Alle Services online!\n\n' +
				report.split('\n\n').slice(1).join('\n\n');
		}

		return report;
	}

	async generateTrafficReport(): Promise<string> {
		const [requestRates, errorRates, p95Latency] = await Promise.all([
			this.prometheus.query('sum(rate(http_requests_total[5m])) by (job)'),
			this.prometheus.query('sum(rate(http_requests_total{status=~"5.."}[5m])) by (job)'),
			this.prometheus.query(
				'histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[5m])) by (le, job))'
			),
		]);

		if (requestRates.length === 0) {
			return '❌ Keine Traffic-Metriken verfügbar.';
		}

		const rateMap = new Map<string, number>();
		const errorMap = new Map<string, number>();
		const latencyMap = new Map<string, number>();

		for (const r of requestRates) {
			rateMap.set(r.metric.job, parseFloat(r.value[1]));
		}
		for (const r of errorRates) {
			errorMap.set(r.metric.job, parseFloat(r.value[1]));
		}
		for (const r of p95Latency) {
			latencyMap.set(r.metric.job, parseFloat(r.value[1]));
		}

		const totalRate = Array.from(rateMap.values()).reduce((a, b) => a + b, 0);
		const totalErrors = Array.from(errorMap.values()).reduce((a, b) => a + b, 0);

		let report = '**📈 HTTP Traffic**\n\n';
		report += `**Gesamt:** ${totalRate.toFixed(2)} req/s\n`;
		report += `**5xx Errors:** ${totalErrors.toFixed(3)} req/s\n\n`;

		const serviceNames: Record<string, string> = {
			'mana-core-auth': 'Auth',
			'chat-backend': 'Chat',
			'todo-backend': 'Todo',
			'calendar-backend': 'Calendar',
			'clock-backend': 'Clock',
			'contacts-backend': 'Contacts',
		};

		for (const [job, rate] of rateMap.entries()) {
			if (rate < 0.001) continue;
			const name = serviceNames[job] || job;
			const latency = latencyMap.get(job);
			const latencyStr = latency ? `${(latency * 1000).toFixed(0)}ms` : '?';
			report += `**${name}:** ${rate.toFixed(2)} req/s (p95: ${latencyStr})\n`;
		}

		return report;
	}

	async generateDatabaseReport(): Promise<string> {
		const [pgConnections, dbSizes, redisMemory, redisClients] = await Promise.all([
			this.prometheus.getValue('sum(pg_stat_activity_count)'),
			this.prometheus.query('pg_database_size_bytes{datname!~"template.*|postgres"}'),
			this.prometheus.getValue('redis_memory_used_bytes'),
			this.prometheus.getValue('redis_connected_clients'),
		]);

		if (pgConnections === null && redisMemory === null) {
			return '❌ Keine Datenbank-Metriken verfügbar.';
		}

		const formatBytes = (bytes: number): string => {
			if (bytes >= 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
			if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
			if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB`;
			return `${bytes} B`;
		};

		let report = '**🗄️ Datenbank Status**\n\n';
		report += '**PostgreSQL:**\n';
		report += `- Connections: ${pgConnections || '?'}\n`;

		if (dbSizes.length > 0) {
			const sortedDbs = dbSizes
				.map((r) => ({ name: r.metric.datname, size: parseFloat(r.value[1]) }))
				.sort((a, b) => b.size - a.size)
				.slice(0, 5);

			for (const db of sortedDbs) {
				report += `- ${db.name}: ${formatBytes(db.size)}\n`;
			}
		}

		report += '\n**Redis:**\n';
		report += `- Memory: ${redisMemory ? formatBytes(redisMemory) : '?'}\n`;
		report += `- Clients: ${redisClients || '?'}`;

		return report;
	}

	async generateGrowthReport(): Promise<string> {
		const [total, verified, today, week, month] = await Promise.all([
			this.prometheus.getValue('auth_users_total'),
			this.prometheus.getValue('auth_users_verified'),
			this.prometheus.getValue('auth_users_created_today'),
			this.prometheus.getValue('auth_users_created_this_week'),
			this.prometheus.getValue('auth_users_created_this_month'),
		]);

		if (total === null) {
			return '❌ Keine User-Metriken verfügbar. Auth Service nicht erreichbar.';
		}

		const verificationRate = total && verified ? ((verified / total) * 100).toFixed(1) : '?';

		let report = '**📈 User Growth**\n\n';
		report += `**Gesamt:** ${total?.toLocaleString() || '?'} User\n`;
		report += `**Verifiziert:** ${verified?.toLocaleString() || '?'} (${verificationRate}%)\n\n`;
		report += '**Neue Registrierungen:**\n';
		report += `- Heute: ${today || 0}\n`;
		report += `- Diese Woche: ${week || 0}\n`;
		report += `- Dieser Monat: ${month || 0}`;

		return report;
	}
}
