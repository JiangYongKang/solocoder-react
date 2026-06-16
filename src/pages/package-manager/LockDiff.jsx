import { useRef, useMemo } from 'react'
import { buildLockEntries, diffLockEntries, formatSize } from './packageUtils.js'
import { CHANGE_TYPE } from './constants.js'

function LockDiffRow({ change, side }) {
  const entry = side === 'left' ? change.old : change.new

  let rowClass = 'pm-lock-row'
  let prefix = ' '
  if (change.type === CHANGE_TYPE.UPGRADED) {
    rowClass += side === 'left' ? ' pm-lock-downgrade' : ' pm-lock-upgrade'
  } else if (change.type === CHANGE_TYPE.DOWNGRADED) {
    rowClass += side === 'left' ? ' pm-lock-upgrade' : ' pm-lock-downgrade'
  } else if (change.type === CHANGE_TYPE.ADDED) {
    if (side === 'right') {
      rowClass += ' pm-lock-added'
      prefix = '+'
    }
  } else if (change.type === CHANGE_TYPE.REMOVED) {
    if (side === 'left') {
      rowClass += ' pm-lock-removed'
      prefix = '-'
    }
  }

  if (!entry) {
    return <div className={`${rowClass} pm-lock-empty`}>&nbsp;</div>
  }

  return (
    <div className={rowClass}>
      <span className="pm-lock-prefix">{prefix}</span>
      <span className="pm-lock-name">{entry.name}</span>
      <span className="pm-lock-version">@{entry.version}</span>
      <span className="pm-lock-license">{entry.license}</span>
      <span className="pm-lock-size">{formatSize(entry.size)}</span>
    </div>
  )
}

export default function LockDiff({ dependencies, devDependencies, upgradedDependencies, upgradedDevDependencies }) {
  const leftRef = useRef(null)
  const rightRef = useRef(null)
  const syncingRef = useRef(false)

  const allOldDeps = useMemo(() => [...dependencies, ...devDependencies], [dependencies, devDependencies])
  const allNewDeps = useMemo(() => [...upgradedDependencies, ...upgradedDevDependencies], [upgradedDependencies, upgradedDevDependencies])

  const oldEntries = useMemo(() => buildLockEntries(allOldDeps), [allOldDeps])
  const newEntries = useMemo(
    () => buildLockEntries(allNewDeps),
    [allNewDeps]
  )

  const { changes, stats } = useMemo(
    () => diffLockEntries(oldEntries, newEntries),
    [oldEntries, newEntries]
  )

  const handleScroll = (e) => {
    if (syncingRef.current) return
    syncingRef.current = true
    const target = e.target === leftRef.current ? rightRef.current : leftRef.current
    if (target) {
      target.scrollTop = e.target.scrollTop
    }
    requestAnimationFrame(() => {
      syncingRef.current = false
    })
  }

  return (
    <div className="pm-lockdiff-container">
      <div className="pm-lockdiff-header">
        <h3>Lock 文件 Diff</h3>
        <div className="pm-lockdiff-stats">
          <span className="pm-stat pm-stat-upgrade">{stats.upgraded} 个升级</span>
          <span className="pm-stat pm-stat-downgrade">{stats.downgraded} 个降级</span>
          <span className="pm-stat pm-stat-added">{stats.added} 个新增</span>
          <span className="pm-stat pm-stat-removed">{stats.removed} 个移除</span>
        </div>
      </div>

      <div className="pm-lockdiff-headers-row">
        <div className="pm-lockdiff-header-col">
          <span className="pm-lockdiff-col-title">当前版本 (package-lock.json)</span>
        </div>
        <div className="pm-lockdiff-header-col">
          <span className="pm-lockdiff-col-title">升级后版本</span>
        </div>
      </div>

      <div className="pm-lockdiff-content">
        <div
          className="pm-lockdiff-pane"
          ref={leftRef}
          onScroll={handleScroll}
        >
          <div className="pm-lockdiff-pane-header">
            <span className="pm-lock-prefix">&nbsp;</span>
            <span className="pm-lock-name">包名</span>
            <span className="pm-lock-version">版本</span>
            <span className="pm-lock-license">协议</span>
            <span className="pm-lock-size">大小</span>
          </div>
          {changes.map((change) => (
            <LockDiffRow key={change.name + '-l'} change={change} side="left" />
          ))}
        </div>

        <div
          className="pm-lockdiff-pane"
          ref={rightRef}
          onScroll={handleScroll}
        >
          <div className="pm-lockdiff-pane-header">
            <span className="pm-lock-prefix">&nbsp;</span>
            <span className="pm-lock-name">包名</span>
            <span className="pm-lock-version">版本</span>
            <span className="pm-lock-license">协议</span>
            <span className="pm-lock-size">大小</span>
          </div>
          {changes.map((change) => (
            <LockDiffRow key={change.name + '-r'} change={change} side="right" />
          ))}
        </div>
      </div>
    </div>
  )
}
