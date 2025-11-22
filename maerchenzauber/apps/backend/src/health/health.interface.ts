export interface ServiceStatus {
  name: string;
  status: 'healthy' | 'unhealthy' | 'degraded';
  responseTime: number;
  error?: string;
  metadata?: Record<string, any>;
}

export interface HealthCheckResult {
  status: 'healthy' | 'unhealthy' | 'degraded' | 'not_ready';
  timestamp: string;
  duration: number;
  services: ServiceStatus[];
  version: string;
  environment: string;
}
