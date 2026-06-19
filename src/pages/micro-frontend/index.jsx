import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import './micro-frontend.css';

import {
  APP_STATUS,
  APP_STATUS_LABELS,
  HOME_APP_ID,
  MAX_MESSAGE_LOGS,
} from './constants.js';

import {
  createMicroApp,
  upgradeAppVersion,
  addMessageLog,
  generateMicroAppHtml,
  simulateResourceLoad,
  formatDateTime,
  getInitialActiveAppFromHash,
  buildHashForApp,
} from './utils.js';

import {
  createLifecycleManager,
  bootstrapApp,
  finishBootstrapApp,
  finishMountApp,
  unmountApp,
  finishUnmountApp,
  startLoadingResources,
  finishLoadingResources,
  resetFailedApp,
  resetAppForRestart,
} from './lifecycle.js';

import { createEventBus } from './eventBus.js';

import {
  RegisterForm,
  UpgradeModal,
  LifecycleSteps,
  VersionHistory,
} from './components.jsx';

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export default function MicroFrontendSandbox() {
  const navigate = useNavigate();

  const [apps, setApps] = useState([]);
  const [activeAppId, setActiveAppId] = useState(HOME_APP_ID);
  const [messageLogs, setMessageLogs] = useState([]);
  const [selectedDetailId, setSelectedDetailId] = useState(null);
  const [upgradeTargetId, setUpgradeTargetId] = useState(null);
  const [loadProgress, setLoadProgress] = useState({});

  const eventBusRef = useRef(null);
  const lifecycleManagerRef = useRef(createLifecycleManager());
  const iframeRefs = useRef({});
  const loadTimersRef = useRef({});

  if (!eventBusRef.current) {
    eventBusRef.current = createEventBus();
  }

  const appIds = useMemo(() => apps.map((a) => a.id), [apps]);

  useEffect(() => {
    const bus = eventBusRef.current;
    const unsub = bus.onLog((entry) => {
      setMessageLogs((prev) => addMessageLog(prev, entry, MAX_MESSAGE_LOGS));
    });
    return unsub;
  }, []);

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      const fromHash = getInitialActiveAppFromHash(hash, appIds);
      if (fromHash) {
        setActiveAppId(fromHash);
      } else if (!hash || hash === '#/') {
        setActiveAppId(HOME_APP_ID);
      }
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [appIds]);

  useEffect(() => {
    if (activeAppId === HOME_APP_ID) {
      if (window.location.hash !== '#/') {
        window.history.replaceState(null, '', buildHashForApp(''));
      }
    } else {
      const expected = buildHashForApp(activeAppId);
      if (window.location.hash !== expected) {
        window.history.replaceState(null, '', expected);
      }
    }
  }, [activeAppId]);

  useEffect(() => {
    const handlePostMessage = (e) => {
      const data = e.data;
      if (!data || typeof data !== 'object') return;

      if (data.type === '__get_apps__') {
        const source = e.source;
        if (source && typeof source.postMessage === 'function') {
          source.postMessage({ type: '__app_list__', apps: appIds }, '*');
        }
        return;
      }

      if (data.from && data.to && (data.type || data.body !== undefined)) {
        eventBusRef.current.publish(data);
      }
    };

    window.addEventListener('message', handlePostMessage);
    return () => window.removeEventListener('message', handlePostMessage);
  }, [appIds]);

  useEffect(() => {
    return () => {
      Object.values(loadTimersRef.current).forEach(clearTimeout);
      eventBusRef.current?.clear();
    };
  }, []);

  const handleRegister = useCallback(({ name, appId, entryPath, resources }) => {
    const newApp = createMicroApp({ name, appId, entryPath, resources });
    if (!newApp) return;
    setApps((prev) => [...prev, newApp]);
  }, []);

  const handleStartApp = useCallback(async (appId) => {
    const app = apps.find((a) => a.id === appId);
    if (!app) return;

    if (app.status === APP_STATUS.LOAD_FAILED) {
      const resetResult = resetFailedApp(app);
      if (resetResult.error) return;
      setApps((prev) => prev.map((a) => (a.id === appId ? resetResult.app : a)));
      await handleStartApp(appId);
      return;
    }

    if (app.status !== APP_STATUS.STOPPED) return;

    const startTs = Date.now();
    const loadStart = startLoadingResources({ ...app, status: APP_STATUS.STOPPED }, startTs);
    if (loadStart.error) return;
    setApps((prev) => prev.map((a) => (a.id === appId ? loadStart.app : a)));

    setLoadProgress((prev) => ({
      ...prev,
      [appId]: { loaded: 0, total: app.resources.length, current: '', percent: 0 },
    }));

    const loadResult = simulateResourceLoad(app.resources);

    for (let i = 0; i < loadResult.results.length; i++) {
      const r = loadResult.results[i];
      await sleep(r.delay);
      setLoadProgress((prev) => {
        const loaded = i + 1;
        const total = loadResult.results.length;
        return {
          ...prev,
          [appId]: {
            loaded,
            total,
            current: r.resource,
            percent: total > 0 ? Math.round((loaded / total) * 100) : 100,
          },
        };
      });
    }

    const latestApp = apps.find((a) => a.id === appId);
    const currentApp = latestApp || app;

    setApps((prev) => {
      const prevApp = prev.find((a) => a.id === appId);
      if (!prevApp) return prev;
      const finishLoad = finishLoadingResources(prevApp, loadResult);
      if (finishLoad.error) return prev;
      return prev.map((a) => (a.id === appId ? finishLoad.app : a));
    });

    await sleep(50);

    setApps((prev) => {
      const prevApp = prev.find((a) => a.id === appId);
      if (!prevApp) return prev;
      if (prevApp.status === APP_STATUS.LOAD_FAILED) return prev;
      const resetApp = resetAppForRestart(prevApp);
      const bootResult = bootstrapApp(resetApp, lifecycleManagerRef.current, Date.now());
      if (bootResult.error) return prev;
      lifecycleManagerRef.current = bootResult.manager;
      return prev.map((a) => (a.id === appId ? bootResult.app : a));
    });

    await sleep(300 + Math.random() * 200);

    setApps((prev) => {
      const prevApp = prev.find((a) => a.id === appId);
      if (!prevApp) return prev;
      const finishBoot = finishBootstrapApp(prevApp, lifecycleManagerRef.current, Date.now());
      lifecycleManagerRef.current = finishBoot.manager;
      return prev.map((a) => (a.id === appId ? finishBoot.app : a));
    });

    await sleep(200 + Math.random() * 200);

    setApps((prev) => {
      const prevApp = prev.find((a) => a.id === appId);
      if (!prevApp) return prev;
      const finishMount = finishMountApp(prevApp, lifecycleManagerRef.current, Date.now());
      lifecycleManagerRef.current = finishMount.manager;
      const updatedApp = finishMount.app;
      return prev.map((a) => (a.id === appId ? updatedApp : a));
    });

    setLoadProgress((prev) => {
      const next = { ...prev };
      delete next[appId];
      return next;
    });
  }, [apps]);

  const handleStopApp = useCallback(async (appId) => {
    const app = apps.find((a) => a.id === appId);
    if (!app || app.status !== APP_STATUS.RUNNING) return;

    const unmountResult = unmountApp(app, lifecycleManagerRef.current, Date.now());
    if (unmountResult.error) return;
    lifecycleManagerRef.current = unmountResult.manager;
    setApps((prev) => prev.map((a) => (a.id === appId ? unmountResult.app : a)));

    await sleep(200 + Math.random() * 200);

    setApps((prev) => {
      const prevApp = prev.find((a) => a.id === appId);
      if (!prevApp) return prev;
      const finish = finishUnmountApp(prevApp, lifecycleManagerRef.current, Date.now());
      lifecycleManagerRef.current = finish.manager;
      return prev.map((a) => (a.id === appId ? finish.app : a));
    });
  }, [apps]);

  const handleUninstallApp = useCallback((appId) => {
    if (!confirm('确定要卸载该微应用吗？卸载后所有版本记录将被清除。')) return;
    setApps((prev) => prev.filter((a) => a.id !== appId));
    eventBusRef.current.unregisterApp(appId);
    delete iframeRefs.current[appId];
    if (activeAppId === appId) {
      setActiveAppId(HOME_APP_ID);
    }
    if (selectedDetailId === appId) {
      setSelectedDetailId(null);
    }
  }, [activeAppId, selectedDetailId]);

  const handleRetryLoad = useCallback((appId) => {
    handleStartApp(appId);
  }, [handleStartApp]);

  const handleUpgradeVersion = useCallback((appId, newVersion, changelog) => {
    setApps((prev) => {
      const app = prev.find((a) => a.id === appId);
      if (!app) return prev;
      const result = upgradeAppVersion(app, newVersion, changelog);
      if (result.error) {
        alert(result.error);
        return prev;
      }
      return prev.map((a) => (a.id === appId ? result.app : a));
    });
    setUpgradeTargetId(null);
  }, []);

  const handleClearLogs = useCallback(() => {
    setMessageLogs([]);
  }, []);

  const handleSelectNav = useCallback((appId) => {
    setActiveAppId(appId);
    setSelectedDetailId(null);
  }, []);

  const handleSelectSidebar = useCallback((appId) => {
    setSelectedDetailId((prev) => (prev === appId ? null : appId));
  }, []);

  const activeApp = useMemo(() => apps.find((a) => a.id === activeAppId) || null, [apps, activeAppId]);
  const selectedDetailApp = useMemo(() => apps.find((a) => a.id === selectedDetailId) || null, [apps, selectedDetailId]);
  const upgradeTargetApp = useMemo(() => apps.find((a) => a.id === upgradeTargetId) || null, [apps, upgradeTargetId]);

  const stats = useMemo(() => {
    const total = apps.length;
    const running = apps.filter((a) => a.status === APP_STATUS.RUNNING).length;
    const stopped = apps.filter((a) => a.status === APP_STATUS.STOPPED).length;
    const failed = apps.filter((a) => a.status === APP_STATUS.LOAD_FAILED).length;
    return { total, running, stopped, failed };
  }, [apps]);

  const setIframeRef = useCallback((appId, el) => {
    if (el) {
      iframeRefs.current[appId] = el;
      eventBusRef.current.registerApp(appId, el.contentWindow);
    }
  }, []);

  const renderTopNav = () => (
    <div className="mf-top-nav">
      <button
        className={`mf-nav-tab ${activeAppId === HOME_APP_ID ? 'active' : ''}`}
        onClick={() => handleSelectNav(HOME_APP_ID)}
      >
        🏠 主应用首页
      </button>
      {apps.map((app) => (
        <button
          key={app.id}
          className={`mf-nav-tab ${activeAppId === app.id ? 'active' : ''}`}
          onClick={() => handleSelectNav(app.id)}
          title={`${app.name} (${APP_STATUS_LABELS[app.status]})`}
        >
          <span className={`mf-nav-status-dot ${app.status}`} />
          {app.name}
          <span style={{ fontSize: 11, color: 'var(--text)', fontFamily: 'Consolas, monospace' }}>
            v{app.version}
          </span>
        </button>
      ))}
    </div>
  );

  const renderSidebar = () => (
    <div className="mf-sidebar">
      <div className="mf-sidebar-title">
        微应用列表
        <span style={{ fontSize: 12, fontWeight: 400, color: 'var(--text)' }}>
          {apps.length}
        </span>
      </div>
      {apps.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text)', fontSize: 13 }}>
          暂无微应用
          <br />
          请在右侧首页注册
        </div>
      ) : (
        <div className="mf-app-list">
          {apps.map((app) => (
            <div
              key={app.id}
              className={`mf-app-item ${selectedDetailId === app.id ? 'selected' : ''}`}
              onClick={() => handleSelectSidebar(app.id)}
            >
              <div className="mf-app-item-header">
                <span className="mf-app-name">{app.name}</span>
                <span className={`mf-status-tag ${app.status}`}>
                  {APP_STATUS_LABELS[app.status]}
                </span>
              </div>
              <div className="mf-app-id">ID: {app.id}</div>
              <div className="mf-app-version">版本: v{app.version}</div>
              <div className="mf-app-actions" onClick={(e) => e.stopPropagation()}>
                {(app.status === APP_STATUS.STOPPED || app.status === APP_STATUS.LOAD_FAILED) && (
                  <button
                    className="mf-btn mf-btn-sm mf-btn-primary"
                    onClick={() => handleStartApp(app.id)}
                  >
                    {app.status === APP_STATUS.LOAD_FAILED ? '重试' : '启动'}
                  </button>
                )}
                {app.status === APP_STATUS.RUNNING && (
                  <button
                    className="mf-btn mf-btn-sm"
                    onClick={() => handleStopApp(app.id)}
                  >
                    停止
                  </button>
                )}
                <button
                  className="mf-btn mf-btn-sm mf-btn-danger"
                  onClick={() => handleUninstallApp(app.id)}
                >
                  卸载
                </button>
              </div>
              {selectedDetailId === app.id && (
                <div style={{ marginTop: 12 }}>
                  <LifecycleSteps app={app} />
                  <VersionHistory app={app} onUpgradeClick={() => setUpgradeTargetId(app.id)} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderAppFrame = (app) => {
    if (!app) return null;
    const progress = loadProgress[app.id];
    const htmlSrc = generateMicroAppHtml(app);

    return (
      <div className="mf-app-frame-container">
        <div className="mf-app-frame-header">
          <div className="mf-app-frame-title">{app.name}</div>
          <div className="mf-app-frame-meta">
            <span className={`mf-status-tag ${app.status}`}>
              {APP_STATUS_LABELS[app.status]}
            </span>
            <span style={{ marginLeft: 8, fontFamily: 'Consolas, monospace' }}>
              v{app.version} · {app.entryPath}
            </span>
          </div>
        </div>
        <div className="mf-iframe-wrapper">
          {app.status === APP_STATUS.RUNNING && (
            <iframe
              ref={(el) => setIframeRef(app.id, el)}
              srcDoc={htmlSrc}
              title={app.name}
              sandbox="allow-scripts allow-same-origin"
            />
          )}
          {app.status === APP_STATUS.STOPPED && !progress && (
            <div className="mf-loading-overlay">
              <div style={{ fontSize: 48 }}>⏸️</div>
              <div style={{ fontSize: 14, color: 'var(--text-h)' }}>应用已停止</div>
              <div style={{ fontSize: 12, color: 'var(--text)' }}>
                点击左侧「启动」按钮运行该应用
              </div>
              <button
                className="mf-btn mf-btn-primary"
                onClick={() => handleStartApp(app.id)}
              >
                启动应用
              </button>
            </div>
          )}
          {(app.status === APP_STATUS.LOADING ||
            app.status === APP_STATUS.BOOTSTRAPPING ||
            app.status === APP_STATUS.MOUNTING) && (
            <div className="mf-loading-overlay">
              {progress && progress.total > 0 ? (
                <>
                  <div className="mf-loading-spinner" />
                  <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-h)' }}>
                    正在加载资源...
                  </div>
                  <div className="mf-progress-container">
                    <div className="mf-progress-bar">
                      <div
                        className="mf-progress-fill"
                        style={{ width: `${progress.percent}%` }}
                      />
                    </div>
                    <div className="mf-progress-text">
                      {progress.loaded} / {progress.total} ({progress.percent}%)
                    </div>
                    {progress.current && (
                      <div className="mf-progress-current">{progress.current}</div>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <div className="mf-loading-spinner" />
                  <div style={{ fontSize: 14, color: 'var(--text-h)' }}>
                    {app.status === APP_STATUS.BOOTSTRAPPING && '正在启动应用...'}
                    {app.status === APP_STATUS.MOUNTING && '正在挂载应用...'}
                    {app.status === APP_STATUS.LOADING && '正在加载...'}
                  </div>
                </>
              )}
            </div>
          )}
          {app.status === APP_STATUS.LOAD_FAILED && (
            <div className="mf-load-failed">
              <div className="mf-load-failed-icon">⚠️</div>
              <div className="mf-load-failed-title">资源加载失败</div>
              {app.failedResources && app.failedResources.length > 0 && (
                <div className="mf-load-failed-list">
                  <div style={{ marginBottom: 4, fontWeight: 600 }}>失败的资源：</div>
                  {app.failedResources.map((r) => (
                    <div key={r}>✗ {r}</div>
                  ))}
                </div>
              )}
              <button className="mf-btn mf-btn-primary" onClick={() => handleRetryLoad(app.id)}>
                重试加载
              </button>
            </div>
          )}
          {app.status === APP_STATUS.UNMOUNTING && (
            <div className="mf-loading-overlay">
              <div className="mf-loading-spinner" />
              <div style={{ fontSize: 14, color: 'var(--text-h)' }}>正在卸载应用...</div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderHomePanel = () => (
    <div className="mf-home-panel">
      <div className="mf-stats-grid">
        <div className="mf-stat-card">
          <div className="mf-stat-label">应用总数</div>
          <div className="mf-stat-value">{stats.total}</div>
        </div>
        <div className="mf-stat-card">
          <div className="mf-stat-label">运行中</div>
          <div className="mf-stat-value running">{stats.running}</div>
        </div>
        <div className="mf-stat-card">
          <div className="mf-stat-label">已停止</div>
          <div className="mf-stat-value">{stats.stopped}</div>
        </div>
        <div className="mf-stat-card">
          <div className="mf-stat-label">加载失败</div>
          <div className="mf-stat-value failed">{stats.failed}</div>
        </div>
      </div>

      <RegisterForm onRegister={handleRegister} existingIds={appIds} />

      <h3 className="mf-section-title">已注册应用</h3>
      {apps.length === 0 ? (
        <div className="mf-empty-home">
          <div className="mf-empty-home-icon">📦</div>
          <div className="mf-empty-home-title">还没有微应用</div>
          <div className="mf-empty-home-desc">
            使用上方的注册表单添加你的第一个微应用，体验微前端沙箱环境。
            <br />
            支持应用注册、生命周期管理、消息通信、版本管理等功能。
          </div>
        </div>
      ) : (
        <table className="mf-apps-table">
          <thead>
            <tr>
              <th>应用名称</th>
              <th>应用 ID</th>
              <th>入口路径</th>
              <th>版本</th>
              <th>状态</th>
              <th>资源数</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {apps.map((app) => (
              <AppTableRow
                key={app.id}
                app={app}
                onStart={handleStartApp}
                onStop={handleStopApp}
                onUninstall={handleUninstallApp}
                onUpgrade={() => setUpgradeTargetId(app.id)}
                onSelectDetail={() => handleSelectSidebar(app.id)}
                expanded={selectedDetailId === app.id}
              />
            ))}
          </tbody>
        </table>
      )}
    </div>
  );

  const renderLogPanel = () => (
    <div className="mf-log-panel">
      <div className="mf-log-header">
        <h3 className="mf-log-title">消息日志</h3>
        <button className="mf-btn mf-btn-sm" onClick={handleClearLogs}>
          清空
        </button>
      </div>
      <div style={{ fontSize: 12, color: 'var(--text)', marginBottom: 12 }}>
        共 {messageLogs.length} 条记录
      </div>
      {messageLogs.length === 0 ? (
        <div className="mf-log-empty">
          暂无消息
          <br />
          <span style={{ fontSize: 11 }}>启动微应用后互相发送消息</span>
        </div>
      ) : (
        <div className="mf-log-list">
          {messageLogs.map((log) => (
            <div key={log.id} className="mf-log-item">
              <div className="mf-log-time">{formatDateTime(log.timestamp)}</div>
              <div className="mf-log-fromto">
                <span className="mf-log-app">{log.from}</span>
                <span className="mf-log-arrow">→</span>
                <span className="mf-log-app">{log.to}</span>
                <span className={`mf-log-type ${log.type}`}>{log.type}</span>
              </div>
              <div className="mf-log-body">{log.summary}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="mf-page">
      <div className="mf-header">
        <div className="mf-header-left">
          <button className="back-link" onClick={() => navigate('/')}>
            ← 返回首页
          </button>
          <h1 className="mf-page-title">微前端沙箱演示</h1>
        </div>
      </div>

      {renderTopNav()}

      <div className="mf-main-container">
        {renderSidebar()}

        <div className="mf-content-area">
          {activeAppId === HOME_APP_ID ? renderHomePanel() : renderAppFrame(activeApp)}
        </div>

        {renderLogPanel()}
      </div>

      {upgradeTargetApp && (
        <UpgradeModal
          app={upgradeTargetApp}
          onClose={() => setUpgradeTargetId(null)}
          onUpgrade={handleUpgradeVersion}
        />
      )}
    </div>
  );
}

function AppTableRow({ app, onStart, onStop, onUninstall, onUpgrade, onSelectDetail, expanded }) {
  return (
    <>
      <tr>
        <td>
          <button className="mf-expand-btn" onClick={onSelectDetail}>
            {expanded ? '▼' : '▶'} {app.name}
          </button>
        </td>
        <td style={{ fontFamily: 'Consolas, monospace', fontSize: 12 }}>{app.id}</td>
        <td style={{ fontFamily: 'Consolas, monospace', fontSize: 12 }}>{app.entryPath}</td>
        <td style={{ fontFamily: 'Consolas, monospace', fontSize: 12 }}>v{app.version}</td>
        <td>
          <span className={`mf-status-tag ${app.status}`}>
            {APP_STATUS_LABELS[app.status]}
          </span>
        </td>
        <td>{app.resources.length}</td>
        <td>
          <div className="mf-actions-cell">
            {(app.status === APP_STATUS.STOPPED || app.status === APP_STATUS.LOAD_FAILED) && (
              <button
                className="mf-btn mf-btn-sm mf-btn-primary"
                onClick={() => onStart(app.id)}
              >
                {app.status === APP_STATUS.LOAD_FAILED ? '重试' : '启动'}
              </button>
            )}
            {app.status === APP_STATUS.RUNNING && (
              <button className="mf-btn mf-btn-sm" onClick={() => onStop(app.id)}>
                停止
              </button>
            )}
            <button className="mf-btn mf-btn-sm" onClick={onUpgrade}>
              升级
            </button>
            <button
              className="mf-btn mf-btn-sm mf-btn-danger"
              onClick={() => onUninstall(app.id)}
            >
              卸载
            </button>
          </div>
        </td>
      </tr>
      {expanded && (
        <tr>
          <td colSpan={7} className="mf-detail-panel">
            <LifecycleSteps app={app} />
            <VersionHistory app={app} onUpgradeClick={onUpgrade} />
          </td>
        </tr>
      )}
    </>
  );
}
