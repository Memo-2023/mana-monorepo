/**
 * Network Condition Logger
 * Debug utility for logging and analyzing network conditions during auth operations
 */

export interface NetworkEvent {
  timestamp: number;
  type: 'request' | 'response' | 'error' | 'timeout' | 'retry';
  url: string;
  method: string;
  statusCode?: number;
  duration?: number;
  error?: string;
  retryAttempt?: number;
  networkQuality?: 'good' | 'slow' | 'poor' | 'offline';
}

export interface NetworkMetrics {
  timestamp: number;
  latency: number;
  bandwidth: number; // KB/s estimate
  packetLoss: number; // Percentage
  connectionStability: 'stable' | 'unstable' | 'very_unstable';
}

export interface ConnectionTest {
  timestamp: number;
  testType: 'ping' | 'bandwidth' | 'stability';
  result: number;
  success: boolean;
  duration: number;
}

export class NetworkConditionLogger {
  private isRunning = false;
  private events: NetworkEvent[] = [];
  private metrics: NetworkMetrics[] = [];
  private connectionTests: ConnectionTest[] = [];
  private originalFetch: typeof globalThis.fetch;
  private metricsInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.originalFetch = globalThis.fetch;
  }

  /**
   * Start network condition logging
   */
  start(): void {
    if (this.isRunning) {
      return;
    }

    console.log('🌐 NetworkConditionLogger: Starting logging...');
    this.isRunning = true;
    this.events = [];
    this.metrics = [];
    this.connectionTests = [];

    // Intercept fetch to log network events
    this.interceptFetch();

    // Collect network metrics periodically
    this.metricsInterval = setInterval(() => {
      this.collectNetworkMetrics();
    }, 5000); // Every 5 seconds
  }

  /**
   * Stop network condition logging
   */
  stop(): void {
    if (!this.isRunning) {
      return;
    }

    console.log('🌐 NetworkConditionLogger: Stopping logging...');
    this.isRunning = false;

    // Restore original fetch
    globalThis.fetch = this.originalFetch;

    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
      this.metricsInterval = null;
    }
  }

  /**
   * Intercept fetch to log network events
   */
  private interceptFetch(): void {
    const logger = this;

    globalThis.fetch = async function(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
      const url = typeof input === 'string' ? input : 
                  input instanceof URL ? input.toString() : 
                  input.url;
      
      const method = init?.method || 'GET';
      const startTime = Date.now();

      // Log request event
      logger.logEvent({
        timestamp: startTime,
        type: 'request',
        url,
        method,
        networkQuality: logger.getCurrentNetworkQuality(),
      });

      try {
        const response = await logger.originalFetch(input, init);
        const duration = Date.now() - startTime;

        // Log response event
        logger.logEvent({
          timestamp: Date.now(),
          type: 'response',
          url,
          method,
          statusCode: response.status,
          duration,
          networkQuality: logger.getCurrentNetworkQuality(),
        });

        return response;
      } catch (error) {
        const duration = Date.now() - startTime;
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';

        // Determine error type
        const isTimeout = errorMessage.toLowerCase().includes('timeout');
        const eventType = isTimeout ? 'timeout' : 'error';

        // Log error event
        logger.logEvent({
          timestamp: Date.now(),
          type: eventType,
          url,
          method,
          duration,
          error: errorMessage,
          networkQuality: logger.getCurrentNetworkQuality(),
        });

        throw error;
      }
    };
  }

  /**
   * Log a network event
   */
  logEvent(event: Omit<NetworkEvent, 'timestamp'> & { timestamp?: number }): void {
    const networkEvent: NetworkEvent = {
      timestamp: event.timestamp || Date.now(),
      ...event,
    } as NetworkEvent;

    this.events.push(networkEvent);

    // Keep only last 500 events
    if (this.events.length > 500) {
      this.events = this.events.slice(-500);
    }

    // Log to console for real-time monitoring
    const time = new Date(networkEvent.timestamp).toLocaleTimeString();
    const quality = networkEvent.networkQuality ? ` (${networkEvent.networkQuality})` : '';
    
    console.log(`🌐 ${time} - ${networkEvent.type.toUpperCase()} ${networkEvent.method} ${networkEvent.url}${quality}`);
    
    if (networkEvent.duration) {
      console.log(`   Duration: ${networkEvent.duration}ms`);
    }
    
    if (networkEvent.error) {
      console.log(`   Error: ${networkEvent.error}`);
    }
  }

  /**
   * Log retry attempt
   */
  logRetry(url: string, method: string, attempt: number): void {
    this.logEvent({
      type: 'retry',
      url,
      method,
      retryAttempt: attempt,
      networkQuality: this.getCurrentNetworkQuality(),
    });
  }

  /**
   * Collect network metrics
   */
  private async collectNetworkMetrics(): Promise<void> {
    try {
      const latency = await this.measureLatency();
      const bandwidth = await this.estimateBandwidth();
      const stability = this.assessConnectionStability();

      const metrics: NetworkMetrics = {
        timestamp: Date.now(),
        latency,
        bandwidth,
        packetLoss: 0, // Simplified - would need more complex measurement
        connectionStability: stability,
      };

      this.metrics.push(metrics);

      // Keep only last 100 metrics
      if (this.metrics.length > 100) {
        this.metrics = this.metrics.slice(-100);
      }

      console.log(`🌐 Network metrics - Latency: ${latency}ms, Bandwidth: ${bandwidth}KB/s, Stability: ${stability}`);
    } catch (error) {
      console.log('🌐 Error collecting network metrics:', error);
    }
  }

  /**
   * Measure network latency
   */
  private async measureLatency(): Promise<number> {
    const testStart = Date.now();
    
    try {
      // Use a simple connectivity test
      const testUrl = 'https://httpbin.org/status/200';
      await this.originalFetch(testUrl, { 
        method: 'HEAD',
        signal: AbortSignal.timeout(5000),
      });
      
      const latency = Date.now() - testStart;
      
      this.connectionTests.push({
        timestamp: Date.now(),
        testType: 'ping',
        result: latency,
        success: true,
        duration: latency,
      });
      
      return latency;
    } catch (error) {
      const latency = Date.now() - testStart;
      
      this.connectionTests.push({
        timestamp: Date.now(),
        testType: 'ping',
        result: latency,
        success: false,
        duration: latency,
      });
      
      return latency;
    }
  }

  /**
   * Estimate bandwidth
   */
  private async estimateBandwidth(): Promise<number> {
    const testStart = Date.now();
    
    try {
      // Download a small test payload
      const testUrl = 'https://httpbin.org/bytes/1024'; // 1KB
      const response = await this.originalFetch(testUrl, {
        signal: AbortSignal.timeout(5000),
      });
      
      await response.arrayBuffer();
      const duration = Date.now() - testStart;
      
      // Calculate KB/s (1KB / duration in seconds)
      const bandwidth = duration > 0 ? (1 / (duration / 1000)) : 0;
      
      this.connectionTests.push({
        timestamp: Date.now(),
        testType: 'bandwidth',
        result: bandwidth,
        success: true,
        duration,
      });
      
      return bandwidth;
    } catch (error) {
      const duration = Date.now() - testStart;
      
      this.connectionTests.push({
        timestamp: Date.now(),
        testType: 'bandwidth',
        result: 0,
        success: false,
        duration,
      });
      
      return 0;
    }
  }

  /**
   * Assess connection stability based on recent events
   */
  private assessConnectionStability(): 'stable' | 'unstable' | 'very_unstable' {
    const recentEvents = this.events.filter(e => 
      Date.now() - e.timestamp < 30000 // Last 30 seconds
    );

    if (recentEvents.length === 0) {
      return 'stable';
    }

    const errorCount = recentEvents.filter(e => 
      e.type === 'error' || e.type === 'timeout'
    ).length;
    
    const totalCount = recentEvents.length;
    const errorRate = errorCount / totalCount;

    if (errorRate > 0.5) {
      return 'very_unstable';
    } else if (errorRate > 0.2) {
      return 'unstable';
    } else {
      return 'stable';
    }
  }

  /**
   * Get current network quality assessment
   */
  getCurrentNetworkQuality(): 'good' | 'slow' | 'poor' | 'offline' {
    const recentMetrics = this.metrics.slice(-3); // Last 3 measurements
    
    if (recentMetrics.length === 0) {
      return 'good'; // Default assumption
    }

    const avgLatency = recentMetrics.reduce((sum, m) => sum + m.latency, 0) / recentMetrics.length;
    const avgBandwidth = recentMetrics.reduce((sum, m) => sum + m.bandwidth, 0) / recentMetrics.length;
    
    // Check for recent errors indicating offline state
    const recentErrors = this.events
      .filter(e => Date.now() - e.timestamp < 10000) // Last 10 seconds
      .filter(e => e.type === 'error' || e.type === 'timeout');

    if (recentErrors.length > 0) {
      const offlineErrors = recentErrors.filter(e => 
        e.error?.toLowerCase().includes('offline') ||
        e.error?.toLowerCase().includes('network') ||
        e.error?.toLowerCase().includes('fetch')
      );
      
      if (offlineErrors.length > 0) {
        return 'offline';
      }
    }

    // Assess quality based on latency and bandwidth
    if (avgLatency > 5000 || avgBandwidth < 0.1) {
      return 'poor';
    } else if (avgLatency > 2000 || avgBandwidth < 1) {
      return 'slow';
    } else {
      return 'good';
    }
  }

  /**
   * Get network events
   */
  getEvents(): NetworkEvent[] {
    return [...this.events];
  }

  /**
   * Get events within a time range
   */
  getEventsInRange(startTime: number, endTime: number): NetworkEvent[] {
    return this.events.filter(
      event => event.timestamp >= startTime && event.timestamp <= endTime
    );
  }

  /**
   * Get events by type
   */
  getEventsByType(type: NetworkEvent['type']): NetworkEvent[] {
    return this.events.filter(event => event.type === type);
  }

  /**
   * Get recent events
   */
  getRecentEvents(count: number = 20): NetworkEvent[] {
    return this.events.slice(-count);
  }

  /**
   * Get network metrics
   */
  getMetrics(): NetworkMetrics[] {
    return [...this.metrics];
  }

  /**
   * Get recent metrics
   */
  getRecentMetrics(count: number = 10): NetworkMetrics[] {
    return this.metrics.slice(-count);
  }

  /**
   * Get connection tests
   */
  getConnectionTests(): ConnectionTest[] {
    return [...this.connectionTests];
  }

  /**
   * Analyze network performance
   */
  analyzePerformance(): {
    eventStats: {
      total: number;
      requests: number;
      responses: number;
      errors: number;
      timeouts: number;
      retries: number;
      errorRate: number;
    };
    performanceStats: {
      averageLatency: number;
      averageBandwidth: number;
      averageResponseTime: number;
      maxResponseTime: number;
      minResponseTime: number;
    };
    stabilityStats: {
      connectionStability: 'stable' | 'unstable' | 'very_unstable';
      currentQuality: 'good' | 'slow' | 'poor' | 'offline';
      uptimePercentage: number;
    };
    patterns: {
      commonErrors: Array<{ error: string; count: number }>;
      slowEndpoints: Array<{ url: string; averageTime: number }>;
      retryPatterns: Array<{ url: string; retries: number }>;
    };
  } {
    const requests = this.getEventsByType('request').length;
    const responses = this.getEventsByType('response').length;
    const errors = this.getEventsByType('error').length;
    const timeouts = this.getEventsByType('timeout').length;
    const retries = this.getEventsByType('retry').length;
    const total = this.events.length;
    
    const errorRate = total > 0 ? ((errors + timeouts) / total) * 100 : 0;

    // Performance stats
    const responseEvents = this.getEventsByType('response');
    const responseTimes = responseEvents
      .filter(e => e.duration !== undefined)
      .map(e => e.duration!);

    const averageResponseTime = responseTimes.length > 0
      ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length
      : 0;

    const maxResponseTime = responseTimes.length > 0 ? Math.max(...responseTimes) : 0;
    const minResponseTime = responseTimes.length > 0 ? Math.min(...responseTimes) : 0;

    const latencies = this.metrics.map(m => m.latency);
    const bandwidths = this.metrics.map(m => m.bandwidth);

    const averageLatency = latencies.length > 0
      ? latencies.reduce((sum, lat) => sum + lat, 0) / latencies.length
      : 0;

    const averageBandwidth = bandwidths.length > 0
      ? bandwidths.reduce((sum, bw) => sum + bw, 0) / bandwidths.length
      : 0;

    // Stability stats
    const successfulTests = this.connectionTests.filter(t => t.success).length;
    const totalTests = this.connectionTests.length;
    const uptimePercentage = totalTests > 0 ? (successfulTests / totalTests) * 100 : 100;

    // Pattern analysis
    const errorCounts: Record<string, number> = {};
    this.events
      .filter(e => e.error)
      .forEach(e => {
        const error = e.error!;
        errorCounts[error] = (errorCounts[error] || 0) + 1;
      });

    const commonErrors = Object.entries(errorCounts)
      .map(([error, count]) => ({ error, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Slow endpoints
    const endpointTimes: Record<string, number[]> = {};
    responseEvents.forEach(e => {
      if (e.duration !== undefined) {
        if (!endpointTimes[e.url]) {
          endpointTimes[e.url] = [];
        }
        endpointTimes[e.url].push(e.duration);
      }
    });

    const slowEndpoints = Object.entries(endpointTimes)
      .map(([url, times]) => ({
        url,
        averageTime: times.reduce((sum, time) => sum + time, 0) / times.length,
      }))
      .sort((a, b) => b.averageTime - a.averageTime)
      .slice(0, 5);

    // Retry patterns
    const retryCounts: Record<string, number> = {};
    this.getEventsByType('retry').forEach(e => {
      retryCounts[e.url] = (retryCounts[e.url] || 0) + 1;
    });

    const retryPatterns = Object.entries(retryCounts)
      .map(([url, retries]) => ({ url, retries }))
      .sort((a, b) => b.retries - a.retries)
      .slice(0, 5);

    return {
      eventStats: {
        total,
        requests,
        responses,
        errors,
        timeouts,
        retries,
        errorRate,
      },
      performanceStats: {
        averageLatency,
        averageBandwidth,
        averageResponseTime,
        maxResponseTime,
        minResponseTime,
      },
      stabilityStats: {
        connectionStability: this.assessConnectionStability(),
        currentQuality: this.getCurrentNetworkQuality(),
        uptimePercentage,
      },
      patterns: {
        commonErrors,
        slowEndpoints,
        retryPatterns,
      },
    };
  }

  /**
   * Print detailed report
   */
  printReport(): void {
    console.log('\n🌐 Network Condition Logger Report');
    console.log('=====================================');

    const currentQuality = this.getCurrentNetworkQuality();
    const currentStability = this.assessConnectionStability();
    
    console.log(`\nCurrent Network Status:`);
    console.log(`  Quality: ${currentQuality}`);
    console.log(`  Stability: ${currentStability}`);

    const recentMetrics = this.getRecentMetrics(1)[0];
    if (recentMetrics) {
      console.log(`  Latest Latency: ${recentMetrics.latency}ms`);
      console.log(`  Latest Bandwidth: ${recentMetrics.bandwidth.toFixed(2)}KB/s`);
    }

    const recentEvents = this.getRecentEvents(10);
    console.log('\n📋 Recent Network Events:');
    recentEvents.forEach((event, index) => {
      const time = new Date(event.timestamp).toLocaleTimeString();
      const durationInfo = event.duration ? ` (${event.duration}ms)` : '';
      const statusInfo = event.statusCode ? ` [${event.statusCode}]` : '';
      const qualityInfo = event.networkQuality ? ` {${event.networkQuality}}` : '';
      
      console.log(`  ${index + 1}. ${time} - ${event.type.toUpperCase()} ${event.method} ${event.url}${statusInfo}${durationInfo}${qualityInfo}`);
      
      if (event.error) {
        console.log(`     Error: ${event.error}`);
      }
    });

    const analysis = this.analyzePerformance();
    console.log('\n📊 Performance Analysis:');
    console.log(`  Error Rate: ${analysis.eventStats.errorRate.toFixed(1)}%`);
    console.log(`  Uptime: ${analysis.stabilityStats.uptimePercentage.toFixed(1)}%`);
    console.log(`  Average Latency: ${Math.round(analysis.performanceStats.averageLatency)}ms`);
    console.log(`  Average Response Time: ${Math.round(analysis.performanceStats.averageResponseTime)}ms`);
    console.log(`  Max Response Time: ${Math.round(analysis.performanceStats.maxResponseTime)}ms`);
    console.log(`  Average Bandwidth: ${analysis.performanceStats.averageBandwidth.toFixed(2)}KB/s`);

    if (analysis.patterns.commonErrors.length > 0) {
      console.log('\n🚨 Common Errors:');
      analysis.patterns.commonErrors.forEach((item, index) => {
        console.log(`  ${index + 1}. ${item.error} (${item.count} times)`);
      });
    }

    if (analysis.patterns.slowEndpoints.length > 0) {
      console.log('\n🐌 Slowest Endpoints:');
      analysis.patterns.slowEndpoints.forEach((item, index) => {
        console.log(`  ${index + 1}. ${item.url} (${Math.round(item.averageTime)}ms avg)`);
      });
    }

    if (analysis.patterns.retryPatterns.length > 0) {
      console.log('\n🔄 Most Retried Endpoints:');
      analysis.patterns.retryPatterns.forEach((item, index) => {
        console.log(`  ${index + 1}. ${item.url} (${item.retries} retries)`);
      });
    }

    console.log('\n=====================================\n');
  }

  /**
   * Export network condition data
   */
  exportData(): {
    events: NetworkEvent[];
    metrics: NetworkMetrics[];
    connectionTests: ConnectionTest[];
    analysis: ReturnType<typeof this.analyzePerformance>;
    metadata: {
      exportTime: number;
      monitoringDuration: number;
      totalEvents: number;
      totalMetrics: number;
    };
  } {
    const analysis = this.analyzePerformance();
    const firstEvent = this.events[0];
    const lastEvent = this.events[this.events.length - 1];
    
    const monitoringDuration = firstEvent && lastEvent
      ? lastEvent.timestamp - firstEvent.timestamp
      : 0;

    return {
      events: this.getEvents(),
      metrics: this.getMetrics(),
      connectionTests: this.getConnectionTests(),
      analysis,
      metadata: {
        exportTime: Date.now(),
        monitoringDuration,
        totalEvents: this.events.length,
        totalMetrics: this.metrics.length,
      },
    };
  }

  /**
   * Clear all logging data
   */
  clear(): void {
    this.events = [];
    this.metrics = [];
    this.connectionTests = [];
    console.log('🌐 NetworkConditionLogger: Data cleared');
  }
}

// Export singleton instance
export const networkConditionLogger = new NetworkConditionLogger();