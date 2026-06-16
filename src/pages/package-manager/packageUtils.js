export function parseVersion(version) {
  if (typeof version !== 'string') return null
  const clean = version.replace(/^[\^~>=<]+/, '').trim()
  const parts = clean.split('.')
  const major = parseInt(parts[0] || '0', 10)
  const minor = parseInt(parts[1] || '0', 10)
  const patch = parseInt((parts[2] || '0').replace(/[^\d].*$/, ''), 10)
  if (Number.isNaN(major) || Number.isNaN(minor) || Number.isNaN(patch)) return null
  return { major, minor, patch }
}

export function compareVersions(v1, v2) {
  const p1 = parseVersion(v1)
  const p2 = parseVersion(v2)
  if (!p1 || !p2) return 0
  if (p1.major !== p2.major) return p1.major - p2.major
  if (p1.minor !== p2.minor) return p1.minor - p2.minor
  return p1.patch - p2.patch
}

export function versionToString(parsed) {
  if (!parsed) return '0.0.0'
  return `${parsed.major}.${parsed.minor}.${parsed.patch}`
}

export function parseRange(range) {
  if (typeof range !== 'string') return { type: 'exact', version: range || '0.0.0' }
  const trimmed = range.trim()
  if (trimmed.startsWith('^')) {
    return { type: 'caret', version: trimmed.slice(1) }
  }
  if (trimmed.startsWith('~')) {
    return { type: 'tilde', version: trimmed.slice(1) }
  }
  if (trimmed.startsWith('>=')) {
    return { type: 'gte', version: trimmed.slice(2) }
  }
  if (trimmed.startsWith('<=')) {
    return { type: 'lte', version: trimmed.slice(2) }
  }
  if (trimmed.startsWith('>')) {
    return { type: 'gt', version: trimmed.slice(1) }
  }
  if (trimmed.startsWith('<')) {
    return { type: 'lt', version: trimmed.slice(1) }
  }
  return { type: 'exact', version: trimmed }
}

export function isVersionInRange(version, range) {
  const parsed = parseVersion(version)
  if (!parsed) return false
  const { type, version: rangeVersion } = parseRange(range)
  const rv = parseVersion(rangeVersion)
  if (!rv) return false

  switch (type) {
    case 'exact':
      return compareVersions(version, rangeVersion) === 0
    case 'caret':
      if (parsed.major !== rv.major) return false
      return compareVersions(version, rangeVersion) >= 0
    case 'tilde':
      if (parsed.major !== rv.major || parsed.minor !== rv.minor) return false
      return compareVersions(version, rangeVersion) >= 0
    case 'gte':
      return compareVersions(version, rangeVersion) >= 0
    case 'lte':
      return compareVersions(version, rangeVersion) <= 0
    case 'gt':
      return compareVersions(version, rangeVersion) > 0
    case 'lt':
      return compareVersions(version, rangeVersion) < 0
    default:
      return true
  }
}

export function detectVersionConflict(installedVersion, declaredRange) {
  if (!installedVersion || !declaredRange) return false
  return !isVersionInRange(installedVersion, declaredRange)
}

export function bumpVersion(version, level) {
  const parsed = parseVersion(version)
  if (!parsed) return version
  switch (level) {
    case 'major':
      return versionToString({ major: parsed.major + 1, minor: 0, patch: 0 })
    case 'minor':
      return versionToString({ major: parsed.major, minor: parsed.minor + 1, patch: 0 })
    case 'patch':
      return versionToString({ major: parsed.major, minor: parsed.minor, patch: parsed.patch + 1 })
    default:
      return versionToString({ major: parsed.major, minor: parsed.minor, patch: parsed.patch + 1 })
  }
}

export function generateLatestVersion(currentVersion) {
  const parsed = parseVersion(currentVersion)
  if (!parsed) return currentVersion
  const bumpChoices = ['patch', 'minor', 'major']
  const choice = bumpChoices[Math.floor(Math.random() * 3)]
  const newVersion = bumpVersion(currentVersion, choice)
  const extraPatches = Math.floor(Math.random() * 3)
  let result = newVersion
  for (let i = 0; i < extraPatches; i++) {
    result = bumpVersion(result, 'patch')
  }
  return result
}

