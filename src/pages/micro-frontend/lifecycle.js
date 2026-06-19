import {
  APP_STATUS,
  LIFECYCLE_STAGES,
} from './constants.js';
import {
  transitionStatus,
  addLifecycleStage,
  simulateResourceLoad,
} from './utils.js';

export function createLifecycleManager() {
  return {
    activeStages: new Map(),
  };
}

export function beginLifecycleStage(manager, appId, stage, timestamp = Date.now()) {
  if (!manager || !appId || !stage) return manager;
  const activeStages = new Map(manager.activeStages);
  activeStages.set(appId, { stage, startTime: timestamp });
  return { ...manager, activeStages };
}

export function completeLifecycleStage(manager, appId, timestamp = Date.now()) {
  if (!manager || !appId) return { manager, duration: 0 };
  const active = manager.activeStages.get(appId);
  if (!active) return { manager, duration: 0 };
  const duration = Math.max(0, timestamp - active.startTime);
  const activeStages = new Map(manager.activeStages);
  activeStages.delete(appId);
  return { manager: { ...manager, activeStages }, duration, stage: active.stage };
}

export function bootstrapApp(app, manager, timestamp = Date.now()) {
  if (!app) return { app, manager, error: '应用不存在' };
  const result = transitionStatus(app, APP_STATUS.BOOTSTRAPPING);
  if (result.error) return { app, manager, error: result.error };
  const newManager = beginLifecycleStage(manager, app.id, LIFECYCLE_STAGES.BOOTSTRAP, timestamp);
  return { app: result.app, manager: newManager, error: null };
}

export function finishBootstrapApp(app, manager, timestamp = Date.now()) {
  if (!app) return { app, manager, duration: 0 };
  const { manager: newManager, duration } = completeLifecycleStage(manager, app.id, timestamp);
  const result = transitionStatus(app, APP_STATUS.MOUNTING);
  if (result.error) return { app, manager: newManager, duration: 0 };
  const appWithStage = addLifecycleStage(result.app, LIFECYCLE_STAGES.BOOTSTRAP, duration, timestamp);
  const managerWithMount = beginLifecycleStage(newManager, app.id, LIFECYCLE_STAGES.MOUNT, timestamp);
  return { app: appWithStage, manager: managerWithMount, duration };
}

export function finishMountApp(app, manager, timestamp = Date.now()) {
  if (!app) return { app, manager, duration: 0 };
  const { manager: newManager, duration } = completeLifecycleStage(manager, app.id, timestamp);
  const result = transitionStatus(app, APP_STATUS.RUNNING);
  if (result.error) return { app, manager: newManager, duration: 0 };
  const appWithMount = addLifecycleStage(result.app, LIFECYCLE_STAGES.MOUNT, duration, timestamp);
  const appWithReady = addLifecycleStage(appWithMount, LIFECYCLE_STAGES.READY, 0, timestamp);
  return { app: appWithReady, manager: newManager, duration };
}

export function unmountApp(app, manager, timestamp = Date.now()) {
  if (!app) return { app, manager, error: '应用不存在' };
  const result = transitionStatus(app, APP_STATUS.UNMOUNTING);
  if (result.error) return { app, manager, error: result.error };
  const newManager = beginLifecycleStage(manager, app.id, LIFECYCLE_STAGES.UNMOUNT, timestamp);
  return { app: result.app, manager: newManager, error: null };
}

export function finishUnmountApp(app, manager, timestamp = Date.now()) {
  if (!app) return { app, manager, duration: 0 };
  const { manager: newManager, duration } = completeLifecycleStage(manager, app.id, timestamp);
  const result = transitionStatus(app, APP_STATUS.STOPPED);
  if (result.error) return { app, manager: newManager, duration: 0 };
  const appWithStage = addLifecycleStage(result.app, LIFECYCLE_STAGES.UNMOUNT, duration, timestamp);
  return { app: appWithStage, manager: newManager, duration };
}

export function startLoadingResources(app, manager, timestamp = Date.now()) {
  if (!app) return { app, manager, error: '应用不存在' };
  if (!manager) return { app, manager, error: '生命周期管理器不存在' };
  const result = transitionStatus(app, APP_STATUS.LOADING);
  if (result.error) return { app, manager, error: result.error };
  const newManager = beginLifecycleStage(manager, app.id, LIFECYCLE_STAGES.LOADING, timestamp);
  return {
    app: { ...result.app, failedResources: [] },
    manager: newManager,
    error: null,
  };
}

export function finishLoadingResources(app, manager, loadResult, timestamp = Date.now()) {
  if (!app) return { app, manager, duration: 0, error: '应用不存在' };
  if (!manager) return { app, manager, duration: 0, error: '生命周期管理器不存在' };
  if (!loadResult) return { app, manager, duration: 0, error: '加载结果为空' };

  const { manager: newManager, duration } = completeLifecycleStage(manager, app.id, timestamp);
  const appWithStage = addLifecycleStage(app, LIFECYCLE_STAGES.LOADING, duration, timestamp);

  if (!loadResult.success) {
    const failedResult = transitionStatus(appWithStage, APP_STATUS.LOAD_FAILED);
    if (failedResult.error) return { app, manager, duration: 0, error: failedResult.error };
    return {
      app: {
        ...failedResult.app,
        failedResources: loadResult.failedResources || [],
      },
      manager: newManager,
      duration,
      error: null,
    };
  }

  return { app: appWithStage, manager: newManager, duration, error: null };
}

export function resetFailedApp(app) {
  if (!app) return { app, error: '应用不存在' };
  if (app.status !== APP_STATUS.LOAD_FAILED) {
    return { app, error: '当前应用未处于加载失败状态' };
  }
  return {
    app: {
      ...app,
      status: APP_STATUS.STOPPED,
      failedResources: [],
      lifecycle: {
        stages: [],
        currentStage: null,
      },
    },
    error: null,
  };
}

export function resetAppForRestart(app) {
  if (!app) return app;
  const stages = (app.lifecycle?.stages || []).filter(
    (s) => s.stage === LIFECYCLE_STAGES.LOADING
  );
  const currentStage =
    app.lifecycle?.currentStage === LIFECYCLE_STAGES.LOADING
      ? app.lifecycle.currentStage
      : null;
  return {
    ...app,
    status: APP_STATUS.STOPPED,
    failedResources: [],
    lifecycle: {
      stages,
      currentStage,
    },
  };
}

export { simulateResourceLoad };
