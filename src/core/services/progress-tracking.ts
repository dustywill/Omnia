/**
 * ProgressTrackingService - Unified progress tracking and reporting
 * 
 * This service provides a centralized way to track and report progress
 * across all plugins and operations, eliminating duplication and providing
 * consistent progress reporting throughout the application.
 * 
 * Features:
 * - Event-driven progress updates
 * - Phase-based progress tracking
 * - Cancellation support
 * - UI integration hooks
 * - Hierarchical progress (sub-tasks)
 * - Progress persistence and recovery
 * - Real-time progress streaming
 */

import { EventEmitter } from 'events';
import { createLogger } from '../logger.js';

export interface ProgressConfig {
  enablePersistence: boolean;
  maxConcurrentTasks: number;
  defaultTimeout: number;
  enableRealTimeUpdates: boolean;
}

export interface ProgressPhase {
  id: string;
  name: string;
  description?: string;
  weight: number; // Relative weight for calculating overall progress
  estimatedDuration?: number; // In milliseconds
  dependencies?: string[]; // Phase IDs that must complete before this phase
}

export interface ProgressState {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  currentPhase?: string;
  currentPhaseIndex: number;
  totalPhases: number;
  overallProgress: number; // 0-100
  phaseProgress: number; // 0-100 for current phase
  startTime?: Date;
  endTime?: Date;
  estimatedEndTime?: Date;
  error?: string;
  metadata?: Record<string, any>;
}

export interface ProgressEvent {
  type: 'started' | 'progress' | 'phase-changed' | 'completed' | 'failed' | 'cancelled';
  taskId: string;
  progress: ProgressState;
  phase?: ProgressPhase;
  timestamp: Date;
}

export interface ProgressUpdate {
  percentage: number;
  message?: string;
  metadata?: Record<string, any>;
  increment?: boolean; // If true, percentage is added to current progress
}

export interface ProgressTracker {
  id: string;
  name: string;
  updateProgress(update: ProgressUpdate): void;
  setPhase(phaseId: string, update?: ProgressUpdate): void;
  complete(message?: string): void;
  fail(error: string | Error): void;
  cancel(reason?: string): void;
  addSubTask(id: string, name: string, weight: number): ProgressTracker;
  getState(): ProgressState;
  on(event: string, listener: (...args: any[]) => void): void;
  off(event: string, listener: (...args: any[]) => void): void;
}

export interface TaskDefinition {
  id: string;
  name: string;
  description?: string;
  phases: ProgressPhase[];
  timeout?: number;
  metadata?: Record<string, any>;
}

export interface ProgressCallback {
  (event: ProgressEvent): void;
}

export class ProgressTrackingService extends EventEmitter {
  private config: ProgressConfig;
  private activeTasks: Map<string, ProgressTracker> = new Map();
  private taskHistory: Map<string, ProgressState> = new Map();
  private callbacks: Map<string, ProgressCallback[]> = new Map();
  private updateInterval?: NodeJS.Timeout;
  private logger = createLogger('ProgressTrackingService', 'logs/app.log');

  constructor(config: ProgressConfig) {
    super();
    this.config = config;
    
    if (config.enableRealTimeUpdates) {
      this.startRealTimeUpdates();
    }
    
    this.logger.info(`ProgressTrackingService initialized with config: ${JSON.stringify(config)}`);
  }

  /**
   * Create a new progress tracker
   */
  createProgress(task: TaskDefinition): ProgressTracker {
    if (this.activeTasks.has(task.id)) {
      throw new Error(`Task with ID ${task.id} already exists`);
    }

    if (this.activeTasks.size >= this.config.maxConcurrentTasks) {
      throw new Error(`Maximum concurrent tasks limit reached (${this.config.maxConcurrentTasks})`);
    }

    const tracker = new ProgressTrackerImpl(task, this);
    this.activeTasks.set(task.id, tracker);
    
    this.logger.debug(`Progress tracker created - taskId: ${task.id}, name: ${task.name}`);
    this.emitEvent('started', tracker);
    
    return tracker;
  }

