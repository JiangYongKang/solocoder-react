import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  generateId,
  validateAppId,
  validateVersion,
  parseVersion,
  compareVersions,
  formatDateTime,
  formatDuration,
  createMicroApp,
  upgradeAppVersion,
  canTransitionStatus,
  transitionStatus,
  addLifecycleStage,
  clearLifecycleStages,
  routeMessage,
  createMessageLogEntry,
  addMessageLog,
  simulateResourceLoad,
  getInitialActiveAppFromHash,
  buildHashForApp,
} from '@/pages/micro-frontend/utils.js';
import {
  APP_STATUS,
  LIFECYCLE_STAGES,
  BROADCAST_TARGET,
  MAX_MESSAGE_LOGS,
} from '@/pages/micro-frontend/constants.js';
import {
  createLifecycleManager,
  beginLifecycleStage,
  completeLifecycleStage,
  bootstrapApp,
  finishBootstrapApp,
  finishMountApp,
  unmountApp,
  finishUnmountApp,
  startLoadingResources,
  finishLoadingResources,
  resetFailedApp,
  resetAppForRestart,
} from '@/pages/micro-frontend/lifecycle.js';
import { EventBus, createEventBus } from '@/pages/micro-frontend/eventBus.js';

describe('micro-frontend/utils', () => {
  const baseApp = createMicroApp({ name: 'App', appId: 'app', entryPath: '/app' });

  describe('generateId', () => {
    it('should generate non-empty string ids', () => {
      const id = generateId();
      expect(typeof id).toBe('string');
      expect(id.length).toBeGreaterThan(0);
    });

    it('should prepend prefix when provided', () => {
      const id = generateId('app_');
      expect(id.startsWith('app_')).toBe(true);
    });

    it('should generate unique ids', () => {
      const ids = new Set(Array.from({ length: 100 }, () => generateId()));
      expect(ids.size).toBe(100);
    });
  });

  describe('validateAppId', () => {
    it('should accept valid app ids starting with lowercase letter', () => {
      expect(validateAppId('user')).toBe(true);
      expect(validateAppId('user-mgmt')).toBe(true);
      expect(validateAppId('app123')).toBe(true);
      expect(validateAppId('my-cool-app-1')).toBe(true);
    });

    it('should reject ids starting with number', () => {
      expect(validateAppId('123app')).toBe(false);
    });

    it('should reject ids with uppercase letters', () => {
      expect(validateAppId('UserMgmt')).toBe(false);
    });

    it('should reject ids with underscores', () => {
      expect(validateAppId('user_mgmt')).toBe(false);
    });

    it('should reject empty/null/undefined', () => {
      expect(validateAppId('')).toBe(false);
      expect(validateAppId(null)).toBe(false);
      expect(validateAppId(undefined)).toBe(false);
    });

    it('should reject non-string values', () => {
      expect(validateAppId(123)).toBe(false);
      expect(validateAppId({})).toBe(false);
    });
  });

  describe('validateVersion', () => {
    it('should accept valid semver versions', () => {
      expect(validateVersion('1.0.0')).toBe(true);
      expect(validateVersion('0.0.1')).toBe(true);
      expect(validateVersion('10.20.30')).toBe(true);
      expect(validateVersion('1.2.3')).toBe(true);
    });

    it('should reject invalid formats', () => {
      expect(validateVersion('1')).toBe(false);
      expect(validateVersion('1.0')).toBe(false);
      expect(validateVersion('v1.0.0')).toBe(false);
      expect(validateVersion('1.0.0-beta')).toBe(false);
      expect(validateVersion('1.0.0.0')).toBe(false);
      expect(validateVersion('a.b.c')).toBe(false);
    });

    it('should reject empty/null/undefined', () => {
      expect(validateVersion('')).toBe(false);
      expect(validateVersion(null)).toBe(false);
      expect(validateVersion(undefined)).toBe(false);
    });
  });

  describe('parseVersion', () => {
    it('should parse version string into components', () => {
      expect(parseVersion('1.2.3')).toEqual({ major: 1, minor: 2, patch: 3 });
      expect(parseVersion('0.0.1')).toEqual({ major: 0, minor: 0, patch: 1 });
      expect(parseVersion('10.20.30')).toEqual({ major: 10, minor: 20, patch: 30 });
    });

    it('should return null for invalid versions', () => {
      expect(parseVersion('invalid')).toBeNull();
      expect(parseVersion('1.0')).toBeNull();
      expect(parseVersion(null)).toBeNull();
    });
  });

  describe('compareVersions', () => {
    it('should return 0 for equal versions', () => {
      expect(compareVersions('1.0.0', '1.0.0')).toBe(0);
      expect(compareVersions('2.3.4', '2.3.4')).toBe(0);
    });

    it('should return 1 when first version is greater', () => {
      expect(compareVersions('2.0.0', '1.0.0')).toBe(1);
      expect(compareVersions('1.1.0', '1.0.0')).toBe(1);
      expect(compareVersions('1.0.1', '1.0.0')).toBe(1);
      expect(compareVersions('1.10.0', '1.9.0')).toBe(1);
    });

    it('should return -1 when first version is lesser', () => {
      expect(compareVersions('1.0.0', '2.0.0')).toBe(-1);
      expect(compareVersions('1.0.0', '1.1.0')).toBe(-1);
      expect(compareVersions('1.0.0', '1.0.1')).toBe(-1);
    });

    it('should return null for invalid input', () => {
      expect(compareVersions('invalid', '1.0.0')).toBeNull();
      expect(compareVersions('1.0.0', null)).toBeNull();
    });
  });

  describe('formatDateTime', () => {
    it('should format timestamp to readable string', () => {
      const ts = new Date(2024, 0, 15, 10, 30, 45).getTime();
      const result = formatDateTime(ts);
      expect(result).toContain('2024');
      expect(result).toContain('10');
      expect(result).toContain('30');
      expect(result).toContain('45');
    });

    it('should return empty string for null/undefined', () => {
      expect(formatDateTime(null)).toBe('');
      expect(formatDateTime(undefined)).toBe('');
    });
  });

  describe('formatDuration', () => {
    it('should format duration with ms suffix', () => {
      expect(formatDuration(100)).toBe('100ms');
      expect(formatDuration(0)).toBe('0ms');
    });

    it('should return empty string for invalid input', () => {
      expect(formatDuration(null)).toBe('');
      expect(formatDuration(undefined)).toBe('');
      expect(formatDuration(-1)).toBe('');
    });
  });

  describe('createMicroApp', () => {
    it('should create a micro app with valid inputs', () => {
      const app = createMicroApp({
        name: '用户管理',
        appId: 'user-mgmt',
        entryPath: '/user-mgmt',
        resources: ['a.js', 'b.css'],
      });
      expect(app).not.toBeNull();
      expect(app.name).toBe('用户管理');
      expect(app.id).toBe('user-mgmt');
      expect(app.entryPath).toBe('/user-mgmt');
      expect(app.status).toBe(APP_STATUS.STOPPED);
      expect(app.version).toBe('1.0.0');
      expect(app.resources).toEqual(['a.js', 'b.css']);
      expect(app.versionHistory).toHaveLength(1);
      expect(app.versionHistory[0].version).toBe('1.0.0');
      expect(typeof app.createdAt).toBe('number');
    });

    it('should trim whitespace from inputs', () => {
      const app = createMicroApp({
        name: '  用户管理  ',
        appId: 'user-mgmt',
        entryPath: '  /user-mgmt  ',
      });
      expect(app.name).toBe('用户管理');
      expect(app.entryPath).toBe('/user-mgmt');
    });

    it('should default resources to empty array', () => {
      const app = createMicroApp({
        name: 'App',
        appId: 'app',
        entryPath: '/app',
      });
      expect(app.resources).toEqual([]);
    });

    it('should return null for invalid appId', () => {
      expect(createMicroApp({ name: 'App', appId: 'Invalid-ID', entryPath: '/app' })).toBeNull();
    });

    it('should return null for missing/empty name', () => {
      expect(createMicroApp({ name: '', appId: 'app', entryPath: '/app' })).toBeNull();
      expect(createMicroApp({ appId: 'app', entryPath: '/app' })).toBeNull();
    });

    it('should return null for missing/empty entryPath', () => {
      expect(createMicroApp({ name: 'App', appId: 'app', entryPath: '' })).toBeNull();
    });
  });

  describe('upgradeAppVersion', () => {
    const baseApp = createMicroApp({ name: 'App', appId: 'app', entryPath: '/app' });

    it('should upgrade to a higher version', () => {
      const result = upgradeAppVersion(baseApp, '1.1.0', '新增功能');
      expect(result.error).toBeNull();
      expect(result.app.version).toBe('1.1.0');
      expect(result.app.versionHistory).toHaveLength(2);
      expect(result.app.versionHistory[1].version).toBe('1.1.0');
      expect(result.app.versionHistory[1].changelog).toBe('新增功能');
    });

    it('should use default changelog when not provided', () => {
      const result = upgradeAppVersion(baseApp, '2.0.0', '');
      expect(result.error).toBeNull();
      expect(result.app.versionHistory[1].changelog).toBe('未填写更新日志');
    });

    it('should reject invalid version format', () => {
      const result = upgradeAppVersion(baseApp, 'invalid', 'test');
      expect(result.error).toBeTruthy();
      expect(result.app).toBe(baseApp);
    });

    it('should reject downgrade', () => {
      const result = upgradeAppVersion(baseApp, '0.9.0', 'test');
      expect(result.error).toBeTruthy();
    });

    it('should reject same version', () => {
      const result = upgradeAppVersion(baseApp, '1.0.0', 'test');
      expect(result.error).toBeTruthy();
    });
  });

  describe('canTransitionStatus', () => {
    it('should allow valid transitions', () => {
      expect(canTransitionStatus(APP_STATUS.STOPPED, APP_STATUS.LOADING)).toBe(true);
      expect(canTransitionStatus(APP_STATUS.STOPPED, APP_STATUS.BOOTSTRAPPING)).toBe(true);
      expect(canTransitionStatus(APP_STATUS.LOADING, APP_STATUS.BOOTSTRAPPING)).toBe(true);
      expect(canTransitionStatus(APP_STATUS.LOADING, APP_STATUS.LOAD_FAILED)).toBe(true);
      expect(canTransitionStatus(APP_STATUS.BOOTSTRAPPING, APP_STATUS.MOUNTING)).toBe(true);
      expect(canTransitionStatus(APP_STATUS.MOUNTING, APP_STATUS.RUNNING)).toBe(true);
      expect(canTransitionStatus(APP_STATUS.RUNNING, APP_STATUS.UNMOUNTING)).toBe(true);
      expect(canTransitionStatus(APP_STATUS.UNMOUNTING, APP_STATUS.STOPPED)).toBe(true);
      expect(canTransitionStatus(APP_STATUS.LOAD_FAILED, APP_STATUS.STOPPED)).toBe(true);
      expect(canTransitionStatus(APP_STATUS.LOAD_FAILED, APP_STATUS.LOADING)).toBe(true);
    });

    it('should reject invalid transitions', () => {
      expect(canTransitionStatus(APP_STATUS.RUNNING, APP_STATUS.STOPPED)).toBe(false);
      expect(canTransitionStatus(APP_STATUS.STOPPED, APP_STATUS.RUNNING)).toBe(false);
      expect(canTransitionStatus(APP_STATUS.MOUNTING, APP_STATUS.STOPPED)).toBe(false);
    });

    it('should return false for null/undefined inputs', () => {
      expect(canTransitionStatus(null, APP_STATUS.RUNNING)).toBe(false);
      expect(canTransitionStatus(APP_STATUS.STOPPED, undefined)).toBe(false);
    });
  });

  describe('transitionStatus', () => {
    it('should transition to valid next status', () => {
      const app = { ...baseApp, status: APP_STATUS.STOPPED };
      const result = transitionStatus(app, APP_STATUS.BOOTSTRAPPING);
      expect(result.error).toBeNull();
      expect(result.app.status).toBe(APP_STATUS.BOOTSTRAPPING);
    });

    it('should return error for invalid transition', () => {
      const app = { ...baseApp, status: APP_STATUS.RUNNING };
      const result = transitionStatus(app, APP_STATUS.STOPPED);
      expect(result.error).toBeTruthy();
      expect(result.app).toBe(app);
    });
  });

  describe('addLifecycleStage & clearLifecycleStages', () => {
    it('should add lifecycle stage with duration and timestamp', () => {
      let app = { ...baseApp, lifecycle: { stages: [], currentStage: null } };
      app = addLifecycleStage(app, LIFECYCLE_STAGES.BOOTSTRAP, 150, 1000);
      expect(app.lifecycle.stages).toHaveLength(1);
      expect(app.lifecycle.stages[0].stage).toBe(LIFECYCLE_STAGES.BOOTSTRAP);
      expect(app.lifecycle.stages[0].duration).toBe(150);
      expect(app.lifecycle.stages[0].timestamp).toBe(1000);
      expect(app.lifecycle.currentStage).toBe(LIFECYCLE_STAGES.BOOTSTRAP);
    });

    it('should clear all lifecycle stages', () => {
      let app = { ...baseApp, lifecycle: { stages: [{ stage: 'bootstrap', duration: 100, timestamp: 1000 }], currentStage: 'bootstrap' } };
      app = clearLifecycleStages(app);
      expect(app.lifecycle.stages).toEqual([]);
      expect(app.lifecycle.currentStage).toBeNull();
    });
  });

  describe('routeMessage', () => {
    it('should broadcast to all apps except sender', () => {
      const targets = routeMessage(
        { from: 'app1', to: BROADCAST_TARGET, type: 'custom', body: 'hi' },
        ['app1', 'app2', 'app3']
      );
      expect(targets).toEqual(['app2', 'app3']);
    });

    it('should send to single target when specified', () => {
      const targets = routeMessage(
        { from: 'app1', to: 'app2', type: 'custom', body: 'hi' },
        ['app1', 'app2', 'app3']
      );
      expect(targets).toEqual(['app2']);
    });

    it('should not send message to self', () => {
      const targets = routeMessage(
        { from: 'app1', to: 'app1', type: 'custom', body: 'hi' },
        ['app1', 'app2']
      );
      expect(targets).toEqual([]);
    });

    it('should return empty array for unknown target', () => {
      const targets = routeMessage(
        { from: 'app1', to: 'app999', type: 'custom', body: 'hi' },
        ['app1', 'app2']
      );
      expect(targets).toEqual([]);
    });

    it('should return empty array for invalid message', () => {
      expect(routeMessage(null, ['app1'])).toEqual([]);
      expect(routeMessage({}, ['app1'])).toEqual([]);
    });
  });

  describe('createMessageLogEntry & addMessageLog', () => {
    it('should create log entry from message', () => {
      const entry = createMessageLogEntry(
        { from: 'app1', to: 'app2', type: 'custom', body: 'hello world' },
        1000
      );
      expect(entry).not.toBeNull();
      expect(entry.from).toBe('app1');
      expect(entry.to).toBe('app2');
      expect(entry.type).toBe('custom');
      expect(entry.timestamp).toBe(1000);
      expect(entry.summary).toBe('hello world');
    });

    it('should truncate long body in summary', () => {
      const longBody = 'a'.repeat(100);
      const entry = createMessageLogEntry(
        { from: 'app1', to: 'app2', type: 'custom', body: longBody },
        1000
      );
      expect(entry.summary.length).toBeLessThanOrEqual(53);
    });

    it('should add entry to front of logs and limit count', () => {
      let logs = [];
      for (let i = 0; i < 150; i++) {
        const entry = createMessageLogEntry(
          { from: `app${i}`, to: 'target', type: 'custom', body: `msg ${i}` },
          i
        );
        logs = addMessageLog(logs, entry, MAX_MESSAGE_LOGS);
      }
      expect(logs.length).toBe(MAX_MESSAGE_LOGS);
      expect(logs[0].from).toBe('app149');
    });

    it('should not add null entry', () => {
      const logs = addMessageLog([], null);
      expect(logs).toEqual([]);
    });
  });

  describe('simulateResourceLoad', () => {
    it('should simulate successful load when no failures', () => {
      const result = simulateResourceLoad(
        ['a.js', 'b.css', 'c.png'],
        { deterministic: true, failProbability: 0 }
      );
      expect(result.success).toBe(true);
      expect(result.failedResources).toEqual([]);
      expect(result.results).toHaveLength(3);
      expect(result.results.every((r) => r.success)).toBe(true);
      expect(typeof result.totalDuration).toBe('number');
      expect(result.totalDuration).toBeGreaterThan(0);
    });

    it('should simulate failures when probability is 1', () => {
      const result = simulateResourceLoad(
        ['a.js', 'b.css'],
        { deterministic: true, failProbability: 1 }
      );
      expect(result.success).toBe(false);
      expect(result.failedResources).toHaveLength(2);
      expect(result.results.every((r) => !r.success)).toBe(true);
    });

    it('should handle specific forced failures by index', () => {
      const result = simulateResourceLoad(
        ['a.js', 'b.css', 'c.png'],
        { forceFail: [1] }
      );
      expect(result.success).toBe(false);
      expect(result.failedResources).toEqual(['b.css']);
      expect(result.results[0].success).toBe(true);
      expect(result.results[1].success).toBe(false);
      expect(result.results[2].success).toBe(true);
    });

    it('should handle empty resource list', () => {
      const result = simulateResourceLoad([]);
      expect(result.success).toBe(true);
      expect(result.results).toEqual([]);
      expect(result.totalDuration).toBe(0);
    });

    it('should include cumulative delay in each result', () => {
      const result = simulateResourceLoad(
        ['a.js', 'b.css'],
        { deterministic: true, failProbability: 0 }
      );
      expect(result.results[1].cumulativeDelay).toBe(
        result.results[0].delay + result.results[1].delay
      );
    });
  });

  describe('hash routing helpers', () => {
    it('should parse active app id from hash', () => {
      expect(getInitialActiveAppFromHash('#/user-mgmt', ['user-mgmt', 'data-report'])).toBe('user-mgmt');
      expect(getInitialActiveAppFromHash('#/data-report', ['user-mgmt', 'data-report'])).toBe('data-report');
    });

    it('should return null for unknown app id in hash', () => {
      expect(getInitialActiveAppFromHash('#/unknown-app', ['user-mgmt'])).toBeNull();
    });

    it('should return null for empty hash', () => {
      expect(getInitialActiveAppFromHash('#/', ['app1'])).toBeNull();
      expect(getInitialActiveAppFromHash('', ['app1'])).toBeNull();
    });

    it('should build hash for app id', () => {
      expect(buildHashForApp('user-mgmt')).toBe('#/user-mgmt');
      expect(buildHashForApp('')).toBe('#/');
    });
  });
});

