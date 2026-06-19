import { routeMessage, createMessageLogEntry } from './utils.js';
import { BROADCAST_TARGET } from './constants.js';

export class EventBus {
  constructor() {
    this._listeners = new Map();
    this._logListeners = new Set();
    this._apps = new Map();
  }

  registerApp(appId, iframeWindow) {
    if (!appId) return false;
    this._apps.set(appId, iframeWindow);
    return true;
  }

  unregisterApp(appId) {
    if (!appId) return false;
    return this._apps.delete(appId);
  }

  getAppIds() {
    return Array.from(this._apps.keys());
  }

  hasApp(appId) {
    return this._apps.has(appId);
  }

  onMessage(appId, callback) {
    if (!appId || typeof callback !== 'function') return () => {};
    if (!this._listeners.has(appId)) {
      this._listeners.set(appId, new Set());
    }
    this._listeners.get(appId).add(callback);
    return () => {
      const set = this._listeners.get(appId);
      if (set) set.delete(callback);
    };
  }

  onLog(callback) {
    if (typeof callback !== 'function') return () => {};
    this._logListeners.add(callback);
    return () => this._logListeners.delete(callback);
  }

  publish(message) {
    if (!message || !message.from || !message.to) return null;

    const targets = routeMessage(message, this.getAppIds());
    const logEntry = createMessageLogEntry(message);

    this._logListeners.forEach((cb) => {
      try { cb(logEntry); } catch (err) { void err; }
    });

    targets.forEach((targetId) => {
      const iframeWindow = this._apps.get(targetId);
      if (iframeWindow && typeof iframeWindow.postMessage === 'function') {
        try {
          iframeWindow.postMessage(message, '*');
        } catch (err) { void err; }
      }

      const listeners = this._listeners.get(targetId);
      if (listeners) {
        listeners.forEach((cb) => {
          try { cb(message); } catch (err) { void err; }
        });
      }
    });

    return { logEntry, targets };
  }

  broadcast(from, body, type = 'custom') {
    return this.publish({
      from,
      to: BROADCAST_TARGET,
      type,
      body,
    });
  }

  sendTo(from, to, body, type = 'custom') {
    return this.publish({
      from,
      to,
      type,
      body,
    });
  }

  clear() {
    this._listeners.clear();
    this._logListeners.clear();
    this._apps.clear();
  }
}

export function createEventBus() {
  return new EventBus();
}
