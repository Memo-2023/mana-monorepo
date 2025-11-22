/**
 * Auth Flow Visualizer
 * Debug utility for visualizing authentication flow states and transitions
 */

import { tokenManager, TokenState } from '../../services/tokenManager';
import { tokenStateInspector } from './tokenStateInspector';
import { requestQueueMonitor } from './requestQueueMonitor';
import { networkConditionLogger } from './networkConditionLogger';

export interface FlowStep {
  timestamp: number;
  step: string;
  state: TokenState;
  details: string;
  duration?: number;
  success?: boolean;
  error?: string;
  context: {
    queueSize: number;
    networkQuality?: string;
    retryAttempt?: number;
  };
}

export interface FlowVisualization {
  startTime: number;
  endTime?: number;
  totalDuration?: number;
  steps: FlowStep[];
  summary: {
    successful: boolean;
    totalSteps: number;
    errors: number;
    retries: number;
    finalState: TokenState;
  };
}

export class AuthFlowVisualizer {
  private isTracking = false;
  private currentFlow: FlowVisualization | null = null;
  private flowHistory: FlowVisualization[] = [];
  private unsubscribe: (() => void) | null = null;

  /**
   * Start tracking an authentication flow
   */
  startFlow(flowName: string = 'Auth Flow'): void {
    console.log(`🎬 AuthFlowVisualizer: Starting flow tracking - ${flowName}`);
    
    // End current flow if exists
    if (this.isTracking) {
      this.endFlow();
    }

    this.isTracking = true;
    this.currentFlow = {
      startTime: Date.now(),
      steps: [],
      summary: {
        successful: false,
        totalSteps: 0,
        errors: 0,
        retries: 0,
        finalState: TokenState.IDLE,
      },
    };

    // Start monitoring components
    tokenStateInspector.start();
    requestQueueMonitor.start();
    networkConditionLogger.start();

    // Subscribe to token state changes
    this.unsubscribe = tokenManager.subscribe((state: TokenState, token?: string) => {
      this.recordStep(`Token state changed to ${state}`, state, {
        details: token ? `Token available: ${token.substring(0, 20)}...` : 'No token',
      });
    });

    // Record initial step
    this.recordStep('Flow started', tokenManager.getState(), {
      details: `Starting authentication flow: ${flowName}`,
    });
  }

  /**
   * End current flow tracking
   */
  endFlow(successful?: boolean): void {
    if (!this.isTracking || !this.currentFlow) {
      return;
    }

    console.log('🎬 AuthFlowVisualizer: Ending flow tracking');

    const endTime = Date.now();
    const finalState = tokenManager.getState();

    // Record final step
    this.recordStep('Flow ended', finalState, {
      details: `Flow completed with state: ${finalState}`,
    });

    // Complete the flow
    this.currentFlow.endTime = endTime;
    this.currentFlow.totalDuration = endTime - this.currentFlow.startTime;
    this.currentFlow.summary.finalState = finalState;
    
    if (successful !== undefined) {
      this.currentFlow.summary.successful = successful;
    } else {
      // Auto-detect success based on final state
      this.currentFlow.summary.successful = finalState === TokenState.VALID;
    }

    // Calculate summary statistics
    this.currentFlow.summary.totalSteps = this.currentFlow.steps.length;
    this.currentFlow.summary.errors = this.currentFlow.steps.filter(s => s.error).length;
    this.currentFlow.summary.retries = this.currentFlow.steps.filter(s => 
      s.context.retryAttempt && s.context.retryAttempt > 0
    ).length;

    // Store in history
    this.flowHistory.push({ ...this.currentFlow });

    // Keep only last 20 flows
    if (this.flowHistory.length > 20) {
      this.flowHistory = this.flowHistory.slice(-20);
    }

    // Clean up
    this.isTracking = false;
    this.currentFlow = null;

    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }

    // Stop monitoring components
    tokenStateInspector.stop();
    requestQueueMonitor.stop();
    networkConditionLogger.stop();
  }

  /**
   * Record a step in the current flow
   */
  recordStep(stepName: string, state: TokenState, options: {
    details?: string;
    success?: boolean;
    error?: string;
    retryAttempt?: number;
  } = {}): void {
    if (!this.isTracking || !this.currentFlow) {
      return;
    }

    const queueStatus = tokenManager.getQueueStatus();
    const networkQuality = networkConditionLogger.getCurrentNetworkQuality();

    const step: FlowStep = {
      timestamp: Date.now(),
      step: stepName,
      state,
      details: options.details || '',
      success: options.success,
      error: options.error,
      context: {
        queueSize: queueStatus.size,
        networkQuality,
        retryAttempt: options.retryAttempt,
      },
    };

    // Calculate duration from previous step
    if (this.currentFlow.steps.length > 0) {
      const previousStep = this.currentFlow.steps[this.currentFlow.steps.length - 1];
      step.duration = step.timestamp - previousStep.timestamp;
    }

    this.currentFlow.steps.push(step);

    // Log step for real-time monitoring
    const time = new Date(step.timestamp).toLocaleTimeString();
    const durationText = step.duration ? ` (+${step.duration}ms)` : '';
    const errorText = step.error ? ` ❌ ${step.error}` : '';
    const successText = step.success === true ? ' ✅' : step.success === false ? ' ❌' : '';
    
    console.log(`🎬 ${time}${durationText} - ${stepName} (${state})${successText}${errorText}`);
    
    if (step.details) {
      console.log(`   ${step.details}`);
    }
    
    if (step.context.retryAttempt) {
      console.log(`   🔄 Retry attempt #${step.context.retryAttempt}`);
    }
  }

  /**
   * Record a custom event in the flow
   */
  recordEvent(eventName: string, details?: string, success?: boolean, error?: string): void {
    const currentState = tokenManager.getState();
    this.recordStep(eventName, currentState, { details, success, error });
  }

  /**
   * Record a retry attempt
   */
  recordRetry(operation: string, attempt: number, error?: string): void {
    const currentState = tokenManager.getState();
    this.recordStep(`Retry: ${operation}`, currentState, {
      details: `Retrying ${operation} (attempt ${attempt})`,
      retryAttempt: attempt,
      error,
    });
  }

  /**
   * Get current flow
   */
  getCurrentFlow(): FlowVisualization | null {
    return this.currentFlow;
  }

  /**
   * Get flow history
   */
  getFlowHistory(): FlowVisualization[] {
    return [...this.flowHistory];
  }

  /**
   * Get recent flows
   */
  getRecentFlows(count: number = 5): FlowVisualization[] {
    return this.flowHistory.slice(-count);
  }

  /**
   * Find flows by criteria
   */
  findFlows(criteria: {
    successful?: boolean;
    finalState?: TokenState;
    minDuration?: number;
    maxDuration?: number;
    hasErrors?: boolean;
    hasRetries?: boolean;
  }): FlowVisualization[] {
    return this.flowHistory.filter(flow => {
      if (criteria.successful !== undefined && flow.summary.successful !== criteria.successful) {
        return false;
      }
      
      if (criteria.finalState !== undefined && flow.summary.finalState !== criteria.finalState) {
        return false;
      }
      
      if (criteria.minDuration !== undefined && (!flow.totalDuration || flow.totalDuration < criteria.minDuration)) {
        return false;
      }
      
      if (criteria.maxDuration !== undefined && (!flow.totalDuration || flow.totalDuration > criteria.maxDuration)) {
        return false;
      }
      
      if (criteria.hasErrors !== undefined) {
        const hasErrors = flow.summary.errors > 0;
        if (hasErrors !== criteria.hasErrors) {
          return false;
        }
      }
      
      if (criteria.hasRetries !== undefined) {
        const hasRetries = flow.summary.retries > 0;
        if (hasRetries !== criteria.hasRetries) {
          return false;
        }
      }
      
      return true;
    });
  }

  /**
   * Analyze flow patterns
   */
  analyzeFlowPatterns(): {
    successRate: number;
    averageDuration: number;
    commonFailurePoints: Array<{ step: string; count: number }>;
    stateTransitionPatterns: Array<{ from: TokenState; to: TokenState; count: number }>;
    retryPatterns: {
      totalRetries: number;
      averageRetriesPerFlow: number;
      mostRetriedOperations: Array<{ operation: string; count: number }>;
    };
    networkImpact: {
      averageDurationByQuality: Record<string, number>;
      failureRateByQuality: Record<string, number>;
    };
  } {
    const completedFlows = this.flowHistory.filter(f => f.endTime);
    
    // Success rate
    const successfulFlows = completedFlows.filter(f => f.summary.successful);
    const successRate = completedFlows.length > 0 
      ? (successfulFlows.length / completedFlows.length) * 100 
      : 0;

    // Average duration
    const durations = completedFlows
      .filter(f => f.totalDuration)
      .map(f => f.totalDuration!);
    const averageDuration = durations.length > 0
      ? durations.reduce((sum, d) => sum + d, 0) / durations.length
      : 0;

    // Common failure points
    const failureSteps: Record<string, number> = {};
    this.flowHistory.forEach(flow => {
      flow.steps.forEach(step => {
        if (step.error || step.success === false) {
          failureSteps[step.step] = (failureSteps[step.step] || 0) + 1;
        }
      });
    });

    const commonFailurePoints = Object.entries(failureSteps)
      .map(([step, count]) => ({ step, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // State transition patterns
    const transitions: Record<string, number> = {};
    this.flowHistory.forEach(flow => {
      for (let i = 1; i < flow.steps.length; i++) {
        const from = flow.steps[i - 1].state;
        const to = flow.steps[i].state;
        const key = `${from}->${to}`;
        transitions[key] = (transitions[key] || 0) + 1;
      }
    });

    const stateTransitionPatterns = Object.entries(transitions)
      .map(([transition, count]) => {
        const [from, to] = transition.split('->') as [TokenState, TokenState];
        return { from, to, count };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Retry patterns
    const totalRetries = this.flowHistory.reduce((sum, flow) => sum + flow.summary.retries, 0);
    const averageRetriesPerFlow = this.flowHistory.length > 0
      ? totalRetries / this.flowHistory.length
      : 0;

    const retryOperations: Record<string, number> = {};
    this.flowHistory.forEach(flow => {
      flow.steps.forEach(step => {
        if (step.context.retryAttempt && step.context.retryAttempt > 0) {
          retryOperations[step.step] = (retryOperations[step.step] || 0) + 1;
        }
      });
    });

    const mostRetriedOperations = Object.entries(retryOperations)
      .map(([operation, count]) => ({ operation, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Network impact analysis
    const durationsByQuality: Record<string, number[]> = {};
    const failuresByQuality: Record<string, { total: number; failures: number }> = {};

    this.flowHistory.forEach(flow => {
      flow.steps.forEach(step => {
        const quality = step.context.networkQuality || 'unknown';
        
        // Duration tracking
        if (step.duration) {
          if (!durationsByQuality[quality]) {
            durationsByQuality[quality] = [];
          }
          durationsByQuality[quality].push(step.duration);
        }
        
        // Failure tracking
        if (!failuresByQuality[quality]) {
          failuresByQuality[quality] = { total: 0, failures: 0 };
        }
        failuresByQuality[quality].total++;
        if (step.error || step.success === false) {
          failuresByQuality[quality].failures++;
        }
      });
    });

    const averageDurationByQuality: Record<string, number> = {};
    Object.entries(durationsByQuality).forEach(([quality, durations]) => {
      averageDurationByQuality[quality] = durations.reduce((sum, d) => sum + d, 0) / durations.length;
    });

    const failureRateByQuality: Record<string, number> = {};
    Object.entries(failuresByQuality).forEach(([quality, stats]) => {
      failureRateByQuality[quality] = stats.total > 0 
        ? (stats.failures / stats.total) * 100 
        : 0;
    });

    return {
      successRate,
      averageDuration,
      commonFailurePoints,
      stateTransitionPatterns,
      retryPatterns: {
        totalRetries,
        averageRetriesPerFlow,
        mostRetriedOperations,
      },
      networkImpact: {
        averageDurationByQuality,
        failureRateByQuality,
      },
    };
  }

  /**
   * Generate visual representation of a flow
   */
  visualizeFlow(flow: FlowVisualization): string {
    const lines: string[] = [];
    
    lines.push('🎬 Auth Flow Visualization');
    lines.push('=' .repeat(50));
    
    const startTime = new Date(flow.startTime).toLocaleString();
    const endTime = flow.endTime ? new Date(flow.endTime).toLocaleString() : 'Ongoing';
    const duration = flow.totalDuration ? `${Math.round(flow.totalDuration / 1000)}s` : 'N/A';
    const status = flow.summary.successful ? '✅ Success' : '❌ Failed';
    
    lines.push(`Start: ${startTime}`);
    lines.push(`End: ${endTime}`);
    lines.push(`Duration: ${duration}`);
    lines.push(`Status: ${status}`);
    lines.push(`Final State: ${flow.summary.finalState}`);
    lines.push('');

    // Flow steps
    lines.push('📋 Flow Steps:');
    flow.steps.forEach((step, index) => {
      const time = new Date(step.timestamp).toLocaleTimeString();
      const duration = step.duration ? `+${step.duration}ms` : '';
      const status = step.success === true ? '✅' : step.success === false ? '❌' : '⏳';
      const retry = step.context.retryAttempt ? `🔄${step.context.retryAttempt}` : '';
      const network = step.context.networkQuality ? `📶${step.context.networkQuality}` : '';
      
      lines.push(`  ${index + 1}. ${time} ${duration} ${status} ${retry} ${network}`);
      lines.push(`     ${step.step} (${step.state})`);
      
      if (step.details) {
        lines.push(`     ${step.details}`);
      }
      
      if (step.error) {
        lines.push(`     ❌ ${step.error}`);
      }
      
      if (step.context.queueSize > 0) {
        lines.push(`     📊 Queue size: ${step.context.queueSize}`);
      }
      
      lines.push('');
    });

    // Summary
    lines.push('📊 Summary:');
    lines.push(`  Total Steps: ${flow.summary.totalSteps}`);
    lines.push(`  Errors: ${flow.summary.errors}`);
    lines.push(`  Retries: ${flow.summary.retries}`);
    lines.push(`  Success Rate: ${flow.summary.successful ? '100%' : '0%'}`);

    return lines.join('\n');
  }

  /**
   * Print flow visualization
   */
  printFlow(flow?: FlowVisualization): void {
    const targetFlow = flow || this.currentFlow;
    
    if (!targetFlow) {
      console.log('🎬 AuthFlowVisualizer: No flow to visualize');
      return;
    }

    console.log(this.visualizeFlow(targetFlow));
  }

  /**
   * Print analysis report
   */
  printAnalysis(): void {
    const analysis = this.analyzeFlowPatterns();
    
    console.log('\n🎬 Auth Flow Analysis Report');
    console.log('=====================================');
    
    console.log(`\n📊 Overall Statistics:`);
    console.log(`  Total Flows: ${this.flowHistory.length}`);
    console.log(`  Success Rate: ${analysis.successRate.toFixed(1)}%`);
    console.log(`  Average Duration: ${Math.round(analysis.averageDuration)}ms`);
    console.log(`  Total Retries: ${analysis.retryPatterns.totalRetries}`);
    console.log(`  Average Retries per Flow: ${analysis.retryPatterns.averageRetriesPerFlow.toFixed(1)}`);

    if (analysis.commonFailurePoints.length > 0) {
      console.log(`\n🚨 Common Failure Points:`);
      analysis.commonFailurePoints.forEach((item, index) => {
        console.log(`  ${index + 1}. ${item.step} (${item.count} times)`);
      });
    }

    console.log(`\n🔄 State Transitions:`);
    analysis.stateTransitionPatterns.slice(0, 5).forEach((item, index) => {
      console.log(`  ${index + 1}. ${item.from} → ${item.to} (${item.count} times)`);
    });

    if (analysis.retryPatterns.mostRetriedOperations.length > 0) {
      console.log(`\n🔁 Most Retried Operations:`);
      analysis.retryPatterns.mostRetriedOperations.forEach((item, index) => {
        console.log(`  ${index + 1}. ${item.operation} (${item.count} retries)`);
      });
    }

    console.log(`\n📶 Network Quality Impact:`);
    Object.entries(analysis.networkImpact.averageDurationByQuality).forEach(([quality, duration]) => {
      const failureRate = analysis.networkImpact.failureRateByQuality[quality] || 0;
      console.log(`  ${quality}: ${Math.round(duration)}ms avg, ${failureRate.toFixed(1)}% failure rate`);
    });

    console.log('\n=====================================\n');
  }

  /**
   * Export flow data
   */
  exportData(): {
    currentFlow: FlowVisualization | null;
    flowHistory: FlowVisualization[];
    analysis: ReturnType<typeof this.analyzeFlowPatterns>;
    metadata: {
      exportTime: number;
      totalFlows: number;
      isTracking: boolean;
    };
  } {
    return {
      currentFlow: this.currentFlow,
      flowHistory: this.getFlowHistory(),
      analysis: this.analyzeFlowPatterns(),
      metadata: {
        exportTime: Date.now(),
        totalFlows: this.flowHistory.length,
        isTracking: this.isTracking,
      },
    };
  }

  /**
   * Clear flow history
   */
  clear(): void {
    this.flowHistory = [];
    console.log('🎬 AuthFlowVisualizer: Flow history cleared');
  }

  /**
   * Check if currently tracking
   */
  isCurrentlyTracking(): boolean {
    return this.isTracking;
  }
}

// Export singleton instance
export const authFlowVisualizer = new AuthFlowVisualizer();