describe('micro-frontend/lifecycle', () => {
  const baseApp = createMicroApp({ name: 'App', appId: 'app', entryPath: '/app' });

  describe('lifecycle manager basics', () => {
    it('should create empty lifecycle manager', () => {
      const mgr = createLifecycleManager();
      expect(mgr.activeStages.size).toBe(0);
    });

    it('should begin and complete lifecycle stage', () => {
      let mgr = createLifecycleManager();
      mgr = beginLifecycleStage(mgr, 'app1', LIFECYCLE_STAGES.BOOTSTRAP, 1000);
      expect(mgr.activeStages.has('app1')).toBe(true);
      expect(mgr.activeStages.get('app1').stage).toBe(LIFECYCLE_STAGES.BOOTSTRAP);
      expect(mgr.activeStages.get('app1').startTime).toBe(1000);

      const result = completeLifecycleStage(mgr, 'app1', 1150);
      expect(result.duration).toBe(150);
      expect(result.stage).toBe(LIFECYCLE_STAGES.BOOTSTRAP);
      expect(result.manager.activeStages.has('app1')).toBe(false);
    });
  });

  describe('full app lifecycle flow', () => {
    it('should go through bootstrap -> mount -> ready -> unmount', () => {
      let mgr = createLifecycleManager();
      let app = { ...baseApp };
      const t0 = 1000;

      const bootResult = bootstrapApp(app, mgr, t0);
      expect(bootResult.error).toBeNull();
      expect(bootResult.app.status).toBe(APP_STATUS.BOOTSTRAPPING);
      app = bootResult.app;
      mgr = bootResult.manager;

      const bootFinish = finishBootstrapApp(app, mgr, t0 + 200);
      expect(bootFinish.app.status).toBe(APP_STATUS.MOUNTING);
      expect(bootFinish.duration).toBe(200);
      expect(bootFinish.app.lifecycle.stages[0].stage).toBe(LIFECYCLE_STAGES.BOOTSTRAP);
      expect(bootFinish.app.lifecycle.stages[0].duration).toBe(200);
      app = bootFinish.app;
      mgr = bootFinish.manager;

      const mountFinish = finishMountApp(app, mgr, t0 + 200 + 150);
      expect(mountFinish.app.status).toBe(APP_STATUS.RUNNING);
      expect(mountFinish.duration).toBe(150);
      const stages = mountFinish.app.lifecycle.stages.map((s) => s.stage);
      expect(stages).toContain(LIFECYCLE_STAGES.BOOTSTRAP);
      expect(stages).toContain(LIFECYCLE_STAGES.MOUNT);
      expect(stages).toContain(LIFECYCLE_STAGES.READY);
      app = mountFinish.app;
      mgr = mountFinish.manager;

      const unmountResult = unmountApp(app, mgr, t0 + 2000);
      expect(unmountResult.error).toBeNull();
      expect(unmountResult.app.status).toBe(APP_STATUS.UNMOUNTING);
      app = unmountResult.app;
      mgr = unmountResult.manager;

      const unmountFinish = finishUnmountApp(app, mgr, t0 + 2000 + 80);
      expect(unmountFinish.app.status).toBe(APP_STATUS.STOPPED);
      expect(unmountFinish.duration).toBe(80);
      expect(unmountFinish.app.lifecycle.stages.map((s) => s.stage)).toContain(LIFECYCLE_STAGES.UNMOUNT);
    });
  });

  describe('resource loading flow', () => {
    it('should mark success when all resources load', () => {
      let mgr = createLifecycleManager();
      let app = { ...baseApp };
      const start = startLoadingResources(app, mgr, 1000);
      expect(start.error).toBeNull();
      expect(start.app.status).toBe(APP_STATUS.LOADING);
      expect(start.manager.activeStages.has(app.id)).toBe(true);
      expect(start.manager.activeStages.get(app.id).stage).toBe(LIFECYCLE_STAGES.LOADING);
      mgr = start.manager;

      const loadResult = simulateResourceLoad([], { failProbability: 0 });
      const finish = finishLoadingResources(start.app, mgr, loadResult, 1500);
      expect(finish.error).toBeNull();
      expect(finish.app.failedResources).toEqual([]);
      expect(finish.duration).toBe(500);
      const loadingStages = finish.app.lifecycle.stages.filter((s) => s.stage === LIFECYCLE_STAGES.LOADING);
      expect(loadingStages).toHaveLength(1);
      expect(loadingStages[0].duration).toBe(500);
      expect(loadingStages[0].timestamp).toBe(1500);
    });

    it('should set LOAD_FAILED status when resources fail and still record loading stage', () => {
      let mgr = createLifecycleManager();
      let app = { ...baseApp };
      const start = startLoadingResources(app, mgr, 1000);
      mgr = start.manager;
      const loadResult = simulateResourceLoad(['a.js'], { forceFail: true });
      const finish = finishLoadingResources(start.app, mgr, loadResult, 1800);
      expect(finish.error).toBeNull();
      expect(finish.app.status).toBe(APP_STATUS.LOAD_FAILED);
      expect(finish.app.failedResources).toEqual(['a.js']);
      expect(finish.duration).toBe(800);
      const loadingStages = finish.app.lifecycle.stages.filter((s) => s.stage === LIFECYCLE_STAGES.LOADING);
      expect(loadingStages).toHaveLength(1);
      expect(loadingStages[0].duration).toBe(800);
    });

    it('startLoadingResources requires manager', () => {
      const app = { ...baseApp };
      const result = startLoadingResources(app);
      expect(result.error).toBe('生命周期管理器不存在');
    });

    it('finishLoadingResources requires manager', () => {
      const app = { ...baseApp };
      const result = finishLoadingResources(app, null, { success: true });
      expect(result.error).toBe('生命周期管理器不存在');
    });
  });

  describe('reset helpers', () => {
    it('should reset failed app to stopped and clear old lifecycle data', () => {
      const failedApp = {
        ...baseApp,
        status: APP_STATUS.LOAD_FAILED,
        failedResources: ['a.js'],
        lifecycle: {
          stages: [{ stage: LIFECYCLE_STAGES.LOADING, duration: 300, timestamp: 1000 }],
          currentStage: null,
        },
      };
      const result = resetFailedApp(failedApp);
      expect(result.error).toBeNull();
      expect(result.app.status).toBe(APP_STATUS.STOPPED);
      expect(result.app.failedResources).toEqual([]);
      expect(result.app.lifecycle.stages).toEqual([]);
      expect(result.app.lifecycle.currentStage).toBeNull();
    });

    it('resetFailedApp handles app without lifecycle field gracefully', () => {
      const failedApp = {
        ...baseApp,
        status: APP_STATUS.LOAD_FAILED,
        failedResources: ['a.js'],
      };
      delete failedApp.lifecycle;
      const result = resetFailedApp(failedApp);
      expect(result.error).toBeNull();
      expect(result.app.status).toBe(APP_STATUS.STOPPED);
      expect(result.app.failedResources).toEqual([]);
      expect(result.app.lifecycle.stages).toEqual([]);
      expect(result.app.lifecycle.currentStage).toBeNull();
    });

    it('should not reset app that is not failed', () => {
      const runningApp = { ...baseApp, status: APP_STATUS.RUNNING };
      const result = resetFailedApp(runningApp);
      expect(result.error).toBeTruthy();
    });

    it('retry after load failure results in only one loading stage', () => {
      let mgr = createLifecycleManager();
      let app = { ...baseApp };

      // 第一次加载：失败
      const start1 = startLoadingResources(app, mgr, 1000);
      mgr = start1.manager;
      const failResult = simulateResourceLoad(['a.js'], { forceFail: true });
      const finish1 = finishLoadingResources(start1.app, mgr, failResult, 1300);
      mgr = finish1.manager;
      expect(finish1.app.status).toBe(APP_STATUS.LOAD_FAILED);
      expect(finish1.app.lifecycle.stages).toHaveLength(1);
      expect(finish1.app.lifecycle.stages[0].stage).toBe(LIFECYCLE_STAGES.LOADING);
      expect(finish1.app.lifecycle.stages[0].duration).toBe(300);

      // resetFailedApp 清除旧的 lifecycle 数据
      const reset = resetFailedApp(finish1.app);
      expect(reset.error).toBeNull();
      expect(reset.app.lifecycle.stages).toEqual([]);

      // 第二次加载：重试并成功
      const start2 = startLoadingResources(reset.app, mgr, 2000);
      mgr = start2.manager;
      const successResult = simulateResourceLoad(['a.js'], { failProbability: 0 });
      const finish2 = finishLoadingResources(start2.app, mgr, successResult, 2600);
      expect(finish2.error).toBeNull();
      expect(finish2.app.lifecycle.stages).toHaveLength(1);
      expect(finish2.app.lifecycle.stages[0].stage).toBe(LIFECYCLE_STAGES.LOADING);
      expect(finish2.app.lifecycle.stages[0].duration).toBe(600);
    });

    it('resetAppForRestart preserves loading stage but clears later stages', () => {
      const appWithLifecycle = {
        ...baseApp,
        status: APP_STATUS.RUNNING,
        failedResources: ['a.js'],
        lifecycle: {
          stages: [
            { stage: 'loading', duration: 500, timestamp: 1000 },
            { stage: 'bootstrap', duration: 100, timestamp: 2000 },
            { stage: 'mount', duration: 80, timestamp: 3000 },
            { stage: 'ready', duration: 0, timestamp: 3000 },
          ],
          currentStage: 'ready',
        },
      };
      const reset = resetAppForRestart(appWithLifecycle);
      expect(reset.status).toBe(APP_STATUS.STOPPED);
      expect(reset.failedResources).toEqual([]);
      const keptStages = reset.lifecycle.stages.map((s) => s.stage);
      expect(keptStages).toEqual(['loading']);
      expect(reset.lifecycle.stages[0].duration).toBe(500);
      expect(reset.lifecycle.currentStage).toBeNull();
    });

    it('resetAppForRestart handles no lifecycle stages gracefully', () => {
      const plain = {
        ...baseApp,
        status: APP_STATUS.RUNNING,
        failedResources: [],
      };
      const reset = resetAppForRestart(plain);
      expect(reset.status).toBe(APP_STATUS.STOPPED);
      expect(reset.lifecycle.stages).toEqual([]);
      expect(reset.lifecycle.currentStage).toBeNull();
    });
  });
});

