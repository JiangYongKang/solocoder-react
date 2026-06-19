export const APP_STATUS = {
  STOPPED: 'stopped',
  BOOTSTRAPPING: 'bootstrapping',
  MOUNTING: 'mounting',
  RUNNING: 'running',
  UNMOUNTING: 'unmounting',
  LOADING: 'loading',
  LOAD_FAILED: 'load_failed',
};

export const APP_STATUS_LABELS = {
  [APP_STATUS.STOPPED]: '已停止',
  [APP_STATUS.BOOTSTRAPPING]: '启动中',
  [APP_STATUS.MOUNTING]: '挂载中',
  [APP_STATUS.RUNNING]: '运行中',
  [APP_STATUS.UNMOUNTING]: '卸载中',
  [APP_STATUS.LOADING]: '加载中',
  [APP_STATUS.LOAD_FAILED]: '加载失败',
};

export const LIFECYCLE_STAGES = {
  BOOTSTRAP: 'bootstrap',
  MOUNT: 'mount',
  READY: 'ready',
  UNMOUNT: 'unmount',
};

export const LIFECYCLE_STAGE_LABELS = {
  [LIFECYCLE_STAGES.BOOTSTRAP]: 'bootstrap',
  [LIFECYCLE_STAGES.MOUNT]: 'mount',
  [LIFECYCLE_STAGES.READY]: 'ready',
  [LIFECYCLE_STAGES.UNMOUNT]: 'unmount',
};

export const MESSAGE_TYPE = {
  CUSTOM: 'custom',
  BROADCAST: 'broadcast',
  LIFECYCLE: 'lifecycle',
};

export const HOME_APP_ID = '__home__';
export const BROADCAST_TARGET = 'all';
export const MAX_MESSAGE_LOGS = 100;

export const RESOURCE_FAIL_PROBABILITY = 0.1;
export const RESOURCE_MIN_DELAY = 300;
export const RESOURCE_MAX_DELAY = 800;

export const APP_ID_PATTERN = /^[a-z][a-z0-9-]*$/;
export const VERSION_PATTERN = /^(\d+)\.(\d+)\.(\d+)$/;
