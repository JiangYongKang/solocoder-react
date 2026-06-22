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

export function calculateWeightedAverageCoverage(items) {
  if (!Array.isArray(items) || items.length === 0) {
    return { statements: 0, branches: 0, functions: 0, lines: 0 }
  }

  const weightedSums = { statements: 0, branches: 0, functions: 0, lines: 0 }
  let totalWeight = 0

  items.forEach((item) => {
    if (!item || !item.coverage || typeof item.coverage !== 'object') return
    const weight = typeof item.totalLines === 'number' && item.totalLines > 0 ? item.totalLines : 0
    if (weight <= 0) return

    totalWeight += weight
    METRIC_KEYS.forEach((key) => {
      if (typeof item.coverage[key] === 'number' && !isNaN(item.coverage[key])) {
        weightedSums[key] += item.coverage[key] * weight
      }
    })
  })

  if (totalWeight === 0) {
    return { statements: 0, branches: 0, functions: 0, lines: 0 }
  }

  const result = {}
  METRIC_KEYS.forEach((key) => {
    result[key] = Math.round((weightedSums[key] / totalWeight) * 10) / 10
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
  function traverse(current) {
    if (!current) return null

    if (current.type === 'file') {
      const lineCount = Array.isArray(current.lines) ? current.lines.length : 0
      const enrichedFile = {
        ...current,
        averageCoverage: current.coverage ? current.coverage.lines : 0,
      }
      return {
        node: enrichedFile,
        subtreeData: {
          fileCount: 1,
          weightedItems: current.coverage
            ? [{ coverage: current.coverage, totalLines: lineCount }]
            : [],
        },
      }
    }

    if (current.type === 'directory' && current.children) {
      const childResults = current.children
        .map((child) => traverse(child))
        .filter(Boolean)

      const enrichedChildren = childResults.map((r) => r.node)

      let fileCount = 0
      const allWeightedItems = []

      childResults.forEach((child) => {
        fileCount += child.subtreeData.fileCount
        allWeightedItems.push(...child.subtreeData.weightedItems)
      })

      const avgCoverage = calculateWeightedAverageCoverage(allWeightedItems)

      const enrichedDir = {
        ...current,
        children: enrichedChildren,
        coverage: avgCoverage,
        averageCoverage: avgCoverage.lines,
        fileCount,
      }

      return {
        node: enrichedDir,
        subtreeData: {
          fileCount,
          weightedItems: allWeightedItems,
        },
      }
    }

    return { node: current, subtreeData: { fileCount: 0, weightedItems: [] } }
  }

  const result = traverse(node)
  return result ? result.node : null
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

export function countTotalLines(files) {
  if (!Array.isArray(files)) return 0
  return files.reduce((sum, file) => {
    const lineCount = Array.isArray(file.lines) ? file.lines.length : 0
    return sum + lineCount
  }, 0)
}

export function countCoveredLines(files) {
  if (!Array.isArray(files)) return 0
  return files.reduce((sum, file) => {
    const totalLines = Array.isArray(file.lines) ? file.lines.length : 0
    const uncoveredCount = Array.isArray(file.uncoveredLines) ? file.uncoveredLines.length : 0
    return sum + Math.max(0, totalLines - uncoveredCount)
  }, 0)
}

export function countTestedFiles(files) {
  if (!Array.isArray(files)) return 0
  return files.filter((file) => {
    const lineCov = file.coverage?.lines ?? 0
    return lineCov > 0
  }).length
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

  const weightedItems = files
    .filter((f) => f.coverage)
    .map((f) => ({
      coverage: f.coverage,
      totalLines: Array.isArray(f.lines) ? f.lines.length : 0,
    }))

  return calculateWeightedAverageCoverage(weightedItems)
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
