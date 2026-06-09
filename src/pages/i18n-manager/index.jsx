import { useState, useEffect, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  loadState,
  saveState,
  addTranslationKey,
  updateTranslationKey,
  deleteTranslationKey,
  updateTranslationValue,
  addLanguage,
  filterTranslations,
  calculateCoverage,
  buildTree,
  importTranslations,
  exportTranslations,
  isKeyPartiallyUntranslated,
  getKeyCompareStatus,
  sortKeys,
  isValidKey,
  isKeyDuplicated,
  getInitialExpandedKeys,
} from './i18nUtils.js';
import { FILTER_MODES, FILTER_LABELS, VIEW_MODES, VIEW_LABELS } from './constants.js';
import './i18n-manager.css';

function ProgressRing({ percentage, size = 80, strokeWidth = 8, color = 'var(--accent)' }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <svg width={size} height={size} className="progress-ring">
      <circle
        className="progress-ring-bg"
        stroke="var(--border)"
        strokeWidth={strokeWidth}
        fill="transparent"
        r={radius}
        cx={size / 2}
        cy={size / 2}
      />
      <circle
        className="progress-ring-fg"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        fill="transparent"
        r={radius}
        cx={size / 2}
        cy={size / 2}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        style={{ transition: 'stroke-dashoffset 0.3s' }}
      />
      <text
        x={size / 2}
        y={size / 2}
        textAnchor="middle"
        dominantBaseline="middle"
        className="progress-ring-text"
        fill="var(--text-h)"
      >
        {percentage}%
      </text>
    </svg>
  );
}