  /**
   * Get progress state for a task
   */
  getProgress(taskId: string): ProgressState | null {
    const tracker = this.activeTasks.get(taskId);
    if (tracker) {
      return tracker.getState();
    }
    
    return this.taskHistory.get(taskId) || null;
  }

  /**
   * Get all active progress states
   */
  getAllProgress(): ProgressState[] {
    return Array.from(this.activeTasks.values()).map(tracker => tracker.getState());
  }

  /**
   * Get progress history
   */
  getProgressHistory(): ProgressState[] {
    return Array.from(this.taskHistory.values());
  }

  /**
   * Cancel a task
   */
  cancelProgress(taskId: string, reason?: string): void {
    const tracker = this.activeTasks.get(taskId);
    if (tracker) {
      tracker.cancel(reason);
    }
  }

  /**
   * Cancel all active tasks
   */
  cancelAllProgress(reason?: string): void {
    for (const tracker of this.activeTasks.values()) {
      tracker.cancel(reason);
    }
  }

  /**
   * Register progress callback
   */
  onProgress(taskId: string, callback: ProgressCallback): void {
    if (!this.callbacks.has(taskId)) {
      this.callbacks.set(taskId, []);
    }
    this.callbacks.get(taskId)!.push(callback);
  }

  /**
   * Register global progress callback
   */
  onAnyProgress(callback: ProgressCallback): void {
    this.on('progress', callback);
  }

  /**
   * Remove progress callback
   */
  offProgress(taskId: string, callback: ProgressCallback): void {
    const callbacks = this.callbacks.get(taskId);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index !== -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  /**
   * Remove all callbacks for a task
   */
  clearCallbacks(taskId: string): void {
    this.callbacks.delete(taskId);
  }

  /**
   * Internal method to handle task completion
   */
  handleTaskCompletion(taskId: string, _state: ProgressState): void {
    const tracker = this.activeTasks.get(taskId);
    if (tracker) {
      this.activeTasks.delete(taskId);
      
      if (this.config.enablePersistence) {
        this.taskHistory.set(taskId, { ..._state });
      }
      
      // Clean up callbacks
      this.callbacks.delete(taskId);
      
      const duration = _state.endTime && _state.startTime ? _state.endTime.getTime() - _state.startTime.getTime() : 0;
      this.logger.debug(`Task completed - taskId: ${taskId}, status: ${_state.status}, duration: ${duration}ms`);
    }
  }

  /**
   * Internal method to emit progress events
   */
  private emitEvent(type: ProgressEvent['type'], tracker: ProgressTracker, phase?: ProgressPhase): void {
    const event: ProgressEvent = {
      type,
      taskId: tracker.id,
      progress: tracker.getState(),
      phase,
      timestamp: new Date()
    };

    // Emit to global listeners
    this.emit('progress', event);
    this.emit(type, event);

    // Emit to task-specific listeners
    const callbacks = this.callbacks.get(tracker.id);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(event);
        } catch (error) {
          this.logger.error(`Error in progress callback - taskId: ${tracker.id}, error: ${error}`);
        }
      });
    }
  }

  /**
   * Start real-time updates
   */
  private startRealTimeUpdates(): void {
    this.updateInterval = setInterval(() => {
      for (const tracker of this.activeTasks.values()) {
        const state = tracker.getState();
        if (state.status === 'running' && state.startTime) {
          // Update estimated end time based on current progress
          const elapsed = Date.now() - state.startTime.getTime();
          if (state.overallProgress > 0) {
            const estimatedTotal = (elapsed / state.overallProgress) * 100;
            state.estimatedEndTime = new Date(state.startTime.getTime() + estimatedTotal);
          }
        }
      }
    }, 1000);
  }

  /**
   * Stop real-time updates
   */
  private stopRealTimeUpdates(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = undefined;
    }
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    this.stopRealTimeUpdates();
    
    // Cancel all active tasks
    this.cancelAllProgress('Service cleanup');
    
    // Clear all callbacks
    this.callbacks.clear();
    
    this.logger.info('ProgressTrackingService cleanup completed');
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<ProgressConfig>): void {
    this.config = { ...this.config, ...config };
    
    if (config.enableRealTimeUpdates && !this.updateInterval) {
      this.startRealTimeUpdates();
    } else if (config.enableRealTimeUpdates === false && this.updateInterval) {
      this.stopRealTimeUpdates();
    }
    
    this.logger.info(`ProgressTrackingService configuration updated: ${JSON.stringify(config)}`);
  }
}