describe('micro-frontend/eventBus', () => {
  let bus;

  beforeEach(() => {
    bus = createEventBus();
  });

  afterEach(() => {
    bus.clear();
  });

  it('should create event bus instance', () => {
    expect(bus).toBeInstanceOf(EventBus);
  });

  it('should register and unregister apps', () => {
    expect(bus.registerApp('app1', { postMessage: () => {} })).toBe(true);
    expect(bus.hasApp('app1')).toBe(true);
    expect(bus.getAppIds()).toEqual(['app1']);

    expect(bus.unregisterApp('app1')).toBe(true);
    expect(bus.hasApp('app1')).toBe(false);
    expect(bus.getAppIds()).toEqual([]);
  });

  it('should deliver message to single target', () => {
    const received = [];
    const mockWindow = { postMessage: (msg) => received.push(msg) };
    bus.registerApp('app1', mockWindow);
    bus.registerApp('app2', { postMessage: () => {} });

    const result = bus.sendTo('app2', 'app1', 'hello', 'custom');
    expect(result.targets).toEqual(['app1']);
    expect(received).toHaveLength(1);
    expect(received[0].body).toBe('hello');
  });

  it('should broadcast message to all apps except sender', () => {
    const received1 = [];
    const received2 = [];
    const received3 = [];
    bus.registerApp('app1', { postMessage: (msg) => received1.push(msg) });
    bus.registerApp('app2', { postMessage: (msg) => received2.push(msg) });
    bus.registerApp('app3', { postMessage: (msg) => received3.push(msg) });

    const result = bus.broadcast('app1', 'broadcast msg');
    expect(result.targets.sort()).toEqual(['app2', 'app3']);
    expect(received1).toHaveLength(0);
    expect(received2).toHaveLength(1);
    expect(received3).toHaveLength(1);
  });

  it('should notify onMessage subscribers', () => {
    const messages = [];
    const unsub = bus.onMessage('app1', (msg) => messages.push(msg));
    bus.registerApp('app1', { postMessage: () => {} });
    bus.registerApp('app2', { postMessage: () => {} });

    bus.sendTo('app2', 'app1', 'test');
    expect(messages).toHaveLength(1);
    expect(messages[0].body).toBe('test');

    unsub();
    bus.sendTo('app2', 'app1', 'test2');
    expect(messages).toHaveLength(1);
  });

  it('should notify onLog subscribers with log entries', () => {
    const logs = [];
    const unsub = bus.onLog((entry) => logs.push(entry));
    bus.registerApp('app1', { postMessage: () => {} });
    bus.registerApp('app2', { postMessage: () => {} });

    bus.sendTo('app1', 'app2', 'hello');
    expect(logs).toHaveLength(1);
    expect(logs[0].from).toBe('app1');
    expect(logs[0].to).toBe('app2');

    unsub();
    bus.sendTo('app1', 'app2', 'hello2');
    expect(logs).toHaveLength(1);
  });

  it('should return null for invalid publish', () => {
    expect(bus.publish(null)).toBeNull();
    expect(bus.publish({ from: 'app1' })).toBeNull();
  });

  it('should clear all state', () => {
    bus.registerApp('app1', { postMessage: () => {} });
    const logs = [];
    bus.onLog((e) => logs.push(e));
    const messages = [];
    bus.onMessage('app1', (m) => messages.push(m));

    bus.clear();
    expect(bus.getAppIds()).toEqual([]);
  });

  describe('register/unregister symmetry', () => {
    it('should remove app from registry on unregister', () => {
      bus.registerApp('app1', { postMessage: () => {} });
      bus.registerApp('app2', { postMessage: () => {} });
      expect(bus.getAppIds()).toEqual(['app1', 'app2']);
      expect(bus.hasApp('app1')).toBe(true);

      const unregistered = bus.unregisterApp('app1');
      expect(unregistered).toBe(true);
      expect(bus.hasApp('app1')).toBe(false);
      expect(bus.getAppIds()).toEqual(['app2']);
    });

    it('should return false when unregistering non-existent app', () => {
      expect(bus.unregisterApp('nonexistent')).toBe(false);
    });

    it('should not attempt message delivery after unregister', () => {
      const received = [];
      const mockWindow = { postMessage: (msg) => received.push(msg) };
      bus.registerApp('app1', mockWindow);
      bus.registerApp('app2', { postMessage: () => {} });

      bus.unregisterApp('app1');
      bus.sendTo('app2', 'app1', 'hello');
      expect(received).toHaveLength(0);
    });

    it('should register apps in idempotent way (latest wins)', () => {
      const firstWindow = { postMessage: () => {} };
      const secondWindow = { postMessage: () => {} };
      bus.registerApp('app1', firstWindow);
      bus.registerApp('app1', secondWindow);
      expect(bus.getAppIds()).toEqual(['app1']);
    });

    it('should unregister app even if multiple events registered', () => {
      const msgs1 = [];
      const msgs2 = [];
      const mockWindow = { postMessage: (m) => msgs1.push(m) };
      bus.registerApp('app1', mockWindow);
      bus.registerApp('app2', { postMessage: (m) => msgs2.push(m) });

      const unsub1 = bus.onMessage('app1', () => {});
      const unsub2 = bus.onMessage('app1', () => {});

      bus.unregisterApp('app1');
      expect(bus.getAppIds()).toEqual(['app2']);

      bus.sendTo('app2', 'app1', 'test');
      expect(msgs1).toHaveLength(0);

      unsub1();
      unsub2();
    });
  });

  describe('lifecycle event message routing', () => {
    it('should broadcast lifecycle event messages to all other apps', () => {
      const r1 = [];
      const r2 = [];
      const r3 = [];
      bus.registerApp('app1', { postMessage: (m) => r1.push(m) });
      bus.registerApp('app2', { postMessage: (m) => r2.push(m) });
      bus.registerApp('app3', { postMessage: (m) => r3.push(m) });

      const result = bus.publish({
        from: 'app1',
        to: BROADCAST_TARGET,
        type: 'lifecycle',
        body: { stage: 'bootstrap', duration: 200, timestamp: 1000 },
      });

      expect(result.targets.sort()).toEqual(['app2', 'app3']);
      expect(r1).toHaveLength(0);
      expect(r2).toHaveLength(1);
      expect(r3).toHaveLength(1);
      expect(r2[0].body.stage).toBe('bootstrap');
      expect(r2[0].body.duration).toBe(200);
    });

    it('should record lifecycle messages in log', () => {
      const logs = [];
      bus.onLog((entry) => logs.push(entry));
      bus.registerApp('app1', { postMessage: () => {} });
      bus.registerApp('app2', { postMessage: () => {} });

      bus.publish({
        from: 'app1',
        to: BROADCAST_TARGET,
        type: 'lifecycle',
        body: { stage: 'ready', duration: 0, timestamp: 1000 },
      });

      expect(logs).toHaveLength(1);
      expect(logs[0].type).toBe('lifecycle');
      expect(logs[0].from).toBe('app1');
      expect(logs[0].to).toBe(BROADCAST_TARGET);
      expect(logs[0].summary).toContain('ready');
    });

    it('should handle multiple lifecycle events in sequence', () => {
      const logs = [];
      bus.onLog((entry) => logs.push(entry));
      bus.registerApp('app1', { postMessage: () => {} });
      bus.registerApp('app2', { postMessage: () => {} });

      const stages = [
        { stage: 'bootstrap', duration: 250 },
        { stage: 'mount', duration: 180 },
        { stage: 'ready', duration: 0 },
      ];

      stages.forEach((s) => {
        bus.publish({
          from: 'app1',
          to: BROADCAST_TARGET,
          type: 'lifecycle',
          body: { ...s, timestamp: Date.now() },
        });
      });

      expect(logs).toHaveLength(3);
      expect(logs.map((l) => l.type).every((t) => t === 'lifecycle')).toBe(true);
      expect(logs[0].summary).toContain('bootstrap');
      expect(logs[1].summary).toContain('mount');
      expect(logs[2].summary).toContain('ready');
    });

    it('should route unmount lifecycle events', () => {
      const received = [];
      bus.registerApp('app1', { postMessage: () => {} });
      bus.registerApp('app2', { postMessage: (m) => received.push(m) });

      bus.publish({
        from: 'app1',
        to: BROADCAST_TARGET,
        type: 'lifecycle',
        body: { stage: 'unmount', duration: 80, timestamp: 2000 },
      });

      expect(received).toHaveLength(1);
      expect(received[0].body.stage).toBe('unmount');
      expect(received[0].body.duration).toBe(80);
    });
  });
});

