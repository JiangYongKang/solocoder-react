import { useMemo } from 'react'
import { sortReleasesByVersion, buildReleaseDiff, getDiffStats, isDiffTooLarge, truncateTextForDiff, DIFF_TYPE_INTERNAL } from '../utils.js'

function getRowBgClass(type) {
  switch (type) {
    case DIFF_TYPE_INTERNAL.ADDED:
      return 'rm-diff-added'
    case DIFF_TYPE_INTERNAL.REMOVED:
      return 'rm-diff-removed'
    case DIFF_TYPE_INTERNAL.MODIFIED:
      return 'rm-diff-modified'
    default:
      return ''
  }
}

export default function DiffPanel({
  open,
  allReleases,
  baseRelease,
  compareRelease,
  onSelectCompare,
  onSwap,
  onClose,
}) {
  const sortedReleases = useMemo(() => sortReleasesByVersion(allReleases, true), [allReleases])

  const tooLarge = useMemo(() => {
    if (!baseRelease || !compareRelease) return false
    return isDiffTooLarge(baseRelease.changelog || '', compareRelease.changelog || '')
  }, [baseRelease, compareRelease])

  const diffResult = useMemo(() => {
    if (!baseRelease || !compareRelease) return null
    const oldText = truncateTextForDiff(baseRelease.changelog || '')
    const newText = truncateTextForDiff(compareRelease.changelog || '')
    return buildReleaseDiff(oldText, newText)
  }, [baseRelease, compareRelease])

  const diffStats = useMemo(() => {
    if (!diffResult) return null
    return getDiffStats(diffResult.lineDiff)
  }, [diffResult])

  if (!open) return null

  return (
    <div className="rm-modal-overlay" onClick={onClose}>
      <div className="rm-modal rm-modal-xxl" onClick={(e) => e.stopPropagation()}>
        <div className="rm-modal-header">
          <h3>版本差异对比</h3>
          <button className="rm-close-btn" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="rm-modal-body">
          <div className="rm-diff-selectors">
            <div className="rm-diff-selector-item">
              <label className="rm-form-label">基准版本</label>
              <select
                className="rm-input"
                value={baseRelease?.id || ''}
                onChange={(e) => {
                  if (e.target.value && compareRelease && e.target.value === compareRelease.id) {
                    onSwap()
                  } else {
                    const rel = allReleases.find((r) => r.id === e.target.value)
                    if (rel) {
                      onSelectCompare('base', rel)
                    }
                  }
                }}
              >
                <option value="">请选择基准版本</option>
                {sortedReleases.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.version} - {r.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="rm-diff-swap-btn">
              <button className="rm-btn rm-btn-default" onClick={onSwap} disabled={!compareRelease}>
                ⇄ 交换
              </button>
            </div>

            <div className="rm-diff-selector-item">
              <label className="rm-form-label">对比版本</label>
              <select
                className="rm-input"
                value={compareRelease?.id || ''}
                onChange={(e) => {
                  if (e.target.value && baseRelease && e.target.value === baseRelease.id) {
                    onSwap()
                  } else {
                    const rel = allReleases.find((r) => r.id === e.target.value)
                    if (rel) {
                      onSelectCompare('compare', rel)
                    }
                  }
                }}
              >
                <option value="">请选择对比版本</option>
                {sortedReleases.map((r) => (
                  <option
                    key={r.id}
                    value={r.id}
                    disabled={baseRelease && r.id === baseRelease.id}
                  >
                    {r.version} - {r.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {diffStats && (
            <div className="rm-diff-stats">
              <span className="rm-diff-stat-item">
                新增: <strong style={{ color: '#10b981' }}>+{diffStats.added}</strong>
              </span>
              <span className="rm-diff-stat-item">
                删除: <strong style={{ color: '#ef4444' }}>-{diffStats.removed}</strong>
              </span>
              <span className="rm-diff-stat-item">
                修改: <strong style={{ color: '#f59e0b' }}>~{diffStats.modified}</strong>
              </span>
              <span className="rm-diff-stat-item">
                相同: <strong>{diffStats.equal}</strong>
              </span>
              {tooLarge && (
                <span className="rm-diff-stat-item rm-diff-warning">
                  ⚠️ 文本过长已截断对比
                </span>
              )}
            </div>
          )}

          {!baseRelease || !compareRelease ? (
            <div className="rm-empty-block" style={{ minHeight: 300 }}>
              请选择两个版本进行差异对比
            </div>
          ) : diffResult && diffResult.lineDiff.length === 0 ? (
            <div className="rm-empty-block" style={{ minHeight: 300 }}>
              两个版本的变更日志均为空，无差异
            </div>
          ) : diffResult ? (
            <div className="rm-diff-container">
              <div className="rm-diff-panel">
                <div className="rm-diff-panel-header">
                  <strong>{baseRelease.version}</strong>
                  <span className="rm-diff-subtitle">{baseRelease.title}</span>
                </div>
                {baseRelease.changelog ? (
                  <div className="rm-diff-code">
                    {diffResult.leftRows.map((row, idx) => (
                      <div
                        key={idx}
                        className={`rm-diff-line ${getRowBgClass(row.type)} ${row.empty ? 'rm-diff-empty' : ''}`}
                      >
                        <span className="rm-diff-line-num">{row.lineNum || ''}</span>
                        <span className="rm-diff-line-content">{row.content || '\u00A0'}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rm-empty-block">该版本无变更日志</div>
                )}
              </div>

              <div className="rm-diff-panel">
                <div className="rm-diff-panel-header">
                  <strong>{compareRelease.version}</strong>
                  <span className="rm-diff-subtitle">{compareRelease.title}</span>
                </div>
                {compareRelease.changelog ? (
                  <div className="rm-diff-code">
                    {diffResult.rightRows.map((row, idx) => (
                      <div
                        key={idx}
                        className={`rm-diff-line ${getRowBgClass(row.type)} ${row.empty ? 'rm-diff-empty' : ''}`}
                      >
                        <span className="rm-diff-line-num">{row.lineNum || ''}</span>
                        <span className="rm-diff-line-content">{row.content || '\u00A0'}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rm-empty-block">该版本无变更日志</div>
                )}
              </div>
            </div>
          ) : null}
        </div>

        <div className="rm-modal-footer">
          <div className="rm-diff-legend">
            <span>
              <span className="rm-legend-swatch rm-legend-added" /> 新增行
            </span>
            <span>
              <span className="rm-legend-swatch rm-legend-removed" /> 删除行
            </span>
            <span>
              <span className="rm-legend-swatch rm-legend-modified" /> 修改行
            </span>
          </div>
          <div style={{ flex: 1 }} />
          <button type="button" className="rm-btn rm-btn-default" onClick={onClose}>
            关闭
          </button>
        </div>
      </div>
    </div>
  )
}