/**
 * Implementation of ProgressTracker
 */
class ProgressTrackerImpl extends EventEmitter implements ProgressTracker {
  public readonly id: string;
  public readonly name: string;
  private task: TaskDefinition;
  private service: ProgressTrackingService;
  private state: ProgressState;
  private currentPhase?: ProgressPhase;
  private subTasks: Map<string, ProgressTracker> = new Map();
  private timeout?: NodeJS.Timeout;

  constructor(task: TaskDefinition, service: ProgressTrackingService) {
    super();
    this.id = task.id;
    this.name = task.name;
    this.task = task;
    this.service = service;
    
    this.state = {
      id: task.id,
      name: task.name,
      status: 'pending',
      currentPhaseIndex: 0,
      totalPhases: task.phases.length,
      overallProgress: 0,
      phaseProgress: 0,
      startTime: new Date(),
      metadata: task.metadata || {}
    };

    // Set up timeout if specified
    if (task.timeout) {
      this.timeout = setTimeout(() => {
        this.fail(new Error(`Task timeout after ${task.timeout}ms`));
      }, task.timeout);
    }
  }

  /**
   * Update progress for current phase
   */
  updateProgress(update: ProgressUpdate): void {
    if (this.state.status !== 'pending' && this.state.status !== 'running') {
      return; // Task is already completed/failed/cancelled
    }

    if (this.state.status === 'pending') {
      this.state.status = 'running';
    }

    // Update phase progress
    if (update.increment) {
      this.state.phaseProgress = Math.min(100, this.state.phaseProgress + update.percentage);
    } else {
      this.state.phaseProgress = Math.max(0, Math.min(100, update.percentage));
    }

    // Calculate overall progress based on phase weights
    this.calculateOverallProgress();

    // Update metadata
    if (update.metadata) {
      this.state.metadata = { ...this.state.metadata, ...update.metadata };
    }

    // Emit progress event
    (this.service as any).emitEvent('progress', this, this.currentPhase);
  }

  /**
   * Set current phase
   */
  setPhase(phaseId: string, update?: ProgressUpdate): void {
    const phase = this.task.phases.find(p => p.id === phaseId);
    if (!phase) {
      throw new Error(`Phase ${phaseId} not found in task ${this.id}`);
    }

    // Check dependencies
    if (phase.dependencies) {
      const completedPhases = this.task.phases.slice(0, this.state.currentPhaseIndex);
      const completedPhaseIds = completedPhases.map(p => p.id);
      
      for (const depId of phase.dependencies) {
        if (!completedPhaseIds.includes(depId)) {
          throw new Error(`Phase ${phaseId} depends on ${depId} which is not completed`);
        }
      }
    }

    this.currentPhase = phase;
    this.state.currentPhase = phaseId;
    this.state.currentPhaseIndex = this.task.phases.indexOf(phase);
    this.state.phaseProgress = 0;

    if (update) {
      this.updateProgress(update);
    }

    // Emit phase change event
    (this.service as any).emitEvent('phase-changed', this, phase);
  }

  /**
   * Complete the task
   */
  complete(message?: string): void {
    if (this.state.status === 'completed') {
      return;
    }

    this.clearTimeout();
    this.state.status = 'completed';
    this.state.overallProgress = 100;
    this.state.phaseProgress = 100;
    this.state.endTime = new Date();

    if (message) {
      this.state.metadata = { ...this.state.metadata, completionMessage: message };
    }

    // Complete all sub-tasks
    for (const subTask of this.subTasks.values()) {
      subTask.complete();
    }

    // Emit completion event
    (this.service as any).emitEvent('completed', this);
    (this.service as any).handleTaskCompletion(this.id, this.state);
  }

