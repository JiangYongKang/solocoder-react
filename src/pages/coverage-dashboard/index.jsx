import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import './coverage-dashboard.css'

import FileTree from './FileTree'
import DonutChart from './DonutChart'
import UncoveredLines from './UncoveredLines'
import TrendChart from './TrendChart'

import {
  generateMockFileTree,
  generateMockSummary,
  generateMockTrendData,
} from './mockData'

import {
  buildDirectoryCoverage,
  flattenFileTree,
  calculateOverallCoverage,
  getCoverageStats,
  countFiles,
  countDirectories,
} from './utils'

import { VIEW_MODES, COVERAGE_COLORS, METRIC_KEYS } from './constants'

const CoverageDashboard = () => {
  const navigate = useNavigate()

  const [fileTree] = useState(() => generateMockFileTree())
  const [summary] = useState(() => generateMockSummary())
  const [trendData] = useState(() => generateMockTrendData())
  const [viewMode, setViewMode] = useState(VIEW_MODES.FILE_TREE)
  const [selectedFile, setSelectedFile] = useState(null)

  const directoryTree = useMemo(() => buildDirectoryCoverage(fileTree), [fileTree])
  const displayTree = viewMode === VIEW_MODES.DIRECTORY ? directoryTree : fileTree

  const allFiles = useMemo(() => flattenFileTree(fileTree), [fileTree])
  const overallCoverage = useMemo(() => calculateOverallCoverage(allFiles), [allFiles])
  const coverageStats = useMemo(() => getCoverageStats(allFiles), [allFiles])
  const totalFiles = useMemo(() => countFiles(fileTree), [fileTree])
  const totalDirs = useMemo(() => countDirectories(fileTree), [fileTree])

  const handleFileSelect = (file) => {
    setSelectedFile(file)
  }

  const handleViewModeChange = (mode) => {
    setViewMode(mode)
    setSelectedFile(null)
  }

  const handleDonutClick = (metric) => {
    const sorted = [...allFiles].sort(
      (a, b) => (a.coverage?.[metric] ?? 0) - (b.coverage?.[metric] ?? 0)
    )
    if (sorted.length > 0 && sorted[0].coverage?.[metric] < 100) {
      setSelectedFile(sorted[0])
    }
  }

  return (
    <div className="cv-page">
      <div className="cv-header">
        <div className="cv-header-left">
          <button className="cv-back-btn" onClick={() => navigate('/')}>
            ← 返回首页
          </button>
          <h1 className="cv-title">单元测试覆盖率面板</h1>
        </div>
        <div className="cv-toolbar">
          <div className="cv-view-toggle">
            <button
              className={`cv-view-btn ${viewMode === VIEW_MODES.FILE_TREE ? 'active' : ''}`}
              onClick={() => handleViewModeChange(VIEW_MODES.FILE_TREE)}
            >
              文件树视图
            </button>
            <button
              className={`cv-view-btn ${viewMode === VIEW_MODES.DIRECTORY ? 'active' : ''}`}
              onClick={() => handleViewModeChange(VIEW_MODES.DIRECTORY)}
            >
              目录聚合视图
            </button>
          </div>
        </div>
      </div>

      <div className="cv-summary">
        <div className="cv-summary-card">
          <div className="cv-summary-label">总文件数</div>
          <div className="cv-summary-value">{totalFiles}</div>
          <div className="cv-summary-sub">目录数: {totalDirs}</div>
        </div>
        <div className="cv-summary-card">
          <div className="cv-summary-label">已测试文件</div>
          <div className="cv-summary-value">{summary.testedFiles}</div>
          <div className="cv-summary-sub">覆盖率: {((summary.testedFiles / totalFiles) * 100).toFixed(1)}%</div>
        </div>
        <div className="cv-summary-card">
          <div className="cv-summary-label">代码总行数</div>
          <div className="cv-summary-value">{summary.totalLines}</div>
          <div className="cv-summary-sub">已覆盖: {summary.coveredLines} 行</div>
        </div>
        <div className="cv-summary-card">
          <div className="cv-summary-label">覆盖率分布</div>
          <div className="cv-coverage-legend">
            <span className="cv-legend-item">
              <span className="cv-legend-dot" style={{ backgroundColor: COVERAGE_COLORS.high }} />
              高 ({coverageStats.high})
            </span>
            <span className="cv-legend-item">
              <span className="cv-legend-dot" style={{ backgroundColor: COVERAGE_COLORS.medium }} />
              中 ({coverageStats.medium})
            </span>
            <span className="cv-legend-item">
              <span className="cv-legend-dot" style={{ backgroundColor: COVERAGE_COLORS.low }} />
              低 ({coverageStats.low})
            </span>
            <span className="cv-legend-item">
              <span className="cv-legend-dot" style={{ backgroundColor: COVERAGE_COLORS.none }} />
              无 ({coverageStats.none})
            </span>
          </div>
        </div>
      </div>

      <div className="cv-body">
        <div className="cv-left-panel">
          <div className="cv-panel">
            <div className="cv-panel-header">
              <h3 className="cv-panel-title">
                {viewMode === VIEW_MODES.DIRECTORY ? '目录结构' : '文件结构'}
              </h3>
              <span className="cv-panel-count">{totalFiles} 个文件</span>
            </div>
            <div className="cv-panel-body">
              <FileTree
                treeData={displayTree}
                onFileSelect={handleFileSelect}
                selectedPath={selectedFile?.path}
              />
            </div>
          </div>
        </div>

        <div className="cv-right-panel">
          <div className="cv-panel cv-donut-panel">
            <div className="cv-panel-header">
              <h3 className="cv-panel-title">覆盖率概览</h3>
              <span className="cv-panel-hint">点击环形图查看最低覆盖率文件</span>
            </div>
            <div className="cv-panel-body">
              <div className="cv-donut-row">
                {METRIC_KEYS.map((metric) => (
                  <DonutChart
                    key={metric}
                    value={overallCoverage[metric]}
                    label={metric}
                    onClick={() => handleDonutClick(metric)}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="cv-panel">
            <div className="cv-panel-body">
              <UncoveredLines file={selectedFile} />
            </div>
          </div>

          <div className="cv-panel">
            <div className="cv-panel-body">
              <TrendChart trendData={trendData} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CoverageDashboard