describe('micro-frontend/lifecycle - full flow with stage duration capture', () => {
  const baseApp = createMicroApp({ name: 'App', appId: 'app', entryPath: '/app' });

  it('should capture correct bootstrap stage duration', () => {
    let mgr = createLifecycleManager();
    let app = { ...baseApp };
    const t0 = 1000;

    const boot = bootstrapApp(app, mgr, t0);
    expect(boot.error).toBeNull();
    app = boot.app;
    mgr = boot.manager;

    const bootFinish = finishBootstrapApp(app, mgr, t0 + 350);
    expect(bootFinish.duration).toBe(350);
    const bootStages = bootFinish.app.lifecycle.stages.filter((s) => s.stage === LIFECYCLE_STAGES.BOOTSTRAP);
    expect(bootStages).toHaveLength(1);
    expect(bootStages[0].duration).toBe(350);
  });

  it('should capture correct mount stage duration', () => {
    let mgr = createLifecycleManager();
    let app = { ...baseApp };
    const t0 = 1000;

    const boot = bootstrapApp(app, mgr, t0);
    app = boot.app;
    mgr = boot.manager;

    const bootFinish = finishBootstrapApp(app, mgr, t0 + 100);
    app = bootFinish.app;
    mgr = bootFinish.manager;

    const mountFinish = finishMountApp(app, mgr, t0 + 100 + 220);
    expect(mountFinish.duration).toBe(220);
    const mountStages = mountFinish.app.lifecycle.stages.filter((s) => s.stage === LIFECYCLE_STAGES.MOUNT);
    expect(mountStages[0].duration).toBe(220);
    const readyStages = mountFinish.app.lifecycle.stages.filter((s) => s.stage === LIFECYCLE_STAGES.READY);
    expect(readyStages).toHaveLength(1);
  });

  it('should capture correct unmount stage duration', () => {
    let mgr = createLifecycleManager();
    let app = { ...baseApp, status: APP_STATUS.RUNNING, lifecycle: { stages: [], currentStage: null } };
    const t0 = 5000;

    const unmountResult = unmountApp(app, mgr, t0);
    app = unmountResult.app;
    mgr = unmountResult.manager;

    const finish = finishUnmountApp(app, mgr, t0 + 95);
    expect(finish.duration).toBe(95);
    const unmountStages = finish.app.lifecycle.stages.filter((s) => s.stage === LIFECYCLE_STAGES.UNMOUNT);
    expect(unmountStages).toHaveLength(1);
    expect(unmountStages[0].duration).toBe(95);
    expect(finish.app.status).toBe(APP_STATUS.STOPPED);
  });

  it('should correctly order all stages in a full start-stop cycle', () => {
    let mgr = createLifecycleManager();
    let app = { ...baseApp };
    let t = 1000;

    const boot = bootstrapApp(app, mgr, t);
    app = boot.app; mgr = boot.manager;
    t += 150;

    const bootFinish = finishBootstrapApp(app, mgr, t);
    app = bootFinish.app; mgr = bootFinish.manager;
    t += 200;

    const mountFinish = finishMountApp(app, mgr, t);
    app = mountFinish.app; mgr = mountFinish.manager;
    t += 300;

    const unmountResult = unmountApp(app, mgr, t);
    app = unmountResult.app; mgr = unmountResult.manager;
    t += 100;

    const unmountFinish = finishUnmountApp(app, mgr, t);
    app = unmountFinish.app;

    const stageNames = app.lifecycle.stages.map((s) => s.stage);
    expect(stageNames).toEqual([
      LIFECYCLE_STAGES.BOOTSTRAP,
      LIFECYCLE_STAGES.MOUNT,
      LIFECYCLE_STAGES.READY,
      LIFECYCLE_STAGES.UNMOUNT,
    ]);

    const durations = app.lifecycle.stages.map((s) => s.duration);
    expect(durations).toEqual([150, 200, 0, 100]);
  });

  it('should not have active stages left after full lifecycle completion', () => {
    let mgr = createLifecycleManager();
    let app = { ...baseApp };

    const boot = bootstrapApp(app, mgr, 1000);
    mgr = boot.manager;
    expect(mgr.activeStages.has('app')).toBe(true);

    const bootFinish = finishBootstrapApp(boot.app, mgr, 1100);
    mgr = bootFinish.manager;
    expect(mgr.activeStages.has('app')).toBe(true);

    const mountFinish = finishMountApp(bootFinish.app, mgr, 1200);
    mgr = mountFinish.manager;
    expect(mgr.activeStages.has('app')).toBe(false);

    const unmountResult = unmountApp(mountFinish.app, mgr, 1300);
    mgr = unmountResult.manager;
    expect(mgr.activeStages.has('app')).toBe(true);

    const unmountFinish = finishUnmountApp(unmountResult.app, mgr, 1400);
    mgr = unmountFinish.manager;
    expect(mgr.activeStages.has('app')).toBe(false);
  });
});