export function calculateLatestVersion(currentVersion) {
  const parsed = parseVersion(currentVersion)
  if (!parsed) return currentVersion
  return versionToString({
    major: parsed.major,
    minor: parsed.minor + 1 + Math.floor(Math.random() * 2),
    patch: Math.floor(Math.random() * 5),
  })
}

export function isVersionOutdated(currentVersion, latestVersion, majorThreshold = 2) {
  const current = parseVersion(currentVersion)
  const latest = parseVersion(latestVersion)
  if (!current || !latest) return false
  return latest.major - current.major >= majorThreshold
}

export function hasNewerVersion(currentVersion, latestVersion) {
  return compareVersions(latestVersion, currentVersion) > 0
}

export function getCompatibleVersion(declaredRange, latestVersion) {
  const { type, version: baseVersion } = parseRange(declaredRange)
  const latest = parseVersion(latestVersion)
  const base = parseVersion(baseVersion)
  if (!latest || !base) return latestVersion

  switch (type) {
    case 'caret':
      if (latest.major === base.major) return latestVersion
      return versionToString({ major: base.major, minor: base.minor + 2, patch: Math.floor(Math.random() * 5) })
    case 'tilde':
      if (latest.major === base.major && latest.minor === base.minor) return latestVersion
      return versionToString({ major: base.major, minor: base.minor, patch: base.patch + 2 + Math.floor(Math.random() * 3) })
    default:
      return latestVersion
  }
}

export function flattenDependencyTree(deps, result = [], depth = 0, parentId = null) {
  if (!Array.isArray(deps)) return result
  for (const dep of deps) {
    const node = { ...dep, depth, parentId, id: dep.id || `${parentId ? parentId + '>' : ''}${dep.name}` }
    result.push(node)
    if (dep.dependencies && dep.dependencies.length > 0) {
      flattenDependencyTree(dep.dependencies, result, depth + 1, node.id)
    }
  }
  return result
}

export function filterDependenciesByName(deps, keyword) {
  if (!keyword || typeof keyword !== 'string') return deps
  const kw = keyword.trim().toLowerCase()
  if (!kw) return deps

  const filterFn = (list) => {
    const result = []
    for (const dep of list) {
      const nameMatch = dep.name?.toLowerCase().includes(kw)
      const children = dep.dependencies ? filterFn(dep.dependencies) : []
      if (nameMatch || children.length > 0) {
        result.push({ ...dep, dependencies: children.length > 0 ? children : dep.dependencies })
      }
    }
    return result
  }

  return filterFn(deps)
}

export function collectAllDescendantIds(dep) {
  const ids = []
  const queue = [dep]
  while (queue.length > 0) {
    const current = queue.shift()
    ids.push(current.id || current.name)
    if (current.dependencies) {
      for (const child of current.dependencies) {
        queue.push(child)
      }
    }
  }
  return ids
}

export function findDependencyById(deps, id) {
  if (!Array.isArray(deps)) return null
  for (const dep of deps) {
    const depId = dep.id || dep.name
    if (depId === id) return dep
    if (dep.dependencies) {
      const found = findDependencyById(dep.dependencies, id)
      if (found) return found
    }
  }
  return null
}

export function getAllDirectDependencies(deps) {
  return Array.isArray(deps) ? deps.slice() : []
}

export function collectAllDependencies(deps) {
  const result = new Map()
  const walk = (list) => {
    if (!Array.isArray(list)) return
    for (const dep of list) {
      result.set(dep.name, dep)
      if (dep.dependencies) walk(dep.dependencies)
    }
  }
  walk(deps)
  return Array.from(result.values())
}

export function buildGraphNodes(deps) {
  const nodes = []
  const edges = []
  const seen = new Set()

  const walk = (list, parentName, direct) => {
    if (!Array.isArray(list)) return
    for (const dep of list) {
      const key = dep.name
      if (!seen.has(key)) {
        seen.add(key)
        nodes.push({
          id: key,
          name: dep.name,
          version: dep.installedVersion || dep.version,
          isDirect: direct,
          license: dep.license,
          size: dep.size,
        })
      }
      if (parentName) {
        edges.push({ source: key, target: parentName })
      }
      if (dep.dependencies) {
        walk(dep.dependencies, key, false)
      }
    }
  }

  walk(deps, null, true)
  return { nodes, edges }
}

