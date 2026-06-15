import { useState } from 'react'
import { formatDate, diffContent, restoreVersion } from './wikiUtils.js'

export default function VersionSidebar({
  isOpen,
  onClose,
  page,
  data,
  onUpdateData,
}) {
  const [selectedVersions, setSelectedVersions] = useState([])
  const [showDiff, setShowDiff] = useState(false)

  if (!page?.versions) return null

  const toggleVersionSelection = (versionId) => {
    setSelectedVersions((prev) => {
      if (prev.includes(versionId)) {
        return prev.filter((id) => id !== versionId)
      }
      if (prev.length >= 2) {
        return [prev[1], versionId]
      }
      return [...prev, versionId]
    })
  }

  const handleShowDiff = () => {
    if (selectedVersions.length === 2) {
      setShowDiff(true)
    }
  }

  const handleRestore = (versionId) => {
    if (confirm('确定要恢复到此版本吗？当前内容将被覆盖。')) {
      const newData = restoreVersion(data, page.id, versionId)
      onUpdateData?.(newData)
      onClose?.()
    }
  }

  const getDiffContent = () => {
    if (selectedVersions.length !== 2) return { oldHtml: '', newHtml: '' }
    const v1 = page.versions.find((v) => v.id === selectedVersions[0])
    const v2 = page.versions.find((v) => v.id === selectedVersions[1])
    if (!v1 || !v2) return { oldHtml: '', newHtml: '' }
    return diffContent(v1.content, v2.content)
  }

  const diffContentHtml = getDiffContent()

  return (
    <>
      <aside className={`wiki-version-sidebar ${isOpen ? 'open' : ''}`}>
        <div className="wiki-version-header">
          <span className="wiki-version-title">历史版本</span>
          <button className="wiki-icon-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="wiki-version-list">
          {page.versions.slice().reverse().map((version) => (
            <div
              key={version.id}
              className={`wiki-version-item ${selectedVersions.includes(version.id) ? 'selected' : ''}`}
              onClick={() => toggleVersionSelection(version.id)}
            >
              <div className="wiki-version-item-header">
                <span className="wiki-version-number">版本 {version.version}</span>
                <span className="wiki-version-date">
                  {formatDate(version.createdAt)}
                </span>
              </div>
              <div className="wiki-version-subtitle">{version.title}</div>
            </div>
          ))}
        </div>

        <div className="wiki-version-actions">
          <button
            className="wiki-btn wiki-btn-secondary wiki-btn-sm"
            onClick={handleShowDiff}
            disabled={selectedVersions.length !== 2}
          >
            对比差异 ({selectedVersions.length}/2)
          </button>
        </div>
      </aside>

      {showDiff && (
        <div className="wiki-modal-overlay" onClick={() => setShowDiff(false)}>
          <div
            className="wiki-diff-container"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="wiki-diff-header">
              <span className="wiki-version-title">版本对比</span>
              <button className="wiki-icon-btn" onClick={() => setShowDiff(false)}>
                ✕
              </button>
            </div>
            <div className="wiki-diff-panels">
              <div
                className="wiki-diff-panel"
                dangerouslySetInnerHTML={{ __html: diffContentHtml.oldHtml }}
              />
              <div
                className="wiki-diff-panel"
                dangerouslySetInnerHTML={{ __html: diffContentHtml.newHtml }}
              />
            </div>
            <div className="wiki-modal-footer">
              {selectedVersions[0] && (
                <button
                  className="wiki-btn wiki-btn-secondary wiki-btn-sm"
                  onClick={() => handleRestore(selectedVersions[0])}
                >
                  恢复到版本 {page.versions.find((v) => v.id === selectedVersions[0])?.version}
                </button>
              )}
              {selectedVersions[1] && (
                <button
                  className="wiki-btn wiki-btn-primary wiki-btn-sm"
                  onClick={() => handleRestore(selectedVersions[1])}
                >
                  恢复到版本 {page.versions.find((v) => v.id === selectedVersions[1])?.version}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