function StatsPanel({ languages, translations }) {
  const coverage = useMemo(() => calculateCoverage(translations, languages), [translations, languages]);
  const totalKeys = Object.keys(translations).length;

  return (
    <div className="i18n-stats-panel">
      <div className="i18n-stats-total">
        <div className="i18n-stats-total-label">总 Key 数</div>
        <div className="i18n-stats-total-value">{totalKeys}</div>
      </div>
      <div className="i18n-stats-rings">
        {languages.map((lang) => (
          <div key={lang.code} className="i18n-stats-ring-item">
            <ProgressRing percentage={coverage[lang.code].percentage} />
            <div className="i18n-stats-ring-label">{lang.name}</div>
            <div className="i18n-stats-ring-sub">
              {coverage[lang.code].translated} / {coverage[lang.code].total}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function EditableCell({ value, onChange, placeholder, highlight }) {
  return (
    <input
      type="text"
      className={`i18n-table-input ${highlight ? 'i18n-table-input-empty' : ''}`}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
    />
  );
}

function KeyEditCell({ value, onBlur, hasError, errorMessage }) {
  const [editing, setEditing] = useState(false);
  const [localValue, setLocalValue] = useState(value);
  const inputRef = useRef(null);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleDoubleClick = () => {
    setEditing(true);
  };

  const handleBlur = () => {
    setEditing(false);
    if (localValue !== value) {
      onBlur(localValue);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleBlur();
    } else if (e.key === 'Escape') {
      setLocalValue(value);
      setEditing(false);
    }
  };

  if (editing) {
    return (
      <input
        ref={inputRef}
        type="text"
        className={`i18n-table-input i18n-key-input ${hasError ? 'i18n-table-input-error' : ''}`}
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
      />
    );
  }

  return (
    <div
      className={`i18n-key-display ${hasError ? 'i18n-key-error' : ''}`}
      onDoubleClick={handleDoubleClick}
      title={hasError ? errorMessage : '双击编辑'}
    >
      {value}
    </div>
  );
}

function TreeRow({
  nodeKey,
  node,
  level,
  translations,
  languages,
  selectedKey,
  onSelectKey,
  onUpdateValue,
  expandedKeys,
  onToggleExpand,
  onDeleteKey,
  onKeyChange,
  editingKeyErrors,
}) {
  const paddingLeft = level * 20 + 8;
  const hasChildren = node.__children && Object.keys(node.__children).length > 0;
  const isExpanded = expandedKeys.has(nodeKey + '_' + level);

  if (node.__isLeaf && node.__fullKey) {
    const fullKey = node.__fullKey;
    const keyData = translations[fullKey];
    const isUntranslated = isKeyPartiallyUntranslated(keyData, languages);
    const hasError = editingKeyErrors[fullKey];
    return (
      <tr
        className={`i18n-table-row ${selectedKey === fullKey ? 'i18n-table-row-selected' : ''}`}
        onClick={() => onSelectKey(fullKey)}
      >
        <td className="i18n-table-cell i18n-key-cell" onClick={(e) => e.stopPropagation()}>
          <span style={{ paddingLeft }} className="i18n-tree-indent" />
          <span className="i18n-tree-toggle-placeholder" />
          <KeyEditCell
            value={nodeKey}
            hasError={!!hasError}
            errorMessage={editingKeyErrors[fullKey]}
            onBlur={(newVal) => {
              const parts = fullKey.split('.');
              parts[parts.length - 1] = newVal;
              onKeyChange(fullKey, parts.join('.'));
            }}
          />
          {isUntranslated && <span className="i18n-untranslated-badge">未完成</span>}
        </td>
        {languages.map((lang) => {
          const val = keyData[lang.code] || '';
          return (
            <td key={lang.code} className="i18n-table-cell" onClick={(e) => e.stopPropagation()}>
              <EditableCell
                value={val}
                onChange={(v) => onUpdateValue(fullKey, lang.code, v)}
                placeholder={`${lang.name} 翻译`}
                highlight={!val || !val.trim()}
              />
            </td>
          );
        })}
        <td className="i18n-table-cell i18n-action-cell" onClick={(e) => e.stopPropagation()}>
          <button
            className="i18n-delete-btn"
            onClick={() => onDeleteKey(fullKey)}
            title="删除"
          >
            删除
          </button>
        </td>
      </tr>
    );
  }

  return (
    <>
      <tr className="i18n-table-row i18n-tree-branch-row">
        <td className="i18n-table-cell i18n-key-cell">
          <span style={{ paddingLeft }} className="i18n-tree-indent" />
          <button
            className="i18n-tree-toggle"
            onClick={(e) => {
              e.stopPropagation();
              onToggleExpand(nodeKey + '_' + level);
            }}
          >
            {isExpanded ? '▼' : '▶'}
          </button>
          <span className="i18n-tree-branch-name">{nodeKey}</span>
        </td>
        {languages.map((lang) => (
          <td key={lang.code} className="i18n-table-cell i18n-tree-branch-cell" />
        ))}
        <td className="i18n-table-cell i18n-tree-branch-cell i18n-action-cell" />
      </tr>
      {isExpanded &&
        hasChildren &&
        Object.keys(node.__children).map((childKey) => (
          <TreeRow
            key={childKey + '_' + (level + 1)}
            nodeKey={childKey}
            node={node.__children[childKey]}
            level={level + 1}
            translations={translations}
            languages={languages}
            selectedKey={selectedKey}
            onSelectKey={onSelectKey}
            onUpdateValue={onUpdateValue}
            expandedKeys={expandedKeys}
            onToggleExpand={onToggleExpand}
            onDeleteKey={onDeleteKey}
            onKeyChange={onKeyChange}
            editingKeyErrors={editingKeyErrors}
          />
        ))}
    </>
  );
}

function ComparePanel({ selectedKey, translations, languages }) {
  if (!selectedKey) {
    return (
      <div className="i18n-compare-empty">
        请在表格中选择一个 key 查看翻译对比
      </div>
    );
  }

  const keyData = translations[selectedKey];
  if (!keyData) {
    return (
      <div className="i18n-compare-empty">
        未找到 key: {selectedKey}
      </div>
    );
  }

  return (
    <div className="i18n-compare-panel">
      <div className="i18n-compare-title">翻译对比: <code>{selectedKey}</code></div>
      <div className="i18n-compare-grid">
        {languages.map((lang) => {
          const status = getKeyCompareStatus(keyData, lang.code, languages);
          const val = keyData[lang.code] || '';
          let statusClass = '';
          let statusLabel = '';
          if (status === 'missing') {
            statusClass = 'i18n-compare-missing';
            statusLabel = '未翻译';
          } else if (status === 'same') {
            statusClass = 'i18n-compare-same';
            statusLabel = '一致';
          } else {
            statusClass = 'i18n-compare-different';
            statusLabel = '差异';
          }
          return (
            <div key={lang.code} className={`i18n-compare-item ${statusClass}`}>
              <div className="i18n-compare-item-header">
                <span className="i18n-compare-lang">{lang.name}</span>
                <span className="i18n-compare-code">{lang.code}</span>
                <span className={`i18n-compare-status ${statusClass}`}>{statusLabel}</span>
              </div>
              <div className="i18n-compare-value">
                {val || <span className="i18n-compare-empty-val">（空）</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function I18nManagerPage() {
  const [state, setState] = useState(() => loadState());
  const [viewMode, setViewMode] = useState(VIEW_MODES.FLAT);
  const [filterMode, setFilterMode] = useState(FILTER_MODES.ALL);
  const [selectedKey, setSelectedKey] = useState(null);
  const [expandedKeys, setExpandedKeys] = useState(() => getInitialExpandedKeys(loadState().translations));
  const [newKeyInput, setNewKeyInput] = useState('');
  const [newKeyError, setNewKeyError] = useState('');
  const [editingKeyErrors, setEditingKeyErrors] = useState({});
  const [addLangOpen, setAddLangOpen] = useState(false);
  const [newLangCode, setNewLangCode] = useState('');
  const [newLangName, setNewLangName] = useState('');
  const [newLangError, setNewLangError] = useState('');
  const fileInputRef = useRef(null);

  const { languages, translations } = state;

  useEffect(() => {
    saveState(state);
  }, [state]);

  const sortedTranslations = useMemo(() => sortKeys(translations), [translations]);

  const filteredTranslations = useMemo(
    () => filterTranslations(sortedTranslations, languages, filterMode),
    [sortedTranslations, languages, filterMode]
  );

  const tree = useMemo(() => buildTree(filteredTranslations), [filteredTranslations]);

  const handleToggleExpand = (key) => {
    setExpandedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const handleAddKey = () => {
    const key = newKeyInput.trim();
    if (!key) {
      setNewKeyError('请输入 key');
      return;
    }
    if (!isValidKey(key)) {
      setNewKeyError('key 格式不合法，只能包含字母、数字、下划线和点号');
      return;
    }
    if (isKeyDuplicated(translations, key)) {
      setNewKeyError('key 已存在');
      return;
    }
    const newTranslations = addTranslationKey(translations, key, languages);
    setState({ ...state, translations: newTranslations });
    const topLevel = key.split('.')[0];
    setExpandedKeys((prev) => {
      const next = new Set(prev);
      next.add(`${topLevel}_0`);
      return next;
    });
    setNewKeyInput('');
    setNewKeyError('');
    setSelectedKey(key);
  };

  const handleKeyChange = (oldKey, newKey) => {
    if (!isValidKey(newKey)) {
      setEditingKeyErrors((prev) => ({ ...prev, [oldKey]: 'key 格式不合法' }));
      return;
    }
    if (isKeyDuplicated(translations, newKey, oldKey)) {
      setEditingKeyErrors((prev) => ({ ...prev, [oldKey]: 'key 已存在' }));
      return;
    }
    setEditingKeyErrors((prev) => {
      const next = { ...prev };
      delete next[oldKey];
      return next;
    });
    const updated = updateTranslationKey(translations, oldKey, newKey);
    setState({ ...state, translations: updated });
    if (selectedKey === oldKey) {
      setSelectedKey(newKey);
    }
  };

  const handleDeleteKey = (key) => {
    const updated = deleteTranslationKey(translations, key);
    setState({ ...state, translations: updated });
    if (selectedKey === key) {
      setSelectedKey(null);
    }
  };

  const handleUpdateValue = (key, langCode, value) => {
    const updated = updateTranslationValue(translations, key, langCode, value);
    setState({ ...state, translations: updated });
  };

  const handleAddLanguage = () => {
    const code = newLangCode.trim();
    const name = newLangName.trim();
    if (!code || !name) {
      setNewLangError('语言代码和名称都不能为空');
      return;
    }
    if (!/^[a-zA-Z-]+$/.test(code)) {
      setNewLangError('语言代码只能包含字母和短横线');
      return;
    }
    const result = addLanguage(languages, translations, code, name);
    if (result.languages === languages) {
      setNewLangError('该语言代码已存在');
      return;
    }
    setState({ languages: result.languages, translations: result.translations });
    setAddLangOpen(false);
    setNewLangCode('');
    setNewLangName('');
    setNewLangError('');
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result);
        const result = importTranslations(languages, translations, data);
        setState({ languages: result.languages, translations: result.translations });
        const newExpanded = getInitialExpandedKeys(result.translations);
        setExpandedKeys((prev) => {
          const next = new Set(prev);
          newExpanded.forEach((k) => next.add(k));
          return next;
        });
      } catch {
        alert('JSON 文件格式错误');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleExport = () => {
    const data = exportTranslations(translations);
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `i18n-translations-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="i18n-page">
      <div className="i18n-header">
        <div className="i18n-header-left">
          <Link to="/" className="i18n-back-link">← 返回首页</Link>
          <h1 className="i18n-title">多语言国际化管理</h1>
        </div>
      </div>

      <StatsPanel languages={languages} translations={translations} />

      <div className="i18n-toolbar">
        <div className="i18n-toolbar-left">
          <div className="i18n-view-toggle">
            {Object.values(VIEW_MODES).map((mode) => (
              <button
                key={mode}
                className={`i18n-view-btn ${viewMode === mode ? 'i18n-view-btn-active' : ''}`}
                onClick={() => setViewMode(mode)}
              >
                {VIEW_LABELS[mode]}
              </button>
            ))}
          </div>

          <select
            className="i18n-filter-select"
            value={filterMode}
            onChange={(e) => setFilterMode(e.target.value)}
          >
            {Object.values(FILTER_MODES).map((mode) => (
              <option key={mode} value={mode}>
                {FILTER_LABELS[mode]}
              </option>
            ))}
          </select>
        </div>

        <div className="i18n-toolbar-right">
          <button className="i18n-btn" onClick={handleImportClick}>
            导入 JSON
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />
          <button className="i18n-btn i18n-btn-primary" onClick={handleExport}>
            导出 JSON
          </button>
          <button className="i18n-btn i18n-btn-primary" onClick={() => setAddLangOpen(true)}>
            添加语言
          </button>
        </div>
      </div>

      {addLangOpen && (
        <div className="i18n-add-lang-panel">
          <input
            type="text"
            className="i18n-table-input"
            placeholder="语言代码 (如 zh-CN)"
            value={newLangCode}
            onChange={(e) => setNewLangCode(e.target.value)}
          />
          <input
            type="text"
            className="i18n-table-input"
            placeholder="语言名称 (如 简体中文)"
            value={newLangName}
            onChange={(e) => setNewLangName(e.target.value)}
          />
          {newLangError && <span className="i18n-error-text">{newLangError}</span>}
          <button className="i18n-btn i18n-btn-primary" onClick={handleAddLanguage}>
            确认添加
          </button>
          <button
            className="i18n-btn"
            onClick={() => {
              setAddLangOpen(false);
              setNewLangCode('');
              setNewLangName('');
              setNewLangError('');
            }}
          >
            取消
          </button>
        </div>
      )}

      <div className="i18n-add-key-row">
        <input
          type="text"
          className={`i18n-table-input i18n-add-key-input ${newKeyError ? 'i18n-table-input-error' : ''}`}
          placeholder="新增翻译 key（如 user.profile.name）"
          value={newKeyInput}
          onChange={(e) => {
            setNewKeyInput(e.target.value);
            setNewKeyError('');
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleAddKey();
          }}
        />
        <button className="i18n-btn i18n-btn-primary" onClick={handleAddKey}>
          + 添加 Key
        </button>
        {newKeyError && <span className="i18n-error-text">{newKeyError}</span>}
      </div>

      <div className="i18n-content">
        <div className="i18n-table-wrapper">
          <table className="i18n-table">
            <thead>
              <tr>
                <th className="i18n-table-th i18n-key-th">
                  Key
                  <span className="i18n-th-count">({Object.keys(filteredTranslations).length})</span>
                </th>
                {languages.map((lang) => (
                  <th key={lang.code} className="i18n-table-th">
                    {lang.name}
                    <span className="i18n-th-sub">({lang.code})</span>
                  </th>
                ))}
                <th className="i18n-table-th i18n-action-th">操作</th>
              </tr>
            </thead>
            <tbody>
              {viewMode === VIEW_MODES.FLAT ? (
                Object.keys(filteredTranslations).length === 0 ? (
                  <tr>
                    <td colSpan={languages.length + 2} className="i18n-table-empty">
                      暂无数据
                    </td>
                  </tr>
                ) : (
                  Object.keys(filteredTranslations).map((key) => {
                    const keyData = filteredTranslations[key];
                    const isUntranslated = isKeyPartiallyUntranslated(keyData, languages);
                    const hasError = editingKeyErrors[key];
                    return (
                      <tr
                        key={key}
                        className={`i18n-table-row ${selectedKey === key ? 'i18n-table-row-selected' : ''}`}
                        onClick={() => setSelectedKey(key)}
                      >
                        <td className="i18n-table-cell i18n-key-cell" onClick={(e) => e.stopPropagation()}>
                          <KeyEditCell
                            value={key}
                            hasError={!!hasError}
                            errorMessage={editingKeyErrors[key]}
                            onBlur={(newVal) => handleKeyChange(key, newVal)}
                          />
                          {isUntranslated && <span className="i18n-untranslated-badge">未完成</span>}
                        </td>
                        {languages.map((lang) => {
                          const val = keyData[lang.code] || '';
                          return (
                            <td key={lang.code} className="i18n-table-cell" onClick={(e) => e.stopPropagation()}>
                              <EditableCell
                                value={val}
                                onChange={(v) => handleUpdateValue(key, lang.code, v)}
                                placeholder={`${lang.name} 翻译`}
                                highlight={!val || !val.trim()}
                              />
                            </td>
                          );
                        })}
                        <td className="i18n-table-cell i18n-action-cell" onClick={(e) => e.stopPropagation()}>
                          <button
                            className="i18n-delete-btn"
                            onClick={() => handleDeleteKey(key)}
                            title="删除"
                          >
                            删除
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )
              ) : (
                Object.keys(tree).length === 0 ? (
                  <tr>
                    <td colSpan={languages.length + 2} className="i18n-table-empty">
                      暂无数据
                    </td>
                  </tr>
                ) : (
                  Object.keys(tree).map((rootKey) => (
                    <TreeRow
                      key={rootKey}
                      nodeKey={rootKey}
                      node={tree[rootKey]}
                      level={0}
                      translations={filteredTranslations}
                      languages={languages}
                      selectedKey={selectedKey}
                      onSelectKey={setSelectedKey}
                      onUpdateValue={handleUpdateValue}
                      expandedKeys={expandedKeys}
                      onToggleExpand={handleToggleExpand}
                      onDeleteKey={handleDeleteKey}
                      onKeyChange={handleKeyChange}
                      editingKeyErrors={editingKeyErrors}
                    />
                  ))
                )
              )}
            </tbody>
          </table>
        </div>

        <div className="i18n-compare-wrapper">
          <ComparePanel
            selectedKey={selectedKey}
            translations={translations}
            languages={languages}
          />
        </div>
      </div>
    </div>
  );
}