describe('micro-frontend/load-failed reset flow (non-recursive)', () => {
  it('resetFailedApp should produce app that can be started normally', () => {
    const failedApp = createMicroApp({ name: 'App', appId: 'app', entryPath: '/app' });
    failedApp.status = APP_STATUS.LOAD_FAILED;
    failedApp.failedResources = ['a.js', 'b.css'];

    const reset = resetFailedApp(failedApp);
    expect(reset.error).toBeNull();
    expect(reset.app.status).toBe(APP_STATUS.STOPPED);
    expect(reset.app.failedResources).toEqual([]);

    const loadStart = startLoadingResources(reset.app, Date.now());
    expect(loadStart.error).toBeNull();
    expect(loadStart.app.status).toBe(APP_STATUS.LOADING);
  });

  it('transition from LOAD_FAILED through STOPPED to LOADING is valid', () => {
    let app = createMicroApp({ name: 'App', appId: 'app', entryPath: '/app' });

    const toFailed = transitionStatus(app, APP_STATUS.LOADING);
    app = toFailed.app;
    const failResult = transitionStatus(app, APP_STATUS.LOAD_FAILED);
    app = failResult.app;
    expect(app.status).toBe(APP_STATUS.LOAD_FAILED);

    const toStopped = transitionStatus(app, APP_STATUS.STOPPED);
    expect(toStopped.error).toBeNull();
    app = toStopped.app;

    const toLoading = transitionStatus(app, APP_STATUS.LOADING);
    expect(toLoading.error).toBeNull();
    expect(toLoading.app.status).toBe(APP_STATUS.LOADING);
  });

  it('resetAppForRestart clears failedResources while preserving identity', () => {
    let app = createMicroApp({ name: 'Test', appId: 'test-app', entryPath: '/test', resources: ['x.js'] });
    app.status = APP_STATUS.LOAD_FAILED;
    app.failedResources = ['x.js'];
    app.lifecycle = {
      stages: [{ stage: 'bootstrap', duration: 50, timestamp: 1000 }],
      currentStage: 'bootstrap',
    };
    const originalId = app.id;
    const originalName = app.name;

    const reset = resetAppForRestart(app);
    expect(reset.id).toBe(originalId);
    expect(reset.name).toBe(originalName);
    expect(reset.status).toBe(APP_STATUS.STOPPED);
    expect(reset.failedResources).toEqual([]);
    expect(reset.lifecycle.stages).toEqual([]);
    expect(reset.lifecycle.currentStage).toBeNull();
  });
});

