import { Module } from '@nestjs/common';
import { PrometheusModule } from '../prometheus/prometheus.module';
import { InfrastructureService } from './infrastructure.service';

@Module({
	imports: [PrometheusModule],
	providers: [InfrastructureService],
	exports: [InfrastructureService],
})
export class InfrastructureModule {}
