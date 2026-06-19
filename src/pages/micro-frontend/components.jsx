import { useState } from 'react';
import { validateAppId, validateVersion } from './utils.js';

export function RegisterForm({ onRegister, existingIds = [] }) {
  const [name, setName] = useState('');
  const [appId, setAppId] = useState('');
  const [entryPath, setEntryPath] = useState('');
  const [resourcesText, setResourcesText] = useState('');
  const [errors, setErrors] = useState({});

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!name.trim()) newErrors.name = '请输入应用名称';
    if (!appId.trim()) {
      newErrors.appId = '请输入应用 ID';
    } else if (!validateAppId(appId.trim())) {
      newErrors.appId = '应用 ID 需以小写字母开头，只能包含小写字母、数字和连字符';
    } else if (existingIds.includes(appId.trim())) {
      newErrors.appId = '该应用 ID 已存在';
    }
    if (!entryPath.trim()) {
      newErrors.entryPath = '请输入应用入口路径';
    } else if (!entryPath.trim().startsWith('/')) {
      newErrors.entryPath = '入口路径需以 / 开头';
    }

    let resources = [];
    if (resourcesText.trim()) {
      const lines = resourcesText.trim().split('\n').map((l) => l.trim()).filter(Boolean);
      resources = lines;
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onRegister({
      name: name.trim(),
      appId: appId.trim(),
      entryPath: entryPath.trim(),
      resources,
    });

    setName('');
    setAppId('');
    setEntryPath('');
    setResourcesText('');
    setErrors({});
  };

  return (
    <div className="mf-register-form">
      <h3 className="mf-section-title" style={{ margin: '0 0 16px' }}>注册新微应用</h3>
      <form onSubmit={handleSubmit}>
        <div className="mf-form-row">
          <div className="mf-form-group">
            <label className="mf-form-label">应用名称 *</label>
            <input
              className="mf-form-input"
              type="text"
              placeholder="如：用户管理"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            {errors.name && <div className="mf-form-error">{errors.name}</div>}
          </div>
          <div className="mf-form-group">
            <label className="mf-form-label">应用 ID *</label>
            <input
              className="mf-form-input"
              type="text"
              placeholder="如：user-mgmt"
              value={appId}
              onChange={(e) => setAppId(e.target.value)}
            />
            {errors.appId ? (
              <div className="mf-form-error">{errors.appId}</div>
            ) : (
              <div className="mf-form-hint">小写字母、数字、连字符，字母开头</div>
            )}
          </div>
        </div>
        <div className="mf-form-row">
          <div className="mf-form-group">
            <label className="mf-form-label">入口路径 *</label>
            <input
              className="mf-form-input"
              type="text"
              placeholder="如：/user-mgmt"
              value={entryPath}
              onChange={(e) => setEntryPath(e.target.value)}
            />
            {errors.entryPath && <div className="mf-form-error">{errors.entryPath}</div>}
          </div>
        </div>
        <div className="mf-form-row">
          <div className="mf-form-group" style={{ minWidth: '100%' }}>
            <label className="mf-form-label">模拟资源列表（可选，每行一个 URL）</label>
            <textarea
              className="mf-form-input mf-resources-input"
              placeholder={'https://cdn.example.com/app.js\nhttps://cdn.example.com/style.css\nhttps://cdn.example.com/logo.png'}
              value={resourcesText}
              onChange={(e) => setResourcesText(e.target.value)}
            />
            <div className="mf-form-hint">启动时将模拟这些资源的加载过程（含 10% 随机失败概率）</div>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <button type="submit" className="mf-btn mf-btn-primary">注册应用</button>
        </div>
      </form>
    </div>
  );
}