describe('micro-frontend/loading - timestamp parameter consistency', () => {
  it('startLoadingResources accepts timestamp parameter without error', () => {
    const mgr = createLifecycleManager();
    const app = createMicroApp({ name: 'App', appId: 'app', entryPath: '/app' });
    const customTs = 1234567890;
    const result = startLoadingResources(app, mgr, customTs);
    expect(result.error).toBeNull();
    expect(result.app.status).toBe(APP_STATUS.LOADING);
    expect(result.manager.activeStages.get(app.id).startTime).toBe(customTs);
  });

  it('finishLoadingResources accepts timestamp parameter without error', () => {
    const mgr = createLifecycleManager();
    const app = createMicroApp({ name: 'App', appId: 'app', entryPath: '/app' });
    const loadStart = startLoadingResources(app, mgr, 1000);
    const loadResult = simulateResourceLoad(['a.js'], { failProbability: 0 });
    const customTs = 2345678901;
    const finish = finishLoadingResources(loadStart.app, loadStart.manager, loadResult, customTs);
    expect(finish.error).toBeNull();
    expect(finish.duration).toBe(customTs - 1000);
    const loadingStage = finish.app.lifecycle.stages.find((s) => s.stage === LIFECYCLE_STAGES.LOADING);
    expect(loadingStage.timestamp).toBe(customTs);
  });

  it('finishLoadingResources handles timestamp for failed load case', () => {
    const mgr = createLifecycleManager();
    const app = createMicroApp({ name: 'App', appId: 'app', entryPath: '/app' });
    const loadStart = startLoadingResources(app, mgr, 1000);
    const loadResult = simulateResourceLoad(['a.js'], { forceFail: true });
    const customTs = 3456789012;
    const finish = finishLoadingResources(loadStart.app, loadStart.manager, loadResult, customTs);
    expect(finish.error).toBeNull();
    expect(finish.app.status).toBe(APP_STATUS.LOAD_FAILED);
    expect(finish.app.failedResources).toEqual(['a.js']);
    expect(finish.duration).toBe(customTs - 1000);
    const loadingStage = finish.app.lifecycle.stages.find((s) => s.stage === LIFECYCLE_STAGES.LOADING);
    expect(loadingStage).toBeDefined();
    expect(loadingStage.duration).toBe(customTs - 1000);
  });

  it('startLoadingResources uses default timestamp when not provided', () => {
    const mgr = createLifecycleManager();
    const app = createMicroApp({ name: 'App', appId: 'app', entryPath: '/app' });
    const before = Date.now();
    const result = startLoadingResources(app, mgr);
    const after = Date.now();
    expect(result.error).toBeNull();
    const activeStage = result.manager.activeStages.get(app.id);
    expect(activeStage.startTime).toBeGreaterThanOrEqual(before);
    expect(activeStage.startTime).toBeLessThanOrEqual(after);
  });
});

