import { useState } from 'react'
import { getCoverageLevel, formatPercentage } from './utils'
import { COVERAGE_COLORS } from './constants'

const FileTree = ({ treeData, onFileSelect, selectedPath }) => {
  const [expandedPaths, setExpandedPaths] = useState(() => {
    const paths = new Set()
    if (treeData) paths.add(treeData.path)
    return paths
  })

  const toggleExpand = (path, e) => {
    e.stopPropagation()
    setExpandedPaths((prev) => {
      const next = new Set(prev)
      if (next.has(path)) {
        next.delete(path)
      } else {
        next.add(path)
      }
      return next
    })
  }

  const handleFileClick = (file) => {
    if (file.type === 'file' && onFileSelect) {
      onFileSelect(file)
    }
  }

  const renderNode = (node, depth = 0) => {
    if (!node) return null

    const isExpanded = expandedPaths.has(node.path)
    const isDirectory = node.type === 'directory'
    const coverageValue = isDirectory
      ? node.coverage?.lines ?? node.averageCoverage ?? 0
      : node.coverage?.lines ?? 0
    const coverageLevel = getCoverageLevel(coverageValue)
    const coverageColor = COVERAGE_COLORS[coverageLevel]
    const isSelected = selectedPath === node.path

    const indentStyle = { paddingLeft: `${depth * 16 + 8}px` }

    return (
      <div key={node.path} className="cv-file-node">
        <div
          className={`cv-file-row ${isSelected ? 'selected' : ''} ${isDirectory ? 'is-directory' : 'is-file'}`}
          style={indentStyle}
          onClick={() => {
            if (isDirectory) {
              toggleExpand(node.path, { stopPropagation: () => {} })
            } else {
              handleFileClick(node)
            }
          }}
        >
          {isDirectory && (
            <span className="cv-toggle-icon" onClick={(e) => toggleExpand(node.path, e)}>
              {isExpanded ? '▼' : '▶'}
            </span>
          )}
          {!isDirectory && <span className="cv-toggle-icon cv-toggle-spacer" />}

          <span className="cv-file-icon">
            {isDirectory ? '📁' : '📄'}
          </span>

          <span className="cv-file-name">{node.name}</span>

          <span
            className="cv-coverage-badge"
            style={{ backgroundColor: coverageColor }}
            title={`行覆盖率: ${formatPercentage(coverageValue)}`}
          >
            {formatPercentage(coverageValue, 0)}
          </span>

          {isDirectory && node.fileCount !== undefined && (
            <span className="cv-file-count">{node.fileCount} 个文件</span>
          )}
        </div>

        {isDirectory && isExpanded && node.children && (
          <div className="cv-file-children">
            {node.children.map((child) => renderNode(child, depth + 1))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="cv-file-tree">
      {treeData ? renderNode(treeData) : <div className="cv-empty">暂无数据</div>}
    </div>
  )
}

export default FileTree
