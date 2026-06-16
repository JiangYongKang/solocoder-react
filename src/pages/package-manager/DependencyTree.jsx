import { useMemo } from 'react'
import { TAB_TYPE } from './constants.js'
import {
  detectVersionConflict,
  flattenDependencyTree,
  filterDependenciesByName,
  hasNewerVersion,
  isVersionOutdated,
  formatSize,
} from './packageUtils.js'

function DependencyRow({
  dep,
  expanded,
  onToggleExpand,
  selected,
  onToggleSelect,
  onSelectPackage,
}) {
  const hasChildren = dep.dependencies && dep.dependencies.length > 0
  const isConflict = detectVersionConflict(dep.installedVersion, dep.versionRange)
  const upgradable = hasNewerVersion(dep.installedVersion || dep.version, dep.latestVersion)
  const outdated = isVersionOutdated(dep.installedVersion || dep.version, dep.latestVersion)

  const rowClass = [
    'pm-tree-row',
    isConflict ? 'pm-conflict' : '',
    outdated ? 'pm-outdated' : '',
    dep.depth === 0 ? 'pm-row-direct' : '',
  ].filter(Boolean).join(' ')

  const indent = dep.depth * 24

  return (
    <div className={rowClass} style={{ paddingLeft: `${indent}px` }}>
      <div className="pm-tree-cell pm-tree-cell-name">
        <span className="pm-expand" style={{ visibility: hasChildren ? 'visible' : 'hidden' }}>
          <button
            type="button"
            className="pm-expand-btn"
            onClick={() => onToggleExpand(dep.id || dep.name)}
          >
            {expanded ? '▼' : '▶'}
          </button>
        </span>
        <span className="pm-checkbox-wrapper">
          <input
            type="checkbox"
            checked={selected}
            onChange={() => onToggleSelect(dep.name)}
          />
        </span>
        <span
          className="pm-package-name"
          onClick={() => onSelectPackage(dep)}
          title={dep.name}
        >
          {dep.name}
        </span>
        {isConflict && <span className="pm-badge pm-badge-conflict">版本冲突</span>}
        {upgradable && <span className="pm-badge pm-badge-upgradable">可升级</span>}
        {outdated && <span className="pm-badge pm-badge-outdated">过旧</span>}
      </div>
      <div className="pm-tree-cell pm-version-range">
        <span className="pm-range">{dep.versionRange}</span>
        {dep.latestVersion && (
          <span className="pm-latest-version">最新: {dep.latestVersion}</span>
        )}
      </div>
      <div className="pm-tree-cell">
        <span className="pm-installed-version">{dep.installedVersion || dep.version}</span>
      </div>
      <div className="pm-tree-cell">{dep.license || '-'}</div>
      <div className="pm-tree-cell">{formatSize(dep.size)}</div>
    </div>
  )
}

export default function DependencyTree({
  dependencies,
  activeTab,
  onTabChange,
  searchKeyword,
  onSearchChange,
  expandedNodes,
  onToggleExpand,
  selectedUpgrades,
  onToggleSelect,
  onSelectAllUpgradable,
  onCheckUpdates,
  onSelectPackage,
}) {
  const filteredDeps = useMemo(() => {
    return filterDependenciesByName(dependencies, searchKeyword)
  }, [dependencies, searchKeyword])

  const flatRows = useMemo(() => {
    return flattenDependencyTree(filteredDeps)
  }, [filteredDeps])

  const visibleRows = useMemo(() => {
    const result = []
    const walk = (list) => {
      for (const dep of list) {
        result.push(dep)
        const nodeId = dep.id || dep.name
        if (expandedNodes[nodeId] && dep.dependencies && dep.dependencies.length > 0) {
          walk(dep.dependencies)
        }
      }
    }
    walk(filteredDeps)
    return result
  }, [filteredDeps, expandedNodes])

  const directDepsCount = dependencies.length
  const totalDepsCount = flatRows.length
  const upgradableCount = flatRows.filter((d) =>
    hasNewerVersion(d.installedVersion || d.version, d.latestVersion)
  ).length

  return (
    <div className="pm-tree-container">
      <div className="pm-tree-header">
        <div className="pm-tabs">
          <button
            type="button"
            className={`pm-tab ${activeTab === TAB_TYPE.DEPENDENCIES ? 'active' : ''}`}
            onClick={() => onTabChange(TAB_TYPE.DEPENDENCIES)}
          >
            dependencies
          </button>
          <button
            type="button"
            className={`pm-tab ${activeTab === TAB_TYPE.DEV_DEPENDENCIES ? 'active' : ''}`}
            onClick={() => onTabChange(TAB_TYPE.DEV_DEPENDENCIES)}
          >
            devDependencies
          </button>
        </div>
        <div className="pm-tree-actions">
          <div className="pm-stats">
            <span>共 {totalDepsCount} 个包（直接依赖 {directDepsCount} 个）</span>
            <span className="pm-upgradable-count">可升级 {upgradableCount} 个</span>
          </div>
          <div className="pm-search-box">
            <input
              type="text"
              placeholder="搜索包名..."
              value={searchKeyword}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pm-search-input"
            />
          </div>
          <button type="button" className="pm-btn pm-btn-sm" onClick={onCheckUpdates}>
            🔍 检查更新
          </button>
          <button
            type="button"
            className="pm-btn pm-btn-sm pm-btn-secondary"
            onClick={onSelectAllUpgradable}
          >
            全选可升级
          </button>
        </div>
      </div>

      <div className="pm-tree-table">
        <div className="pm-tree-header-row">
          <div className="pm-tree-cell pm-tree-cell-name">包名</div>
          <div className="pm-tree-cell pm-version-range">版本范围</div>
          <div className="pm-tree-cell">已安装版本</div>
          <div className="pm-tree-cell">协议</div>
          <div className="pm-tree-cell">大小</div>
        </div>
        <div className="pm-tree-body">
          {visibleRows.length === 0 ? (
            <div className="pm-empty">暂无匹配的依赖</div>
          ) : (
            visibleRows.map((dep) => (
              <DependencyRow
                key={dep.id || dep.name}
                dep={dep}
                expanded={!!expandedNodes[dep.id || dep.name]}
                onToggleExpand={onToggleExpand}
                selected={selectedUpgrades.has(dep.name)}
                onToggleSelect={onToggleSelect}
                onSelectPackage={onSelectPackage}
              />
            ))
          )}
        </div>
      </div>
    </div>
  )
}
