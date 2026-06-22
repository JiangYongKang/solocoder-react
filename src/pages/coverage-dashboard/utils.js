import { COVERAGE_THRESHOLDS, COVERAGE_LEVELS, METRIC_KEYS } from './constants'

export function getCoverageLevel(percentage) {
  if (typeof percentage !== 'number' || isNaN(percentage)) {
    return COVERAGE_LEVELS.NONE
  }
  if (percentage <= 0) {
    return COVERAGE_LEVELS.NONE
  }
  if (percentage >= COVERAGE_THRESHOLDS.HIGH) {
    return COVERAGE_LEVELS.HIGH
  }
  if (percentage >= COVERAGE_THRESHOLDS.MEDIUM) {
    return COVERAGE_LEVELS.MEDIUM
  }
  return COVERAGE_LEVELS.LOW
}

export function formatPercentage(value, decimals = 1) {
  if (typeof value !== 'number' || isNaN(value)) {
    return '0.0%'
  }
  const clamped = Math.max(0, Math.min(100, value))
  return `${clamped.toFixed(decimals)}%`
}

export function calculateAverageCoverage(coverages) {
  if (!Array.isArray(coverages) || coverages.length === 0) {
    return { statements: 0, branches: 0, functions: 0, lines: 0 }
  }

  const totals = { statements: 0, branches: 0, functions: 0, lines: 0 }
  let count = 0

  coverages.forEach((cov) => {
    if (cov && typeof cov === 'object') {
      let hasValidMetric = false
      METRIC_KEYS.forEach((key) => {
        if (typeof cov[key] === 'number' && !isNaN(cov[key])) {
          totals[key] += cov[key]
          hasValidMetric = true
        }
      })
      if (hasValidMetric) {
        count++
      }
    }
  })

  if (count === 0) {
    return { statements: 0, branches: 0, functions: 0, lines: 0 }
  }

  const result = {}
  METRIC_KEYS.forEach((key) => {
    result[key] = Math.round((totals[key] / count) * 10) / 10
  })

  return result
}

export function flattenFileTree(node) {
  const files = []

  function traverse(current) {
    if (!current) return
    if (current.type === 'file') {
      files.push(current)
    } else if (current.children && Array.isArray(current.children)) {
      current.children.forEach(traverse)
    }
  }

  traverse(node)
  return files
}

export function buildDirectoryCoverage(node) {
  if (!node) return null

  if (node.type === 'file') {
    return {
      ...node,
      averageCoverage: node.coverage ? node.coverage.lines : 0,
    }
  }

  if (node.type === 'directory' && node.children) {
    const childResults = node.children.map(buildDirectoryCoverage).filter(Boolean)
    const fileCoverages = childResults
      .filter((c) => c.type === 'file')
      .map((c) => c.coverage)

    const allCoverages = [...fileCoverages]
    childResults
      .filter((c) => c.type === 'directory')
      .forEach((dir) => {
        if (dir.coverage) allCoverages.push(dir.coverage)
      })

    const avgCoverage = calculateAverageCoverage(allCoverages)

    return {
      ...node,
      children: childResults,
      coverage: avgCoverage,
      averageCoverage: avgCoverage.lines,
      fileCount: countFiles(node),
    }
  }

  return node
}

export function countFiles(node) {
  if (!node) return 0
  if (node.type === 'file') return 1
  if (node.children && Array.isArray(node.children)) {
    return node.children.reduce((sum, child) => sum + countFiles(child), 0)
  }
  return 0
}

export function countDirectories(node) {
  if (!node) return 0
  if (node.type === 'file') return 0
  let count = 1
  if (node.children && Array.isArray(node.children)) {
    count += node.children.reduce((sum, child) => sum + countDirectories(child), 0)
  }
  return count
}

export function findFileByPath(node, path) {
  if (!node || !path) return null
  if (node.path === path && node.type === 'file') return node
  if (node.children && Array.isArray(node.children)) {
    for (const child of node.children) {
      const found = findFileByPath(child, path)
      if (found) return found
    }
  }
  return null
}

export function getUncoveredLines(file) {
  if (!file || !Array.isArray(file.lines) || !Array.isArray(file.uncoveredLines)) {
    return []
  }
  return file.lines.filter((line) => file.uncoveredLines.includes(line.line))
}

export function calculateOverallCoverage(files) {
  if (!Array.isArray(files) || files.length === 0) {
    return { statements: 0, branches: 0, functions: 0, lines: 0 }
  }

  const fileCoverages = files.map((f) => f.coverage).filter(Boolean)
  return calculateAverageCoverage(fileCoverages)
}

export function sortFilesByCoverage(files, metric = 'lines', ascending = true) {
  if (!Array.isArray(files)) return []
  return [...files].sort((a, b) => {
    const aCov = a.coverage?.[metric] ?? 0
    const bCov = b.coverage?.[metric] ?? 0
    return ascending ? aCov - bCov : bCov - aCov
  })
}

export function filterFilesByLevel(files, level) {
  if (!Array.isArray(files)) return []
  if (!level) return files
  return files.filter((file) => {
    const lineCov = file.coverage?.lines ?? 0
    return getCoverageLevel(lineCov) === level
  })
}

export function getCoverageStats(files) {
  if (!Array.isArray(files) || files.length === 0) {
    return {
      total: 0,
      high: 0,
      medium: 0,
      low: 0,
      none: 0,
    }
  }

  const stats = {
    total: files.length,
    high: 0,
    medium: 0,
    low: 0,
    none: 0,
  }

  files.forEach((file) => {
    const lineCov = file.coverage?.lines ?? 0
    const level = getCoverageLevel(lineCov)
    stats[level]++
  })

  return stats
}

export function calculateTrendChange(trendData, metric = 'statements') {
  if (!Array.isArray(trendData) || trendData.length < 2) {
    return { change: 0, percentage: 0 }
  }

  const first = trendData[0][metric] ?? 0
  const last = trendData[trendData.length - 1][metric] ?? 0
  const change = Math.round((last - first) * 10) / 10
  const percentage = first !== 0 ? Math.round((change / first) * 1000) / 10 : 0

  return { change, percentage }
}

export function getTrendDirection(trendData, metric = 'statements') {
  const { change } = calculateTrendChange(trendData, metric)
  if (change > 0.5) return 'up'
  if (change < -0.5) return 'down'
  return 'stable'
}