  /**
   * Fail the task
   */
  fail(error: string | Error): void {
    if (this.state.status === 'completed' || this.state.status === 'failed') {
      return;
    }

    this.clearTimeout();
    this.state.status = 'failed';
    this.state.endTime = new Date();
    this.state.error = error instanceof Error ? error.message : error;

    // Fail all sub-tasks
    for (const subTask of this.subTasks.values()) {
      subTask.fail(error);
    }

    // Emit failure event
    (this.service as any).emitEvent('failed', this);
    (this.service as any).handleTaskCompletion(this.id, this.state);
  }

  /**
   * Cancel the task
   */
  cancel(reason?: string): void {
    if (this.state.status === 'completed' || this.state.status === 'failed' || this.state.status === 'cancelled') {
      return;
    }

    this.clearTimeout();
    this.state.status = 'cancelled';
    this.state.endTime = new Date();

    if (reason) {
      this.state.metadata = { ...this.state.metadata, cancellationReason: reason };
    }

    // Cancel all sub-tasks
    for (const subTask of this.subTasks.values()) {
      subTask.cancel(reason);
    }

    // Emit cancellation event
    (this.service as any).emitEvent('cancelled', this);
    (this.service as any).handleTaskCompletion(this.id, this.state);
  }

  /**
   * Add sub-task
   */
  addSubTask(id: string, name: string, _weight: number): ProgressTracker {
    const subTaskDefinition: TaskDefinition = {
      id: `${this.id}_${id}`,
      name,
      phases: [{
        id: 'main',
        name: 'Main Phase',
        weight: 1
      }]
    };

    const subTracker = new ProgressTrackerImpl(subTaskDefinition, this.service);
    this.subTasks.set(id, subTracker);

    // Forward sub-task events
    subTracker.on('progress', () => {
      this.calculateOverallProgress();
    });

    return subTracker;
  }

  /**
   * Get current state
   */
  getState(): ProgressState {
    return { ...this.state };
  }

  /**
   * Calculate overall progress based on phase weights and sub-tasks
   */
  private calculateOverallProgress(): void {
    let totalWeight = 0;
    let completedWeight = 0;

    // Calculate progress from phases
    for (let i = 0; i < this.task.phases.length; i++) {
      const phase = this.task.phases[i];
      totalWeight += phase.weight;

      if (i < this.state.currentPhaseIndex) {
        // Completed phases
        completedWeight += phase.weight;
      } else if (i === this.state.currentPhaseIndex) {
        // Current phase
        completedWeight += (phase.weight * this.state.phaseProgress) / 100;
      }
    }

    // Calculate progress from sub-tasks
    for (const subTask of this.subTasks.values()) {
      const subState = subTask.getState();
      totalWeight += 1; // Each sub-task has weight of 1
      completedWeight += subState.overallProgress / 100;
    }

    this.state.overallProgress = totalWeight > 0 ? Math.min(100, (completedWeight / totalWeight) * 100) : 0;
  }

  /**
   * Clear timeout
   */
  private clearTimeout(): void {
    if (this.timeout) {
      clearTimeout(this.timeout);
      this.timeout = undefined;
    }
  }
}

/**
 * Factory function to create ProgressTrackingService with default configuration
 */
export function createProgressTrackingService(overrides: Partial<ProgressConfig> = {}): ProgressTrackingService {
  const defaultConfig: ProgressConfig = {
    enablePersistence: true,
    maxConcurrentTasks: 50,
    defaultTimeout: 300000, // 5 minutes
    enableRealTimeUpdates: true,
    ...overrides
  };

  return new ProgressTrackingService(defaultConfig);
}

/**
 * Utility function to create a simple progress tracker
 */
export function createSimpleProgress(id: string, name: string, phases: string[]): TaskDefinition {
  return {
    id,
    name,
    phases: phases.map((phaseName, index) => ({
      id: `phase_${index}`,
      name: phaseName,
      weight: 1 // Equal weight for all phases
    }))
  };
}