export function UpgradeModal({ app, onClose, onUpgrade }) {
  const [version, setVersion] = useState('');
  const [changelog, setChangelog] = useState('');
  const [error, setError] = useState('');

  if (!app) return null;

  const handleSubmit = () => {
    if (!validateVersion(version.trim())) {
      setError('版本号格式不正确，应为 x.y.z 格式（如 1.2.0）');
      return;
    }
    onUpgrade(app.id, version.trim(), changelog.trim());
  };

  return (
    <div className="mf-modal-mask" onClick={onClose}>
      <div className="mf-modal" onClick={(e) => e.stopPropagation()}>
        <h3 className="mf-modal-title">升级版本 — {app.name}</h3>
        <div style={{ marginBottom: 12 }}>
          <div className="mf-form-label">当前版本</div>
          <div style={{ fontFamily: 'Consolas, monospace', fontSize: 15, color: 'var(--text-h)' }}>
            {app.version}
          </div>
        </div>
        <div style={{ marginBottom: 12 }}>
          <label className="mf-form-label">新版本号 *</label>
          <input
            className="mf-form-input"
            type="text"
            placeholder="如：1.1.0"
            value={version}
            onChange={(e) => { setVersion(e.target.value); setError(''); }}
          />
          {error && <div className="mf-form-error">{error}</div>}
        </div>
        <div style={{ marginBottom: 12 }}>
          <label className="mf-form-label">更新日志</label>
          <textarea
            className="mf-form-input"
            style={{ minHeight: 80, resize: 'vertical' }}
            placeholder="描述本次版本更新的内容..."
            value={changelog}
            onChange={(e) => setChangelog(e.target.value)}
          />
        </div>
        <div className="mf-modal-footer">
          <button className="mf-btn" onClick={onClose}>取消</button>
          <button className="mf-btn mf-btn-primary" onClick={handleSubmit}>确认升级</button>
        </div>
      </div>
    </div>
  );
}

export function LifecycleSteps({ app }) {
  const stages = [
    { key: 'loading', label: 'loading' },
    { key: 'bootstrap', label: 'bootstrap' },
    { key: 'mount', label: 'mount' },
    { key: 'ready', label: 'ready' },
  ];

  const completedStages = (app?.lifecycle?.stages || []).map((s) => s.stage);
  const currentStage = app?.lifecycle?.currentStage;
  const stageDurations = {};
  (app?.lifecycle?.stages || []).forEach((s) => {
    stageDurations[s.stage] = s.duration;
  });

  const isActive = (key) => currentStage === key;
  const isDone = (key) => completedStages.includes(key);

  return (
    <div className="mf-lifecycle-section">
      <h4 className="mf-lifecycle-title">生命周期</h4>
      <div className="mf-lifecycle-steps">
        {stages.map((s, i) => (
          <div key={s.key} className="mf-lifecycle-step">
            <div className={`mf-lifecycle-node ${isDone(s.key) ? 'done' : ''} ${isActive(s.key) ? 'active' : ''}`}>
              {i + 1}
            </div>
            <div>
              <div className={`mf-lifecycle-label ${isDone(s.key) ? 'done' : ''} ${isActive(s.key) ? 'active' : ''}`}>
                {s.label}
              </div>
              {stageDurations[s.key] != null && (
                <div className="mf-lifecycle-duration">{stageDurations[s.key]}ms</div>
              )}
            </div>
            {i < stages.length - 1 && (
              <div className={`mf-lifecycle-connector ${isDone(s.key) ? 'done' : ''}`} />
            )}
          </div>
        ))}
      </div>
      {completedStages.includes('unmount') && (
        <div style={{ marginTop: 8, fontSize: 12, color: '#8c8c8c' }}>
          已执行 unmount（卸载）
        </div>
      )}
    </div>
  );
}

export function VersionHistory({ app, onUpgradeClick }) {
  if (!app) return null;
  return (
    <div className="mf-app-detail-section">
      <div className="mf-version-info">
        <div className="mf-version-current">
          当前版本：<strong>{app.version}</strong>
        </div>
        <button className="mf-btn mf-btn-sm mf-btn-primary" onClick={onUpgradeClick}>
          升级版本
        </button>
      </div>
      <div className="mf-version-history">
        {[...app.versionHistory].reverse().map((v) => (
          <div key={v.version + v.updatedAt} className="mf-version-item">
            <div>
              <span className="mf-version-number">v{v.version}</span>
              <span className="mf-version-time">{new Date(v.updatedAt).toLocaleString()}</span>
            </div>
            <div className="mf-version-changelog">{v.changelog}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
