import { useState, useMemo, useCallback } from 'react'
import { Link } from 'react-router-dom'
import './git-browser.css'
import { BRANCHES, FILE_CHANGE_STATUS, FILE_TYPE, VIEW_MODE, DIFF_VIEW_MODE } from './constants'
import { getFileTreeForBranch, getCommitHistoryForBranch, getBaseFileContents, getBaseFileList } from './mockData'
import {
  getChangeStatusIcon,
  getChangeStatusColor,
  getChangeStatusLabel,
  getAllFilesFromTree,
  getChangedFilesFromTree,
  expandFoldersToFile,
  folderContainsFile,
  formatTimestamp,
  shortHash,
  stageFile,
  unstageFile,
  isFileStaged,
  computeFileStats,
  sortTreeChildren,
  filterFileTree,
  generateOriginalContent,
  buildFileTreeFromList,
  computeCommitFileSnapshot,
} from './gitUtils'
import {
  DIFF_TYPE,
  buildSideBySideDiff,
  splitLines,
} from './diffUtils'

const renderCharDiff = (charDiff) => {
  if (!charDiff || charDiff.length === 0) return null
  return charDiff.map((segment, idx) => {
    let className = ''
    if (segment.type === DIFF_TYPE.ADDED) {
      className = 'gb-char-added'
    } else if (segment.type === DIFF_TYPE.REMOVED) {
      className = 'gb-char-deleted'
    }
    if (className) {
      return (
        <span key={idx} className={className}>
          {segment.value}
        </span>
      )
    }
    return <span key={idx}>{segment.value}</span>
  })
}

const getDiffLineClass = (type) => {
  switch (type) {
    case DIFF_TYPE.ADDED:
      return 'added'
    case DIFF_TYPE.REMOVED:
      return 'deleted'
    case DIFF_TYPE.MODIFIED:
      return 'modified'
    default:
      return ''
  }
}

const TreeNode = ({ node, level, selectedFile, onSelect, expanded, onToggle, searchTerm }) => {
  const isFolder = node.type === FILE_TYPE.FOLDER
  const isExpanded = expanded.has(node.id)
  const isSelected = selectedFile?.id === node.id
  const hasChildren = isFolder && node.children && node.children.length > 0

  const handleClick = () => {
    if (isFolder) {
      onToggle(node.id)
    } else {
      onSelect(node)
    }
  }

  const statusIcon = getChangeStatusIcon(node.status)
  const statusColor = getChangeStatusColor(node.status)
  const folderIcon = isExpanded ? '📂' : '📁'

  return (
    <div className="gb-tree-node" style={{ paddingLeft: level * 4 }}>
      <div
        className={`gb-tree-row ${isSelected ? 'selected' : ''}`}
        onClick={handleClick}
      >
        <span className={`gb-tree-toggle ${!hasChildren ? 'empty' : ''}`}>
          {hasChildren && (isExpanded ? '▼' : '▶')}
        </span>
        <span className="gb-tree-icon">{isFolder ? folderIcon : '📄'}</span>
        {statusIcon ? (
          <span
            className="gb-tree-status"
            style={{ color: statusColor, backgroundColor: statusColor + '20' }}
            title={getChangeStatusLabel(node.status)}
          >
            {statusIcon}
          </span>
        ) : (
          <span className="gb-tree-status" />
        )}
        <span className="gb-tree-name">{node.name}</span>
      </div>
      {isFolder && isExpanded && hasChildren && (
        <div className="gb-tree-children">
          {sortTreeChildren(node.children).map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              level={level + 1}
              selectedFile={selectedFile}
              onSelect={onSelect}
              expanded={expanded}
              onToggle={onToggle}
              searchTerm={searchTerm}
            />
          ))}
        </div>
      )}
    </div>
  )
}

const StageFileItem = ({ file, onAction, actionLabel, onDragStart, onDragEnd, isDragging, onDragOver, onDrop }) => {
  const statusIcon = getChangeStatusIcon(file.status)
  const statusColor = getChangeStatusColor(file.status)

  return (
    <div
      className={`gb-stage-file ${isDragging ? 'dragging' : ''}`}
      draggable
      onDragStart={(e) => onDragStart(e, file)}
      onDragEnd={onDragEnd}
      onDragOver={onDragOver}
      onDrop={(e) => onDrop(e, file)}
    >
      <span
        className="gb-stage-status"
        style={{ color: statusColor, backgroundColor: statusColor + '20' }}
      >
        {statusIcon}
      </span>
      <span className="gb-stage-name" title={file.path}>
        {file.path}
      </span>
      <button
        type="button"
        className="gb-stage-action"
        onClick={() => onAction(file)}
        title={actionLabel}
      >
        {actionLabel}
      </button>
    </div>
  )
}