export function getRelatedNodes(nodeId, edges) {
  const related = new Set([nodeId])
  for (const edge of edges) {
    if (edge.source === nodeId) {
      related.add(edge.target)
    }
    if (edge.target === nodeId) {
      related.add(edge.source)
    }
  }
  return related
}

export function buildLockEntries(deps) {
  const entries = []
  const walk = (list) => {
    if (!Array.isArray(list)) return
    for (const dep of list) {
      entries.push({
        name: dep.name,
        version: dep.installedVersion || dep.version,
        range: dep.versionRange,
        license: dep.license,
        size: dep.size,
      })
      if (dep.dependencies) walk(dep.dependencies)
    }
  }
  walk(deps)
  return entries.sort((a, b) => a.name.localeCompare(b.name))
}

export function diffLockEntries(oldEntries, newEntries) {
  const oldMap = new Map(oldEntries.map((e) => [e.name, e]))
  const newMap = new Map(newEntries.map((e) => [e.name, e]))
  const allNames = new Set([...oldMap.keys(), ...newMap.keys()])

  const result = []
  let upgraded = 0
  let downgraded = 0
  let added = 0
  let removed = 0

  for (const name of Array.from(allNames).sort()) {
    const oldEntry = oldMap.get(name)
    const newEntry = newMap.get(name)

    if (oldEntry && newEntry) {
      const cmp = compareVersions(newEntry.version, oldEntry.version)
      if (cmp > 0) {
        result.push({ name, type: 'upgraded', old: oldEntry, new: newEntry })
        upgraded++
      } else if (cmp < 0) {
        result.push({ name, type: 'downgraded', old: oldEntry, new: newEntry })
        downgraded++
      } else {
        result.push({ name, type: 'unchanged', old: oldEntry, new: newEntry })
      }
    } else if (newEntry && !oldEntry) {
      result.push({ name, type: 'added', old: null, new: newEntry })
      added++
    } else if (oldEntry && !newEntry) {
      result.push({ name, type: 'removed', old: oldEntry, new: null })
      removed++
    }
  }

  return {
    changes: result,
    stats: { upgraded, downgraded, added, removed },
  }
}

export function applyUpgrades(deps, upgradeMap) {
  const upgradeSingle = (dep) => {
    const target = upgradeMap.get(dep.name)
    const newDep = { ...dep }
    if (target) {
      newDep.installedVersion = target.targetVersion
      newDep.latestVersion = target.targetVersion
    }
    if (dep.dependencies) {
      newDep.dependencies = dep.dependencies.map(upgradeSingle)
    }
    return newDep
  }
  return deps.map(upgradeSingle)
}

export function collectUpgradable(deps) {
  const result = []
  const walk = (list) => {
    if (!Array.isArray(list)) return
    for (const dep of list) {
      if (hasNewerVersion(dep.installedVersion || dep.version, dep.latestVersion)) {
        result.push({
          name: dep.name,
          currentVersion: dep.installedVersion || dep.version,
          targetVersion: getCompatibleVersion(dep.versionRange, dep.latestVersion),
          latestVersion: dep.latestVersion,
          versionRange: dep.versionRange,
        })
      }
      if (dep.dependencies) walk(dep.dependencies)
    }
  }
  walk(deps)
  return result
}

export function formatSize(bytes) {
  if (bytes == null) return '0 B'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

export function formatDate(timestamp) {
  if (!timestamp) return '-'
  const d = new Date(timestamp)
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function generateOperationSummary(upgrades) {
  if (!upgrades || upgrades.length === 0) return '无变更'
  const names = upgrades.map((u) => u.name).slice(0, 3)
  const summary = names.join(', ')
  return upgrades.length > 3
    ? `${summary} 等 ${upgrades.length} 个包`
    : summary
}