describe('micro-frontend/eventBus - error logging on delivery failures', () => {
  let bus;

  beforeEach(() => {
    bus = createEventBus();
  });

  afterEach(() => {
    bus.clear();
  });

  it('should log error when postMessage throws exception', () => {
    const logs = [];
    bus.onLog((entry) => logs.push(entry));

    const brokenWindow = {
      postMessage: () => {
        throw new Error('iframe destroyed');
      },
    };

    bus.registerApp('app1', brokenWindow);
    bus.registerApp('app2', { postMessage: () => {} });

    const result = bus.sendTo('app2', 'app1', 'test message');
    expect(result).not.toBeNull();

    const errorLogs = logs.filter((l) => l.type === 'error');
    expect(errorLogs.length).toBeGreaterThanOrEqual(1);
    expect(errorLogs[0].from).toBe('app2');
    expect(errorLogs[0].to).toBe('app1');
    expect(errorLogs[0].body.error).toContain('iframe destroyed');
  });

  it('should log error when listener callback throws', () => {
    const logs = [];
    bus.onLog((entry) => logs.push(entry));

    bus.registerApp('app1', { postMessage: () => {} });
    bus.registerApp('app2', { postMessage: () => {} });

    bus.onMessage('app1', () => {
      throw new Error('listener crashed');
    });

    bus.sendTo('app2', 'app1', 'hello');

    const errorLogs = logs.filter((l) => l.type === 'error');
    expect(errorLogs.length).toBeGreaterThanOrEqual(1);
    expect(errorLogs[0].from).toBe('app2');
    expect(errorLogs[0].to).toBe('app1');
    expect(errorLogs[0].body.error).toContain('listener crashed');
  });

  it('should log error when registered iframe lacks postMessage method', () => {
    const logs = [];
    bus.onLog((entry) => logs.push(entry));

    const badWindow = {};
    bus.registerApp('app1', badWindow);
    bus.registerApp('app2', { postMessage: () => {} });

    bus.sendTo('app2', 'app1', 'test');

    const errorLogs = logs.filter((l) => l.type === 'error');
    expect(errorLogs.length).toBeGreaterThanOrEqual(1);
    expect(errorLogs[0].body.reason).toBe('目标 iframe 缺少 postMessage 方法');
  });

  it('should emit regular message log even without errors', () => {
    const logs = [];
    bus.onLog((entry) => logs.push(entry));
    bus.registerApp('app1', { postMessage: () => {} });
    bus.registerApp('app2', { postMessage: () => {} });

    bus.sendTo('app1', 'app2', 'ok message');

    const customLogs = logs.filter((l) => l.type === 'custom');
    const errorLogs = logs.filter((l) => l.type === 'error');
    expect(customLogs).toHaveLength(1);
    expect(errorLogs).toHaveLength(0);
  });

  it('error log entries use MESSAGE_TYPE.ERROR type', () => {
    const logs = [];
    bus.onLog((entry) => logs.push(entry));

    const brokenWindow = {
      postMessage: () => { throw new Error('boom'); },
    };
    bus.registerApp('app1', brokenWindow);
    bus.registerApp('app2', { postMessage: () => {} });

    bus.sendTo('app2', 'app1', 'x');

    const errorLog = logs.find((l) => l.type === 'error');
    expect(errorLog).toBeDefined();
    expect(errorLog.id).toMatch(/^err_/);
    expect(typeof errorLog.timestamp).toBe('number');
  });

  it('error log unsubscription stops receiving error logs', () => {
    const logs = [];
    const unsub = bus.onLog((entry) => logs.push(entry));

    const broken = { postMessage: () => { throw new Error('e1'); } };
    bus.registerApp('app1', broken);
    bus.registerApp('app2', { postMessage: () => {} });

    bus.sendTo('app2', 'app1', 'msg1');
    const countAfterFirst = logs.filter((l) => l.type === 'error').length;
    expect(countAfterFirst).toBeGreaterThanOrEqual(1);

    unsub();

    bus.sendTo('app2', 'app1', 'msg2');
    expect(logs.filter((l) => l.type === 'error').length).toBe(countAfterFirst);
  });
});
