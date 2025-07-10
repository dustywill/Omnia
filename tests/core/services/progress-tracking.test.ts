/**
 * ProgressTrackingService Tests
 * 
 * Comprehensive test suite for the ProgressTrackingService including:
 * - Progress tracker creation and lifecycle
 * - Phase-based progress tracking
 * - Event emission and callbacks
 * - Sub-task management
 * - Cancellation and error handling
 * - Configuration management
 */

import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { ProgressTrackingService, createProgressTrackingService } from '../../../src/core/services/progress-tracking.js';
import { EventEmitter } from 'events';

// Mock logger
const mockLogger = {
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn()
};

jest.mock('../../../src/core/logger.js', () => ({
  logger: mockLogger
}));

describe('ProgressTrackingService', () => {
  let service: ProgressTrackingService;
  let testConfig: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    testConfig = {
      enablePersistence: true,
      maxConcurrentTasks: 5,
      defaultTimeout: 30000,
      enableRealTimeUpdates: false // Disable to avoid setInterval in tests
    };

    service = new ProgressTrackingService(testConfig);
  });

  afterEach(async () => {
    await service.cleanup();
    jest.restoreAllMocks();
  });

  describe('Constructor and Configuration', () => {
    it('should create service with default configuration', () => {
      const defaultService = createProgressTrackingService();
      expect(defaultService).toBeInstanceOf(ProgressTrackingService);
      expect(defaultService).toBeInstanceOf(EventEmitter);
      expect(mockLogger.info).toHaveBeenCalledWith('ProgressTrackingService initialized', expect.any(Object));
    });

    it('should create service with custom configuration', () => {
      const customConfig = {
        enablePersistence: false,
        maxConcurrentTasks: 10,
        enableRealTimeUpdates: true
      };
      
      const customService = createProgressTrackingService(customConfig);
      expect(customService).toBeInstanceOf(ProgressTrackingService);
    });

    it('should update configuration', () => {
      const newConfig = { maxConcurrentTasks: 10 };
      
      service.updateConfig(newConfig);
      
      expect(mockLogger.info).toHaveBeenCalledWith('ProgressTrackingService configuration updated', expect.any(Object));
    });
  });

  describe('Progress Tracker Creation', () => {
    const sampleTask = {
      id: 'test-task',
      name: 'Test Task',
      description: 'A test task',
      phases: [
        { id: 'phase1', name: 'Phase 1', weight: 30 },
        { id: 'phase2', name: 'Phase 2', weight: 50 },
        { id: 'phase3', name: 'Phase 3', weight: 20 }
      ]
    };

    it('should create progress tracker successfully', () => {
      const tracker = service.createProgress(sampleTask);
      
      expect(tracker).toBeDefined();
      expect(tracker.id).toBe('test-task');
      expect(tracker.name).toBe('Test Task');
      expect(mockLogger.debug).toHaveBeenCalledWith('Progress tracker created', expect.any(Object));
    });

    it('should reject duplicate task IDs', () => {
      service.createProgress(sampleTask);
      
      expect(() => service.createProgress(sampleTask)).toThrow('Task with ID test-task already exists');
    });

    it('should enforce concurrent task limits', () => {
      // Create maximum allowed concurrent tasks
      for (let i = 0; i < testConfig.maxConcurrentTasks; i++) {
        service.createProgress({
          ...sampleTask,
          id: `task-${i}`
        });
      }
      
      // This should fail
      expect(() => service.createProgress({
        ...sampleTask,
        id: 'overflow-task'
      })).toThrow('Maximum concurrent tasks limit reached');
    });
  });

  describe('Progress State Management', () => {
    let tracker: any;
    
    beforeEach(() => {
      const task = {
        id: 'test-task',
        name: 'Test Task',
        phases: [
          { id: 'phase1', name: 'Phase 1', weight: 50 },
          { id: 'phase2', name: 'Phase 2', weight: 50 }
        ]
      };
      tracker = service.createProgress(task);
    });

    it('should get progress state', () => {
      const state = service.getProgress('test-task');
      
      expect(state).toMatchObject({
        id: 'test-task',
        name: 'Test Task',
        status: 'pending',
        currentPhaseIndex: 0,
        totalPhases: 2,
        overallProgress: 0,
        phaseProgress: 0
      });
    });

    it('should get all progress states', () => {
      const states = service.getAllProgress();
      
      expect(states).toHaveLength(1);
      expect(states[0].id).toBe('test-task');
    });

    it('should update progress', () => {
      tracker.updateProgress({ percentage: 50, message: 'Halfway done' });
      
      const state = service.getProgress('test-task');
      expect(state?.status).toBe('running');
      expect(state?.phaseProgress).toBe(50);
    });

    it('should set phase', () => {
      tracker.setPhase('phase1', { percentage: 25 });
      
      const state = service.getProgress('test-task');
      expect(state?.currentPhase).toBe('phase1');
      expect(state?.phaseProgress).toBe(25);
    });

    it('should reject invalid phase', () => {
      expect(() => tracker.setPhase('invalid-phase')).toThrow('Phase invalid-phase not found');
    });
  });

  describe('Progress Completion', () => {
    let tracker: any;
    
    beforeEach(() => {
      const task = {
        id: 'test-task',
        name: 'Test Task',
        phases: [{ id: 'phase1', name: 'Phase 1', weight: 100 }]
      };
      tracker = service.createProgress(task);
    });

    it('should complete progress successfully', () => {
      tracker.complete('Task completed successfully');
      
      const state = service.getProgress('test-task');
      expect(state?.status).toBe('completed');
      expect(state?.overallProgress).toBe(100);
      expect(state?.endTime).toBeDefined();
      expect(state?.metadata?.completionMessage).toBe('Task completed successfully');
    });

    it('should fail progress with error', () => {
      const error = new Error('Task failed');
      tracker.fail(error);
      
      const state = service.getProgress('test-task');
      expect(state?.status).toBe('failed');
      expect(state?.error).toBe('Task failed');
      expect(state?.endTime).toBeDefined();
    });

    it('should cancel progress', () => {
      tracker.cancel('User cancelled');
      
      const state = service.getProgress('test-task');
      expect(state?.status).toBe('cancelled');
      expect(state?.endTime).toBeDefined();
      expect(state?.metadata?.cancellationReason).toBe('User cancelled');
    });
  });

  describe('Event Handling', () => {
    it('should emit progress events', (done) => {
      const task = {
        id: 'test-task',
        name: 'Test Task',
        phases: [{ id: 'phase1', name: 'Phase 1', weight: 100 }]
      };
      
      service.on('progress', (event) => {
        expect(event.type).toBe('progress');
        expect(event.taskId).toBe('test-task');
        expect(event.progress).toBeDefined();
        done();
      });
      
      const tracker = service.createProgress(task);
      tracker.updateProgress({ percentage: 50 });
    });

    it('should emit completion events', (done) => {
      const task = {
        id: 'test-task',
        name: 'Test Task',
        phases: [{ id: 'phase1', name: 'Phase 1', weight: 100 }]
      };
      
      service.on('completed', (event) => {
        expect(event.type).toBe('completed');
        expect(event.taskId).toBe('test-task');
        done();
      });
      
      const tracker = service.createProgress(task);
      tracker.complete();
    });

    it('should register task-specific callbacks', () => {
      const callback = jest.fn();
      
      service.onProgress('test-task', callback);
      
      const task = {
        id: 'test-task',
        name: 'Test Task',
        phases: [{ id: 'phase1', name: 'Phase 1', weight: 100 }]
      };
      
      const tracker = service.createProgress(task);
      tracker.updateProgress({ percentage: 50 });
      
      expect(callback).toHaveBeenCalledWith(expect.objectContaining({
        type: 'progress',
        taskId: 'test-task'
      }));
    });

    it('should register global callbacks', () => {
      const callback = jest.fn();
      
      service.onAnyProgress(callback);
      
      const task = {
        id: 'test-task',
        name: 'Test Task',
        phases: [{ id: 'phase1', name: 'Phase 1', weight: 100 }]
      };
      
      const tracker = service.createProgress(task);
      tracker.updateProgress({ percentage: 50 });
      
      expect(callback).toHaveBeenCalledWith(expect.objectContaining({
        type: 'progress',
        taskId: 'test-task'
      }));
    });
  });

  describe('Sub-task Management', () => {
    let tracker: any;
    
    beforeEach(() => {
      const task = {
        id: 'parent-task',
        name: 'Parent Task',
        phases: [{ id: 'phase1', name: 'Phase 1', weight: 100 }]
      };
      tracker = service.createProgress(task);
    });

    it('should create sub-tasks', () => {
      const subTask = tracker.addSubTask('sub1', 'Sub Task 1', 1);
      
      expect(subTask).toBeDefined();
      expect(subTask.id).toBe('parent-task_sub1');
      expect(subTask.name).toBe('Sub Task 1');
    });

    it('should update overall progress with sub-tasks', () => {
      const subTask = tracker.addSubTask('sub1', 'Sub Task 1', 1);
      
      // Update sub-task progress
      subTask.updateProgress({ percentage: 50 });
      
      // Parent task should reflect sub-task progress
      const state = service.getProgress('parent-task');
      expect(state?.overallProgress).toBeGreaterThan(0);
    });
  });

  describe('Cancellation', () => {
    it('should cancel specific task', () => {
      const task = {
        id: 'test-task',
        name: 'Test Task',
        phases: [{ id: 'phase1', name: 'Phase 1', weight: 100 }]
      };
      
      service.createProgress(task);
      service.cancelProgress('test-task', 'Manual cancellation');
      
      const state = service.getProgress('test-task');
      expect(state?.status).toBe('cancelled');
    });

    it('should cancel all tasks', () => {
      const task1 = {
        id: 'task1',
        name: 'Task 1',
        phases: [{ id: 'phase1', name: 'Phase 1', weight: 100 }]
      };
      
      const task2 = {
        id: 'task2',
        name: 'Task 2',
        phases: [{ id: 'phase1', name: 'Phase 1', weight: 100 }]
      };
      
      service.createProgress(task1);
      service.createProgress(task2);
      
      service.cancelAllProgress('System shutdown');
      
      const states = service.getAllProgress();
      expect(states.every(state => state.status === 'cancelled')).toBe(true);
    });
  });

  describe('Progress History', () => {
    it('should track progress history when persistence is enabled', () => {
      const task = {
        id: 'test-task',
        name: 'Test Task',
        phases: [{ id: 'phase1', name: 'Phase 1', weight: 100 }]
      };
      
      const tracker = service.createProgress(task);
      tracker.complete();
      
      const history = service.getProgressHistory();
      expect(history).toHaveLength(1);
      expect(history[0].id).toBe('test-task');
      expect(history[0].status).toBe('completed');
    });

    it('should not track history when persistence is disabled', () => {
      const noPersistenceService = new ProgressTrackingService({
        enablePersistence: false,
        maxConcurrentTasks: 5,
        defaultTimeout: 30000,
        enableRealTimeUpdates: false
      });
      
      const task = {
        id: 'test-task',
        name: 'Test Task',
        phases: [{ id: 'phase1', name: 'Phase 1', weight: 100 }]
      };
      
      const tracker = noPersistenceService.createProgress(task);
      tracker.complete();
      
      const history = noPersistenceService.getProgressHistory();
      expect(history).toHaveLength(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle callback errors gracefully', () => {
      const errorCallback = jest.fn().mockImplementation(() => {
        throw new Error('Callback error');
      });
      
      service.onProgress('test-task', errorCallback);
      
      const task = {
        id: 'test-task',
        name: 'Test Task',
        phases: [{ id: 'phase1', name: 'Phase 1', weight: 100 }]
      };
      
      const tracker = service.createProgress(task);
      
      // This should not throw, error should be logged
      expect(() => tracker.updateProgress({ percentage: 50 })).not.toThrow();
      expect(mockLogger.error).toHaveBeenCalledWith('Error in progress callback', expect.any(Object));
    });
  });

  describe('Cleanup', () => {
    it('should cleanup all resources', async () => {
      const task = {
        id: 'test-task',
        name: 'Test Task',
        phases: [{ id: 'phase1', name: 'Phase 1', weight: 100 }]
      };
      
      service.createProgress(task);
      
      await service.cleanup();
      
      expect(mockLogger.info).toHaveBeenCalledWith('ProgressTrackingService cleanup completed');
    });
  });

  describe('Utility Functions', () => {
    it('should create simple progress task definition', () => {
      const { createSimpleProgress } = require('../../../src/core/services/progress-tracking.js');
      
      const taskDef = createSimpleProgress('simple-task', 'Simple Task', ['Step 1', 'Step 2', 'Step 3']);
      
      expect(taskDef).toMatchObject({
        id: 'simple-task',
        name: 'Simple Task',
        phases: expect.arrayContaining([
          expect.objectContaining({ name: 'Step 1', weight: 1 }),
          expect.objectContaining({ name: 'Step 2', weight: 1 }),
          expect.objectContaining({ name: 'Step 3', weight: 1 })
        ])
      });
    });
  });
});