import { useCallback, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import './package-manager.css'
import { TAB_TYPE, VIEW_MODE } from './constants.js'
import { getMockDependencies, getMockDevDependencies, getMockOperationHistory } from './mockData.js'
import DependencyTree from './DependencyTree.jsx'
import UpgradePanel from './UpgradePanel.jsx'
import DependencyGraph from './DependencyGraph.jsx'
import LockDiff from './LockDiff.jsx'
import PackageDetail from './PackageDetail.jsx'
import UpgradeConfirmModal from './UpgradeConfirmModal.jsx'
import OperationHistory from './OperationHistory.jsx'
import {
  applyUpgrades,
  calculateLatestVersion,
  collectAllDependencies,
  collectUpgradable,
  getCompatibleVersion,
  generateOperationSummary,
} from './packageUtils.js'

export default function PackageManagerPage() {
  const [dependencies, setDependencies] = useState(() => getMockDependencies())
  const [devDependencies, setDevDependencies] = useState(() => getMockDevDependencies())
  const [operationHistory, setOperationHistory] = useState(() => getMockOperationHistory())

  const [activeTab, setActiveTab] = useState(TAB_TYPE.DEPENDENCIES)
  const [viewMode, setViewMode] = useState(VIEW_MODE.TREE)
  const [searchKeyword, setSearchKeyword] = useState('')
  const [expandedNodes, setExpandedNodes] = useState({})
  const [selectedUpgrades, setSelectedUpgrades] = useState(new Set())
  const [selectedPackage, setSelectedPackage] = useState(null)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [checkingUpdates, setCheckingUpdates] = useState(false)

  const currentDeps = activeTab === TAB_TYPE.DEPENDENCIES ? dependencies : devDependencies

  const allDeps = useMemo(() => {
    return [...dependencies, ...devDependencies]
  }, [dependencies, devDependencies])

  const allUpgradedDeps = useMemo(() => {
    const upgradeMap = new Map()
    for (const name of selectedUpgrades) {
      const allFlat = collectAllDependencies(allDeps)
      const dep = allFlat.find((d) => d.name === name)
      if (dep) {
        upgradeMap.set(name, {
          name,
          targetVersion: getCompatibleVersion(dep.versionRange, dep.latestVersion),
        })
      }
    }
    return upgradeMap
  }, [selectedUpgrades, allDeps])

  const upgradedDepsPreview = useMemo(() => {
    return applyUpgrades(dependencies, allUpgradedDeps)
  }, [dependencies, allUpgradedDeps])

  const upgradedDevDepsPreview = useMemo(() => {
    return applyUpgrades(devDependencies, allUpgradedDeps)
  }, [devDependencies, allUpgradedDeps])

  const upgradeList = useMemo(() => {
    const result = []
    for (const name of selectedUpgrades) {
      const allFlat = collectAllDependencies(allDeps)
      const dep = allFlat.find((d) => d.name === name)
      if (dep) {
        result.push({
          name,
          currentVersion: dep.installedVersion || dep.version,
          targetVersion: getCompatibleVersion(dep.versionRange, dep.latestVersion),
        })
      }
    }
    return result
  }, [selectedUpgrades, allDeps])

  const handleToggleExpand = useCallback((nodeId) => {
    setExpandedNodes((prev) => ({
      ...prev,
      [nodeId]: !prev[nodeId],
    }))
  }, [])

  const handleToggleSelect = useCallback((name) => {
    setSelectedUpgrades((prev) => {
      const next = new Set(prev)
      if (next.has(name)) {
        next.delete(name)
      } else {
        next.add(name)
      }
      return next
    })
  }, [])

  const handleSelectAllUpgradable = useCallback(() => {
    const upgradable = collectUpgradable(currentDeps)
    setSelectedUpgrades((prev) => {
      const next = new Set(prev)
      for (const dep of upgradable) {
        next.add(dep.name)
      }
      return next
    })
  }, [currentDeps])

  const handleRemoveFromUpgrade = useCallback((name) => {
    setSelectedUpgrades((prev) => {
      const next = new Set(prev)
      next.delete(name)
      return next
    })
  }, [])

  const handleClearUpgrades = useCallback(() => {
    setSelectedUpgrades(new Set())
  }, [])

  const handleCheckUpdates = useCallback(() => {
    setCheckingUpdates(true)
    setTimeout(() => {
      const refresh = (list) => {
        return list.map((dep) => {
          const hasNew = Math.random() > 0.4
          const newLatest = hasNew
            ? calculateLatestVersion(dep.installedVersion || dep.version)
            : dep.latestVersion
          const newChildren = dep.dependencies ? refresh(dep.dependencies) : dep.dependencies
          return { ...dep, latestVersion: newLatest, dependencies: newChildren }
        })
      }
      setDependencies((prev) => refresh(prev))
      setDevDependencies((prev) => refresh(prev))
      setCheckingUpdates(false)
    }, 800)
  }, [])

  const handleSelectPackage = useCallback((pkgOrId) => {
    if (typeof pkgOrId === 'string') {
      const allFlat = collectAllDependencies(allDeps)
      const dep = allFlat.find((d) => d.name === pkgOrId)
      setSelectedPackage(dep || null)
    } else {
      setSelectedPackage(pkgOrId || null)
    }
  }, [allDeps])

  const handleConfirmUpgrade = useCallback(() => {
    const upgradeMap = new Map()
    for (const item of upgradeList) {
      upgradeMap.set(item.name, { name: item.name, targetVersion: item.targetVersion })
    }

    setDependencies((prev) => applyUpgrades(prev, upgradeMap))
    setDevDependencies((prev) => applyUpgrades(prev, upgradeMap))

    const newHistory = {
      id: `op-${Date.now()}`,
      timestamp: Date.now(),
      type: 'upgrade',
      packageCount: upgradeList.length,
      summary: generateOperationSummary(upgradeList),
    }
    setOperationHistory((prev) => [newHistory, ...prev])

    setSelectedUpgrades(new Set())
    setShowUpgradeModal(false)
  }, [upgradeList])

  const handleSingleUpgrade = useCallback((pkg) => {
    setSelectedUpgrades((prev) => new Set([...prev, pkg.name]))
    setTimeout(() => setShowUpgradeModal(true), 50)
  }, [])

  const canUpgrade = selectedUpgrades.size > 0

  return (
    <div className="pm-page">
      <header className="pm-header">
        <Link to="/" className="pm-back-link">← 返回首页</Link>
        <div className="pm-header-content">
          <h1 className="pm-title">📦 包管理器</h1>
          <p className="pm-subtitle">模拟 npm/yarn 依赖管理后台</p>
        </div>
        <div className="pm-header-actions">
          <button
            type="button"
            className="pm-btn pm-btn-primary"
            onClick={() => setShowUpgradeModal(true)}
            disabled={!canUpgrade}
          >
            一键升级 ({selectedUpgrades.size})
          </button>
        </div>
      </header>

      <div className="pm-view-switcher">
        <button
          type="button"
          className={`pm-view-btn ${viewMode === VIEW_MODE.TREE ? 'active' : ''}`}
          onClick={() => setViewMode(VIEW_MODE.TREE)}
        >
          📋 依赖列表
        </button>
        <button
          type="button"
          className={`pm-view-btn ${viewMode === VIEW_MODE.GRAPH ? 'active' : ''}`}
          onClick={() => setViewMode(VIEW_MODE.GRAPH)}
        >
          🕸️ 依赖关系图
        </button>
        <button
          type="button"
          className={`pm-view-btn ${viewMode === VIEW_MODE.LOCK_DIFF ? 'active' : ''}`}
          onClick={() => setViewMode(VIEW_MODE.LOCK_DIFF)}
        >
          📝 Lock 文件 Diff
        </button>
        <button
          type="button"
          className={`pm-view-btn ${viewMode === VIEW_MODE.HISTORY ? 'active' : ''}`}
          onClick={() => setViewMode(VIEW_MODE.HISTORY)}
        >
          📜 操作历史
        </button>
      </div>

      <div className="pm-main-layout">
        <div className="pm-content-area">
          {checkingUpdates && (
            <div className="pm-checking-overlay">
              <div className="pm-spinner"></div>
              <span>正在检查更新...</span>
            </div>
          )}

          {viewMode === VIEW_MODE.TREE && (
            <DependencyTree
              dependencies={currentDeps}
              activeTab={activeTab}
              onTabChange={setActiveTab}
              searchKeyword={searchKeyword}
              onSearchChange={setSearchKeyword}
              expandedNodes={expandedNodes}
              onToggleExpand={handleToggleExpand}
              selectedUpgrades={selectedUpgrades}
              onToggleSelect={handleToggleSelect}
              onSelectAllUpgradable={handleSelectAllUpgradable}
              onCheckUpdates={handleCheckUpdates}
              onSelectPackage={handleSelectPackage}
            />
          )}

          {viewMode === VIEW_MODE.GRAPH && (
            <DependencyGraph
              dependencies={allDeps}
              selectedPackage={selectedPackage?.name || null}
              onSelectPackage={handleSelectPackage}
            />
          )}

          {viewMode === VIEW_MODE.LOCK_DIFF && (
            <LockDiff
              dependencies={dependencies}
              devDependencies={devDependencies}
              upgradedDependencies={upgradedDepsPreview}
              upgradedDevDependencies={upgradedDevDepsPreview}
            />
          )}

          {viewMode === VIEW_MODE.HISTORY && (
            <OperationHistory history={operationHistory} />
          )}
        </div>

        {viewMode === VIEW_MODE.TREE && (
          <div className="pm-side-panel">
            <UpgradePanel
              upgrades={upgradeList}
              onRemove={handleRemoveFromUpgrade}
              onClear={handleClearUpgrades}
            />
            <PackageDetail
              pkg={selectedPackage}
              onClose={() => setSelectedPackage(null)}
              onUpgrade={handleSingleUpgrade}
            />
          </div>
        )}

        {viewMode === VIEW_MODE.GRAPH && (
          <div className="pm-side-panel">
            <PackageDetail
              pkg={selectedPackage}
              onClose={() => setSelectedPackage(null)}
              onUpgrade={handleSingleUpgrade}
            />
          </div>
        )}
      </div>

      <UpgradeConfirmModal
        isOpen={showUpgradeModal}
        upgrades={upgradeList}
        onConfirm={handleConfirmUpgrade}
        onCancel={() => setShowUpgradeModal(false)}
      />
    </div>
  )
}