const GitBrowserPage = () => {
  const [currentBranch, setCurrentBranch] = useState(BRANCHES[0].name)
  const [branchDropdownOpen, setBranchDropdownOpen] = useState(false)
  const [selectedFile, setSelectedFile] = useState(null)
  const [viewMode, setViewMode] = useState(VIEW_MODE.CONTENT)
  const [diffViewMode, setDiffViewMode] = useState(DIFF_VIEW_MODE.SIDE_BY_SIDE)
  const [expanded, setExpanded] = useState(() => new Set())
  const [stagedFiles, setStagedFiles] = useState([])
  const [selectedCommit, setSelectedCommit] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [draggedFile, setDraggedFile] = useState(null)

  const baseFileTree = useMemo(() => getFileTreeForBranch(currentBranch), [currentBranch])
  const commitHistory = useMemo(() => getCommitHistoryForBranch(currentBranch), [currentBranch])
  const baseFileContents = useMemo(() => getBaseFileContents(), [])
  const baseFileList = useMemo(() => getBaseFileList(currentBranch), [currentBranch])

  const commitFileList = useMemo(() => {
    if (!selectedCommit) return null
    return computeCommitFileSnapshot(commitHistory, selectedCommit.hash, baseFileList)
  }, [commitHistory, selectedCommit, baseFileList])

  const commitFileTree = useMemo(() => {
    if (!commitFileList) return null
    return buildFileTreeFromList(commitFileList, baseFileContents)
  }, [commitFileList, baseFileContents])

  const fileTree = useMemo(() => commitFileTree || baseFileTree, [commitFileTree, baseFileTree])

  const allFiles = useMemo(() => getAllFilesFromTree(fileTree), [fileTree])
  const changedFiles = useMemo(
    () =>
      getChangedFilesFromTree(fileTree, [
        FILE_CHANGE_STATUS.ADDED,
        FILE_CHANGE_STATUS.MODIFIED,
        FILE_CHANGE_STATUS.DELETED,
      ]),
    [fileTree]
  )
  const unstagedFiles = useMemo(
    () => changedFiles.filter((f) => !isFileStaged(stagedFiles, f.path)),
    [changedFiles, stagedFiles]
  )

  const fileStats = useMemo(() => computeFileStats(allFiles), [allFiles])

  const filteredTree = useMemo(() => {
    if (!searchTerm.trim()) return fileTree
    return filterFileTree(fileTree, searchTerm)
  }, [fileTree, searchTerm])

  const computedExpanded = useMemo(() => {
    const result = new Set(expanded)

    if (searchTerm.trim()) {
      const collectFolders = (node) => {
        if (node.type === FILE_TYPE.FOLDER) {
          const hasMatch = folderContainsFile(node, searchTerm) || node.name.toLowerCase().includes(searchTerm.toLowerCase())
          if (hasMatch) {
            result.add(node.id)
          }
          if (node.children) {
            node.children.forEach(collectFolders)
          }
        }
      }
      collectFolders(fileTree)
    }

    if (selectedFile) {
      expandFoldersToFile(fileTree, selectedFile.path, result)
    }

    return result
  }, [fileTree, searchTerm, selectedFile, expanded])

  const handleToggleFolder = useCallback((folderId) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(folderId)) {
        next.delete(folderId)
      } else {
        next.add(folderId)
      }
      return next
    })
  }, [])

  const handleSelectFile = useCallback((file) => {
    setSelectedFile(file)
    setViewMode(VIEW_MODE.CONTENT)
  }, [])

  const handleSelectCommit = useCallback((commit) => {
    setSelectedCommit((prev) => {
      const next = prev?.hash === commit.hash ? null : commit
      return next
    })
    setSelectedFile(null)
  }, [])

  const handleSwitchBranch = useCallback((branchName) => {
    setCurrentBranch(branchName)
    setSelectedFile(null)
    setStagedFiles([])
    setSelectedCommit(null)
    setBranchDropdownOpen(false)
    setExpanded(new Set())
  }, [])

  const handleStageFile = useCallback((file) => {
    setStagedFiles((prev) => stageFile(prev, file))
  }, [])

  const handleUnstageFile = useCallback((file) => {
    setStagedFiles((prev) => unstageFile(prev, file.path))
  }, [])

  const handleDragStart = useCallback((e, file) => {
    setDraggedFile(file)
    e.dataTransfer.effectAllowed = 'move'
  }, [])

  const handleDragEnd = useCallback(() => {
    setDraggedFile(null)
  }, [])

  const handleDragOver = useCallback((e) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }, [])

  const handleDropStaged = useCallback(
    (e) => {
      e.preventDefault()
      if (draggedFile && !isFileStaged(stagedFiles, draggedFile.path)) {
        handleStageFile(draggedFile)
      }
      setDraggedFile(null)
    },
    [draggedFile, stagedFiles, handleStageFile]
  )

  const handleDropUnstaged = useCallback(
    (e) => {
      e.preventDefault()
      if (draggedFile && isFileStaged(stagedFiles, draggedFile.path)) {
        handleUnstageFile(draggedFile)
      }
      setDraggedFile(null)
    },
    [draggedFile, stagedFiles, handleUnstageFile]
  )

  const diffResult = useMemo(() => {
    if (!selectedFile || selectedFile.status === FILE_CHANGE_STATUS.UNCHANGED) {
      return null
    }
    const originalContent = generateOriginalContent(selectedFile)
    return buildSideBySideDiff(originalContent, selectedFile.content || '')
  }, [selectedFile])

  const renderFileContent = () => {
    if (!selectedFile) {
      return (
        <div className="gb-file-empty">
          <div className="gb-file-empty-icon">📄</div>
          <div className="gb-file-empty-text">选择一个文件以查看内容</div>
        </div>
      )
    }

    if (viewMode === VIEW_MODE.CONTENT) {
      const lines = splitLines(selectedFile.content || '')
      return (
        <div className="gb-code-view">
          <div className="gb-code-grid">
            {lines.map((line, idx) => (
              <div key={idx} style={{ display: 'contents' }}>
                <div className="gb-code-line-num">{idx + 1}</div>
                <div className="gb-code-line-content">{line || '\u00A0'}</div>
              </div>
            ))}
          </div>
        </div>
      )
    }

    if (!diffResult) {
      return (
        <div className="gb-file-empty">
          <div className="gb-file-empty-icon">✓</div>
          <div className="gb-file-empty-text">该文件没有变更</div>
        </div>
      )
    }

    if (diffViewMode === DIFF_VIEW_MODE.SIDE_BY_SIDE) {
      const { leftRows, rightRows } = diffResult
      const rowCount = Math.max(leftRows.length, rightRows.length)
      return (
        <div className="gb-diff-view">
          <div className="gb-diff-header-row side-by-side">
            <div className="gb-diff-header-col">#</div>
            <div className="gb-diff-header-col">原始</div>
            <div className="gb-diff-header-col">#</div>
            <div className="gb-diff-header-col">变更后</div>
          </div>
          <div className="gb-diff-side-by-side">
            {Array.from({ length: rowCount }).map((_, i) => {
              const leftRow = leftRows[i] || {}
              const rightRow = rightRows[i] || {}
              const lineClass = getDiffLineClass(
                leftRow.type !== DIFF_TYPE.EQUAL ? leftRow.type : rightRow.type
              )
              return (
                <div key={i} style={{ display: 'contents' }}>
                  <div className={`gb-diff-line-num ${!leftRow.lineNum ? 'empty' : ''}`}>
                    {leftRow.lineNum || ''}
                  </div>
                  <div className={`gb-diff-line-content ${leftRow.empty ? 'empty' : ''} ${lineClass}`}>
                    {leftRow.charDiff ? renderCharDiff(leftRow.charDiff) : (leftRow.content || '\u00A0')}
                  </div>
                  <div className={`gb-diff-line-num ${!rightRow.lineNum ? 'empty' : ''}`}>
                    {rightRow.lineNum || ''}
                  </div>
                  <div className={`gb-diff-line-content ${rightRow.empty ? 'empty' : ''} ${lineClass}`}>
                    {rightRow.charDiff ? renderCharDiff(rightRow.charDiff) : (rightRow.content || '\u00A0')}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )
    }

    const { unifiedRows } = diffResult
    return (
      <div className="gb-diff-view">
        <div className="gb-diff-header-row unified">
          <div className="gb-diff-header-col">原</div>
          <div className="gb-diff-header-col">新</div>
          <div className="gb-diff-header-col" />
          <div className="gb-diff-header-col">内容</div>
        </div>
        <div className="gb-diff-unified">
          {unifiedRows.map((row, idx) => {
            const lineClass = getDiffLineClass(row.type)
            const prefixClass = row.prefix === '+' ? 'added' : row.prefix === '-' ? 'deleted' : ''
            return (
              <div key={idx} style={{ display: 'contents' }}>
                <div className={`gb-diff-line-num ${!row.leftLineNum ? 'empty' : ''}`}>
                  {row.leftLineNum || ''}
                </div>
                <div className={`gb-diff-line-num ${!row.rightLineNum ? 'empty' : ''}`}>
                  {row.rightLineNum || ''}
                </div>
                <div className={`gb-diff-prefix ${prefixClass}`}>{row.prefix}</div>
                <div className={`gb-diff-line-content ${lineClass}`}>
                  {row.charDiff ? renderCharDiff(row.charDiff) : (row.content || '\u00A0')}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  const hasChanges =
    selectedFile && selectedFile.status !== FILE_CHANGE_STATUS.UNCHANGED

  return (
    <div className="gb-page">
      <div className="gb-container">
        <header className="gb-header">
          <Link to="/" className="gb-back-btn">← 返回首页</Link>
          <h1 className="gb-title">
            Git 仓库浏览器
            {selectedCommit && (
              <span
                style={{
                  marginLeft: 8,
                  padding: '2px 10px',
                  borderRadius: 4,
                  fontSize: 12,
                  fontWeight: 500,
                  background: 'rgba(37, 99, 235, 0.12)',
                  color: '#2563eb',
                }}
              >
                查看提交 {shortHash(selectedCommit.hash)}
              </span>
            )}
          </h1>
          <div className="gb-stats">
            {fileStats.added > 0 && (
              <span className="gb-stat-badge added">+{fileStats.added}</span>
            )}
            {fileStats.modified > 0 && (
              <span className="gb-stat-badge modified">~{fileStats.modified}</span>
            )}
            {fileStats.deleted > 0 && (
              <span className="gb-stat-badge deleted">-{fileStats.deleted}</span>
            )}
          </div>
          <div className="gb-branch-selector">
            <button
              type="button"
              className="gb-branch-btn"
              onClick={() => setBranchDropdownOpen((v) => !v)}
            >
              <span className="gb-branch-icon">🌿</span>
              {currentBranch}
              <span>{branchDropdownOpen ? '▲' : '▼'}</span>
            </button>
            {branchDropdownOpen && (
              <div className="gb-branch-dropdown">
                {BRANCHES.map((branch) => (
                  <button
                    key={branch.name}
                    type="button"
                    className={`gb-branch-item ${branch.name === currentBranch ? 'active' : ''}`}
                    onClick={() => handleSwitchBranch(branch.name)}
                  >
                    <span className="gb-branch-icon">🌿</span>
                    {branch.name}
                    {branch.isDefault && <span style={{ marginLeft: 'auto', color: 'var(--gb-text-muted)', fontSize: '11px' }}>默认</span>}
                  </button>
                ))}
              </div>
            )}
          </div>
        </header>

        <div className="gb-main-layout">
          <div className="gb-panel">
            <div className="gb-panel-header">
              <h3 className="gb-panel-title">文件结构</h3>
              <span style={{ fontSize: '11px', color: 'var(--gb-text-muted)' }}>
                {allFiles.length} 个文件
              </span>
            </div>
            <div className="gb-tree-search">
              <input
                type="text"
                placeholder="搜索文件..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="gb-panel-body">
              <div className="gb-file-tree">
                {filteredTree ? (
                  filteredTree.children ? (
                    sortTreeChildren(filteredTree.children).map((child) => (
                      <TreeNode
                        key={child.id}
                        node={child}
                        level={0}
                        selectedFile={selectedFile}
                        onSelect={handleSelectFile}
                        expanded={computedExpanded}
                        onToggle={handleToggleFolder}
                        searchTerm={searchTerm}
                      />
                    ))
                  ) : null
                ) : (
                  <div className="gb-file-empty" style={{ minHeight: 200 }}>
                    <div className="gb-file-empty-text">未找到匹配的文件</div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="gb-panel gb-content-area">
            <div className="gb-content-header">
              <div className="gb-file-info">
                {selectedFile ? (
                  <>
                    <span style={{ fontSize: '16px' }}>📄</span>
                    <span className="gb-file-path">{selectedFile.path}</span>
                    {selectedFile.status !== FILE_CHANGE_STATUS.UNCHANGED && (
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: 600,
                          color: getChangeStatusColor(selectedFile.status),
                          backgroundColor: getChangeStatusColor(selectedFile.status) + '15',
                        }}
                      >
                        {getChangeStatusIcon(selectedFile.status)} {getChangeStatusLabel(selectedFile.status)}
                      </span>
                    )}
                  </>
                ) : (
                  <span className="gb-file-path" style={{ color: 'var(--gb-text-muted)' }}>
                    未选择文件
                  </span>
                )}
              </div>
              {selectedFile && (
                <div className="gb-content-tabs">
                  <button
                    type="button"
                    className={`gb-tab-btn ${viewMode === VIEW_MODE.CONTENT ? 'active' : ''}`}
                    onClick={() => setViewMode(VIEW_MODE.CONTENT)}
                  >
                    工作区内容
                  </button>
                  <button
                    type="button"
                    className={`gb-tab-btn ${viewMode === VIEW_MODE.DIFF ? 'active' : ''}`}
                    onClick={() => setViewMode(VIEW_MODE.DIFF)}
                    disabled={!hasChanges}
                    style={!hasChanges ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
                  >
                    变更 Diff
                  </button>
                  {viewMode === VIEW_MODE.DIFF && hasChanges && (
                    <>
                      <button
                        type="button"
                        className={`gb-tab-btn ${diffViewMode === DIFF_VIEW_MODE.SIDE_BY_SIDE ? 'active' : ''}`}
                        onClick={() => setDiffViewMode(DIFF_VIEW_MODE.SIDE_BY_SIDE)}
                      >
                        左右对比
                      </button>
                      <button
                        type="button"
                        className={`gb-tab-btn ${diffViewMode === DIFF_VIEW_MODE.UNIFIED ? 'active' : ''}`}
                        onClick={() => setDiffViewMode(DIFF_VIEW_MODE.UNIFIED)}
                      >
                        统一视图
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
            <div className="gb-content-body">{renderFileContent()}</div>
          </div>

          <div className="gb-panel gb-timeline-panel">
            <div className="gb-panel-header">
              <h3 className="gb-panel-title">提交历史</h3>
              <span style={{ fontSize: '11px', color: 'var(--gb-text-muted)' }}>
                {commitHistory.length} 条提交
              </span>
            </div>
            <div className="gb-panel-body">
              <div className="gb-timeline">
                {commitHistory.map((commit) => (
                  <div
                    key={commit.hash}
                    className={`gb-commit-item ${selectedCommit?.hash === commit.hash ? 'selected' : ''}`}
                    onClick={() => handleSelectCommit(commit)}
                  >
                    <div className="gb-commit-dot" />
                    <div className="gb-commit-content">
                      <div className="gb-commit-header">
                        <span className="gb-commit-hash">{shortHash(commit.hash)}</span>
                        <span className="gb-commit-time">{formatTimestamp(commit.timestamp)}</span>
                      </div>
                      <div className="gb-commit-message">{commit.message}</div>
                      <div className="gb-commit-author">
                        <span className="gb-commit-avatar">{commit.author.avatar}</span>
                        <span>{commit.author.name}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="gb-panel gb-bottom-panel">
            <div className="gb-panel-header">
              <h3 className="gb-panel-title">暂存变更</h3>
              <span style={{ fontSize: '11px', color: 'var(--gb-text-muted)' }}>
                点击或拖拽文件进行暂存/取消暂存
              </span>
            </div>
            <div className="gb-stage-panel">
              <div
                className="gb-stage-section"
                onDragOver={handleDragOver}
                onDrop={handleDropUnstaged}
              >
                <div className="gb-stage-header">
                  <span className="gb-stage-title">未暂存</span>
                  <span className="gb-stage-count">{unstagedFiles.length}</span>
                </div>
                <div className="gb-stage-list">
                  {unstagedFiles.length === 0 ? (
                    <div className="gb-stage-empty">所有变更已暂存</div>
                  ) : (
                    unstagedFiles.map((file) => (
                      <StageFileItem
                        key={file.path}
                        file={file}
                        onAction={handleStageFile}
                        actionLabel="→"
                        onDragStart={handleDragStart}
                        onDragEnd={handleDragEnd}
                        isDragging={draggedFile?.path === file.path}
                        onDragOver={handleDragOver}
                        onDrop={() => {}}
                      />
                    ))
                  )}
                </div>
              </div>

              <div
                className="gb-stage-section"
                onDragOver={handleDragOver}
                onDrop={handleDropStaged}
              >
                <div className="gb-stage-header">
                  <span className="gb-stage-title">已暂存</span>
                  <span className="gb-stage-count">{stagedFiles.length}</span>
                </div>
                <div className="gb-stage-list">
                  {stagedFiles.length === 0 ? (
                    <div className="gb-stage-empty">暂无暂存的文件</div>
                  ) : (
                    stagedFiles.map((file) => (
                      <StageFileItem
                        key={file.path}
                        file={file}
                        onAction={handleUnstageFile}
                        actionLabel="←"
                        onDragStart={handleDragStart}
                        onDragEnd={handleDragEnd}
                        isDragging={draggedFile?.path === file.path}
                        onDragOver={handleDragOver}
                        onDrop={() => {}}
                      />
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default GitBrowserPage
