import {
  APP_STATUS,
  LIFECYCLE_STAGES,
  APP_ID_PATTERN,
  VERSION_PATTERN,
  BROADCAST_TARGET,
  RESOURCE_FAIL_PROBABILITY,
  RESOURCE_MIN_DELAY,
  RESOURCE_MAX_DELAY,
} from './constants.js';

export function generateId(prefix = '') {
  return prefix + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export function validateAppId(appId) {
  if (!appId || typeof appId !== 'string') return false;
  return APP_ID_PATTERN.test(appId);
}

export function validateVersion(version) {
  if (!version || typeof version !== 'string') return false;
  return VERSION_PATTERN.test(version);
}

export function parseVersion(version) {
  if (!validateVersion(version)) return null;
  const match = version.match(VERSION_PATTERN);
  return {
    major: parseInt(match[1], 10),
    minor: parseInt(match[2], 10),
    patch: parseInt(match[3], 10),
  };
}

export function compareVersions(v1, v2) {
  const p1 = parseVersion(v1);
  const p2 = parseVersion(v2);
  if (!p1 || !p2) return null;
  if (p1.major !== p2.major) return p1.major > p2.major ? 1 : -1;
  if (p1.minor !== p2.minor) return p1.minor > p2.minor ? 1 : -1;
  if (p1.patch !== p2.patch) return p1.patch > p2.patch ? 1 : -1;
  return 0;
}

export function formatDateTime(timestamp) {
  if (!timestamp) return '';
  const d = new Date(timestamp);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

export function formatDuration(ms) {
  if (ms == null || typeof ms !== 'number' || ms < 0) return '';
  return `${ms}ms`;
}

export function createMicroApp({ name, appId, entryPath, resources = [] }) {
  if (!name || !name.trim()) return null;
  if (!validateAppId(appId)) return null;
  if (!entryPath || !entryPath.trim()) return null;
  const now = Date.now();
  return {
    id: appId,
    name: name.trim(),
    entryPath: entryPath.trim(),
    status: APP_STATUS.STOPPED,
    version: '1.0.0',
    versionHistory: [
      {
        version: '1.0.0',
        updatedAt: now,
        changelog: '初始版本',
      },
    ],
    resources: Array.isArray(resources) ? resources : [],
    lifecycle: {
      stages: [],
      currentStage: null,
    },
    failedResources: [],
    createdAt: now,
    iframeRef: null,
  };
}

export function upgradeAppVersion(app, newVersion, changelog) {
  if (!app) return null;
  if (!validateVersion(newVersion)) return { app, error: '版本号格式不正确，应为 x.y.z 格式' };
  const cmp = compareVersions(newVersion, app.version);
  if (cmp === null) return { app, error: '版本号解析失败' };
  if (cmp <= 0) return { app, error: '新版本号必须大于当前版本号' };
  const now = Date.now();
  const updatedApp = {
    ...app,
    version: newVersion,
    versionHistory: [
      ...app.versionHistory,
      {
        version: newVersion,
        updatedAt: now,
        changelog: changelog && changelog.trim() ? changelog.trim() : '未填写更新日志',
      },
    ],
  };
  return { app: updatedApp, error: null };
}

const VALID_STATUS_TRANSITIONS = {
  [APP_STATUS.STOPPED]: [APP_STATUS.LOADING, APP_STATUS.BOOTSTRAPPING],
  [APP_STATUS.LOADING]: [APP_STATUS.BOOTSTRAPPING, APP_STATUS.LOAD_FAILED],
  [APP_STATUS.LOAD_FAILED]: [APP_STATUS.STOPPED, APP_STATUS.LOADING],
  [APP_STATUS.BOOTSTRAPPING]: [APP_STATUS.MOUNTING],
  [APP_STATUS.MOUNTING]: [APP_STATUS.RUNNING],
  [APP_STATUS.RUNNING]: [APP_STATUS.UNMOUNTING],
  [APP_STATUS.UNMOUNTING]: [APP_STATUS.STOPPED],
};

export function canTransitionStatus(currentStatus, nextStatus) {
  if (!currentStatus || !nextStatus) return false;
  const allowed = VALID_STATUS_TRANSITIONS[currentStatus];
  if (!allowed) return false;
  return allowed.includes(nextStatus);
}

export function transitionStatus(app, nextStatus) {
  if (!app) return null;
  if (!canTransitionStatus(app.status, nextStatus)) {
    return { app, error: `无法从状态 ${app.status} 转换到 ${nextStatus}` };
  }
  return { app: { ...app, status: nextStatus }, error: null };
}

export function addLifecycleStage(app, stage, durationMs, timestamp = Date.now()) {
  if (!app || !stage) return app;
  const stages = [...(app.lifecycle?.stages || [])];
  stages.push({
    stage,
    duration: durationMs,
    timestamp,
  });
  return {
    ...app,
    lifecycle: {
      stages,
      currentStage: stage,
    },
  };
}

export function clearLifecycleStages(app) {
  if (!app) return app;
  return {
    ...app,
    lifecycle: {
      stages: [],
      currentStage: null,
    },
  };
}

export function routeMessage(message, appIds) {
  if (!message || typeof message !== 'object') return [];
  const { from, to, type, body } = message;
  if (!from) return [];
  if (!to) return [];
  if (to === BROADCAST_TARGET) {
    return appIds.filter((id) => id !== from);
  }
  if (appIds.includes(to) && to !== from) {
    return [to];
  }
  return [];
}

export function createMessageLogEntry(message, timestamp = Date.now()) {
  if (!message) return null;
  return {
    id: generateId('msg_'),
    timestamp,
    from: message.from,
    to: message.to,
    type: message.type || 'custom',
    body: message.body,
    summary: typeof message.body === 'string'
      ? message.body.slice(0, 50) + (message.body.length > 50 ? '...' : '')
      : JSON.stringify(message.body || '').slice(0, 50),
  };
}

export function addMessageLog(logs, entry, maxLogs = 100) {
  if (!entry) return logs;
  const updated = [entry, ...logs];
  return updated.slice(0, maxLogs);
}

export function simulateResourceLoad(resources, options = {}) {
  const failProbability = options.failProbability ?? RESOURCE_FAIL_PROBABILITY;
  const minDelay = options.minDelay ?? RESOURCE_MIN_DELAY;
  const maxDelay = options.maxDelay ?? RESOURCE_MAX_DELAY;
  const shouldFail = options.forceFail ?? null;
  const deterministic = options.deterministic ?? false;

  const results = [];
  let totalDuration = 0;

  for (let i = 0; i < resources.length; i++) {
    const resource = resources[i];
    let willFail;
    if (shouldFail !== null) {
      willFail = shouldFail === true || (Array.isArray(shouldFail) && shouldFail.includes(i));
    } else if (deterministic) {
      if (failProbability <= 0) {
        willFail = false;
      } else if (failProbability >= 1) {
        willFail = true;
      } else {
        const threshold = Math.floor(failProbability * 100);
        willFail = ((i * 7 + 3) % 100) < threshold;
      }
    } else {
      willFail = Math.random() < failProbability;
    }

    const delay = deterministic
      ? minDelay + ((i * 37) % (maxDelay - minDelay + 1))
      : Math.floor(Math.random() * (maxDelay - minDelay + 1)) + minDelay;

    totalDuration += delay;

    results.push({
      resource,
      index: i,
      success: !willFail,
      delay,
      cumulativeDelay: totalDuration,
    });
  }

  const hasFailure = results.some((r) => !r.success);
  const failedResources = results.filter((r) => !r.success).map((r) => r.resource);

  return {
    results,
    totalDuration,
    success: !hasFailure,
    failedResources,
  };
}

export function generateMicroAppHtml(app) {
  if (!app) return '';
  const mockTexts = {
    'user-mgmt': '用户管理模块：管理系统用户、角色分配、权限配置。当前在线用户 128 人，今日新增用户 15 人。',
    'data-report': '数据报表模块：实时业务数据可视化展示。今日销售额 ¥128,500，订单量 342 单，转化率 4.8%。',
    'order-center': '订单中心模块：全渠道订单统一管理。待处理订单 23 个，今日发货 156 单，退款 3 单。',
    'product-mgmt': '商品管理模块：商品信息维护与上下架。在售商品 1,284 个，库存预警 12 个。',
    default: `这是「${app.name}」子应用的模拟业务页面。\n应用 ID: ${app.id}\n入口路径: ${app.entryPath}\n当前版本: ${app.version}\n\n这里可以放置该子应用的所有业务内容，与其他子应用完全隔离运行。`,
  };
  const content = mockTexts[app.id] || mockTexts.default;
  return `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    padding: 24px;
    background: #f7f6f9;
    color: #333;
    min-height: 100vh;
  }
  .app-header {
    background: linear-gradient(135deg, #667eea, #764ba2);
    color: white;
    padding: 20px 24px;
    border-radius: 12px;
    margin-bottom: 20px;
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
  }
  .app-title { font-size: 20px; font-weight: 600; margin-bottom: 4px; }
  .app-subtitle { font-size: 13px; opacity: 0.9; }
  .app-content {
    background: white;
    padding: 24px;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  }
  .app-content h3 { font-size: 16px; margin-bottom: 12px; color: #333; }
  .app-content pre {
    background: #f5f5f5;
    padding: 16px;
    border-radius: 8px;
    font-size: 13px;
    line-height: 1.7;
    white-space: pre-wrap;
    word-break: break-all;
    font-family: 'Consolas', 'Monaco', monospace;
  }
  .toolbar {
    margin-top: 20px;
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
  }
  .toolbar button {
    padding: 8px 16px;
    border: 1px solid #667eea;
    background: white;
    color: #667eea;
    border-radius: 6px;
    cursor: pointer;
    font-size: 13px;
    transition: all 0.2s;
  }
  .toolbar button:hover {
    background: #667eea;
    color: white;
  }
  .send-panel {
    margin-top: 16px;
    display: flex;
    gap: 8px;
  }
  .send-panel input {
    flex: 1;
    padding: 8px 12px;
    border: 1px solid #ddd;
    border-radius: 6px;
    font-size: 13px;
  }
  .send-panel select {
    padding: 8px 12px;
    border: 1px solid #ddd;
    border-radius: 6px;
    font-size: 13px;
    background: white;
  }
</style>
</head>
<body>
  <div class="app-header">
    <div class="app-title">${app.name}</div>
    <div class="app-subtitle">Micro App · v${app.version} · ${app.id}</div>
  </div>
  <div class="app-content">
    <h3>业务内容区域</h3>
    <pre>${content}</pre>
  </div>
  <div class="toolbar">
    <button onclick="broadcastPing()">发送广播 Ping</button>
    <button onclick="sendLifecycleEvent()">发送生命周期事件</button>
  </div>
  <div class="send-panel">
    <select id="targetSelect">
      <option value="all">广播 (all)</option>
    </select>
    <input id="msgInput" type="text" placeholder="输入消息内容..." />
    <button onclick="sendCustomMessage()">发送</button>
  </div>
<script>
  var APP_ID = '${app.id}';

  function updateTargetOptions() {
    window.parent.postMessage({ type: '__get_apps__', from: APP_ID }, '*');
  }

  window.addEventListener('message', function(e) {
    var data = e.data;
    if (!data) return;
    if (data.type === '__app_list__') {
      var sel = document.getElementById('targetSelect');
      if (sel) {
        sel.innerHTML = '<option value="all">广播 (all)</option>';
        (data.apps || []).forEach(function(id) {
          if (id !== APP_ID) {
            var opt = document.createElement('option');
            opt.value = id;
            opt.textContent = id;
            sel.appendChild(opt);
          }
        });
      }
      return;
    }
    if (data.from && data.from !== APP_ID) {
      console.log('[' + APP_ID + '] 收到来自 ' + data.from + ' 的消息:', data);
    }
  });

  function broadcastPing() {
    window.parent.postMessage({
      from: APP_ID,
      to: 'all',
      type: 'custom',
      body: 'Ping from ' + APP_ID + ' at ' + new Date().toLocaleTimeString()
    }, '*');
  }

  function sendLifecycleEvent() {
    window.parent.postMessage({
      from: APP_ID,
      to: 'all',
      type: 'lifecycle',
      body: { event: 'heartbeat', timestamp: Date.now() }
    }, '*');
  }

  function sendCustomMessage() {
    var sel = document.getElementById('targetSelect');
    var input = document.getElementById('msgInput');
    var target = sel ? sel.value : 'all';
    var body = input ? input.value : '';
    if (!body) return;
    window.parent.postMessage({
      from: APP_ID,
      to: target,
      type: 'custom',
      body: body
    }, '*');
    if (input) input.value = '';
  }

  setTimeout(updateTargetOptions, 300);
</script>
</body>
</html>
  `.trim();
}

export function getInitialActiveAppFromHash(hash, appIds) {
  if (!hash || typeof hash !== 'string') return null;
  const cleanHash = hash.replace(/^#\/?/, '');
  if (!cleanHash) return null;
  if (appIds.includes(cleanHash)) return cleanHash;
  return null;
}

export function buildHashForApp(appId) {
  if (!appId) return '#/';
  return `#/${appId}`;
}
