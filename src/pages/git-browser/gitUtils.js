import { FILE_CHANGE_STATUS, FILE_TYPE } from './constants'

export const simpleHash = (str) => {
  if (typeof str !== 'string' || str.length === 0) return 0
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash |= 0
  }
  return Math.abs(hash)
}

export const seededRandom = (seed) => {
  let s = seed % 2147483647
  if (s <= 0) s += 2147483646
  return () => {
    s = (s * 16807) % 2147483647
    return (s - 1) / 2147483646
  }
}

export const getChangeStatusIcon = (status) => {
  switch (status) {
    case FILE_CHANGE_STATUS.ADDED:
      return '+'
    case FILE_CHANGE_STATUS.DELETED:
      return '-'
    case FILE_CHANGE_STATUS.MODIFIED:
      return '~'
    default:
      return ''
  }
}

export const getChangeStatusColor = (status) => {
  switch (status) {
    case FILE_CHANGE_STATUS.ADDED:
      return '#22c55e'
    case FILE_CHANGE_STATUS.DELETED:
      return '#ef4444'
    case FILE_CHANGE_STATUS.MODIFIED:
      return '#f59e0b'
    default:
      return '#9ca3af'
  }
}

export const getChangeStatusLabel = (status) => {
  switch (status) {
    case FILE_CHANGE_STATUS.ADDED:
      return '新增'
    case FILE_CHANGE_STATUS.DELETED:
      return '删除'
    case FILE_CHANGE_STATUS.MODIFIED:
      return '修改'
    default:
      return '未变更'
  }
}

export const getAllFilesFromTree = (node, result = []) => {
  if (!node) return result
  if (node.type === FILE_TYPE.FILE) {
    result.push(node)
  } else if (node.children && Array.isArray(node.children)) {
    node.children.forEach((child) => getAllFilesFromTree(child, result))
  }
  return result
}

export const getChangedFilesFromTree = (node, statuses, result = []) => {
  if (!node) return result
  const targetStatuses = Array.isArray(statuses) ? statuses : [statuses]
  if (node.type === FILE_TYPE.FILE && targetStatuses.includes(node.status)) {
    result.push(node)
  } else if (node.children && Array.isArray(node.children)) {
    node.children.forEach((child) => getChangedFilesFromTree(child, targetStatuses, result))
  }
  return result
}

export const findFileInTree = (node, filePath) => {
  if (!node) return null
  if (node.type === FILE_TYPE.FILE && node.path === filePath) {
    return node
  }
  if (node.children && Array.isArray(node.children)) {
    for (const child of node.children) {
      const found = findFileInTree(child, filePath)
      if (found) return found
    }
  }
  return null
}

export const expandFoldersToFile = (node, filePath, expandedSet) => {
  if (!node || !node.children) return expandedSet
  for (const child of node.children) {
    if (child.type === FILE_TYPE.FOLDER) {
      const hasFile = folderContainsFile(child, filePath)
      if (hasFile) {
        expandedSet.add(child.id)
        expandFoldersToFile(child, filePath, expandedSet)
      }
    }
  }
  return expandedSet
}

export const folderContainsFile = (folder, filePath) => {
  if (!folder || !folder.children) return false
  for (const child of folder.children) {
    if (child.type === FILE_TYPE.FILE && child.path === filePath) {
      return true
    }
    if (child.type === FILE_TYPE.FOLDER && folderContainsFile(child, filePath)) {
      return true
    }
  }
  return false
}

export const formatTimestamp = (timestamp) => {
  if (!timestamp || typeof timestamp !== 'number') return ''
  const date = new Date(timestamp)
  const now = new Date()
  const diffMs = now - date
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return '刚刚'
  if (diffMins < 60) return `${diffMins} 分钟前`
  if (diffHours < 24) return `${diffHours} 小时前`
  if (diffDays < 7) return `${diffDays} 天前`

  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export const formatShortTimestamp = (timestamp) => {
  if (!timestamp || typeof timestamp !== 'number') return ''
  const date = new Date(timestamp)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export const shortHash = (hash) => {
  if (!hash || typeof hash !== 'string') return ''
  return hash.slice(0, 7)
}

export const stageFile = (stagedFiles, file) => {
  if (!file || !file.path) return stagedFiles
  if (stagedFiles.some((f) => f.path === file.path)) return stagedFiles
  return [...stagedFiles, file]
}

export const unstageFile = (stagedFiles, filePath) => {
  if (!filePath) return stagedFiles
  return stagedFiles.filter((f) => f.path !== filePath)
}

export const isFileStaged = (stagedFiles, filePath) => {
  if (!filePath || !Array.isArray(stagedFiles)) return false
  return stagedFiles.some((f) => f.path === filePath)
}

export const computeFileStats = (files) => {
  if (!Array.isArray(files)) return { added: 0, modified: 0, deleted: 0, unchanged: 0 }
  return files.reduce(
    (acc, file) => {
      switch (file.status) {
        case FILE_CHANGE_STATUS.ADDED:
          acc.added++
          break
        case FILE_CHANGE_STATUS.MODIFIED:
          acc.modified++
          break
        case FILE_CHANGE_STATUS.DELETED:
          acc.deleted++
          break
        default:
          acc.unchanged++
      }
      return acc
    },
    { added: 0, modified: 0, deleted: 0, unchanged: 0 }
  )
}

export const getFileExtension = (filename) => {
  if (!filename || typeof filename !== 'string') return ''
  const idx = filename.lastIndexOf('.')
  if (idx > 0 && idx < filename.length - 1) {
    return filename.slice(idx + 1).toLowerCase()
  }
  return ''
}

export const sortTreeChildren = (children) => {
  if (!Array.isArray(children)) return []
  return [...children].sort((a, b) => {
    if (a.type !== b.type) {
      return a.type === FILE_TYPE.FOLDER ? -1 : 1
    }
    return a.name.localeCompare(b.name, 'zh-CN')
  })
}

export const filterFileTree = (node, searchTerm) => {
  if (!node || !searchTerm) return node
  const lowerTerm = searchTerm.toLowerCase()

  if (node.type === FILE_TYPE.FILE) {
    return node.name.toLowerCase().includes(lowerTerm) ? node : null
  }

  if (node.children) {
    const filteredChildren = node.children
      .map((child) => filterFileTree(child, searchTerm))
      .filter(Boolean)
    if (filteredChildren.length > 0 || node.name.toLowerCase().includes(lowerTerm)) {
      return { ...node, children: filteredChildren }
    }
  }

  return null
}

const normalizeFileEntry = (entry) => {
  if (typeof entry === 'string') {
    return { path: entry, status: null }
  }
  return entry
}

const JS_KEYWORDS = new Set([
  'const', 'let', 'var', 'function', 'return', 'if', 'else', 'for', 'while',
  'do', 'switch', 'case', 'break', 'continue', 'new', 'class', 'extends',
  'super', 'this', 'import', 'export', 'from', 'default', 'try', 'catch',
  'finally', 'throw', 'typeof', 'instanceof', 'in', 'of', 'void', 'delete',
  'true', 'false', 'null', 'undefined', 'async', 'await', 'yield', 'static',
])

const isSafeLineForReplacement = (line) => {
  if (!line || typeof line !== 'string') return false
  const trimmed = line.trim()
  if (!trimmed) return false
  if (trimmed.startsWith('//')) return false
  if (trimmed.startsWith('/*') || trimmed.startsWith('*')) return false
  if (/^(import|export)\s/.test(trimmed)) return false
  if (/^require\s*\(/.test(trimmed)) return false
  if (trimmed.startsWith('console.')) return false
  return true
}

const isSafeLineForDeletion = (line) => {
  if (!line || typeof line !== 'string') return false
  const trimmed = line.trim()
  if (!trimmed) return false
  if (trimmed.includes('//')) return false
  if (trimmed.includes('/*') || trimmed.includes('*/')) return false
  if (trimmed.startsWith('import ') || trimmed.startsWith('export ')) return false
  if (trimmed.startsWith('function ') || trimmed.startsWith('class ')) return false
  if (trimmed.startsWith('return ')) return false
  if (trimmed.startsWith('console.')) return false
  if (/['"`]/.test(trimmed)) return false
  return true
}

const replaceIdentifierInCode = (line, transformFn) => {
  let inSingleQuote = false
  let inDoubleQuote = false
  let inBacktick = false
  let inLineComment = false
  let result = ''
  let buffer = ''

  const flushBuffer = () => {
    if (buffer) {
      if (/^[A-Za-z_][A-Za-z0-9_]*$/.test(buffer) && !JS_KEYWORDS.has(buffer)) {
        result += transformFn(buffer)
      } else {
        result += buffer
      }
      buffer = ''
    }
  }

  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    const next = line[i + 1]

    if (inLineComment) {
      result += ch
      continue
    }

    if (ch === '/' && next === '/' && !inSingleQuote && !inDoubleQuote && !inBacktick) {
      flushBuffer()
      inLineComment = true
      result += ch
      continue
    }

    if (ch === "'" && !inDoubleQuote && !inBacktick) {
      flushBuffer()
      inSingleQuote = !inSingleQuote
      result += ch
      continue
    }
    if (ch === '"' && !inSingleQuote && !inBacktick) {
      flushBuffer()
      inDoubleQuote = !inDoubleQuote
      result += ch
      continue
    }
    if (ch === '`' && !inSingleQuote && !inDoubleQuote) {
      flushBuffer()
      inBacktick = !inBacktick
      result += ch
      continue
    }

    if (inSingleQuote || inDoubleQuote || inBacktick) {
      result += ch
      continue
    }

    if (/[A-Za-z0-9_]/.test(ch)) {
      buffer += ch
    } else {
      flushBuffer()
      result += ch
    }
  }

  flushBuffer()
  return result
}

const buildNaturalCodeLine = (rand, indent) => {
  const indentStr = indent || '  '
  const naturalLines = [
    `${indentStr}const normalizedInput = input?.toString().trim() ?? ''`,
    `${indentStr}const isValid = Array.isArray(items) && items.length > 0`,
    `${indentStr}if (!data || Object.keys(data).length === 0) {`,
    `${indentStr}  return []`,
    `${indentStr}}`,
    `${indentStr}const result = await fetchData({ limit: 100, offset: 0 })`,
    `${indentStr}const filtered = list.filter((item) => item && item.active)`,
    `${indentStr}const mapped = results.map((r) => ({ id: r.id, name: r.name }))`,
    `${indentStr}const count = records.reduce((acc) => acc + 1, 0)`,
    `${indentStr}const value = cache.get(key) ?? computeValue(key)`,
    `${indentStr}try {`,
    `${indentStr}  await validatePayload(payload)`,
    `${indentStr}} catch (err) {`,
    `${indentStr}  return fallback`,
    `${indentStr}}`,
    `${indentStr}return response.status === 200 ? response.data : []`,
    `${indentStr}const config = { ...defaults, ...userOptions }`,
    `${indentStr}const hasPermission = roles.includes(currentRole)`,
    `${indentStr}const sorted = [...data].sort((a, b) => a.index - b.index)`,
  ]
  return naturalLines[Math.floor(rand() * naturalLines.length)]
}

const applyLineTransformations = (lines, rand, options = {}) => {
  const { mode = 'original' } = options
  const result = [...lines]
  const lineCount = result.length

  if (lineCount === 0) return result

  const safeIndices = []
  for (let i = 0; i < lineCount; i++) {
    if (isSafeLineForReplacement(result[i])) {
      safeIndices.push(i)
    }
  }

  const maxReplacements = Math.min(
    Math.max(1, Math.floor(lineCount * 0.15) + 1),
    Math.floor(lineCount / 2),
    3
  )
  const numReplacements = Math.min(maxReplacements, safeIndices.length)

  const transformFn = (ident) => {
    if (mode === 'original') {
      if (ident.length >= 3 && /^[A-Z]/.test(ident)) {
        return 'Old' + ident.slice(1)
      }
      if (ident.length >= 3) {
        return 'old' + ident.charAt(0).toUpperCase() + ident.slice(1)
      }
      return ident + '_old'
    } else {
      if (ident.length >= 3 && /^[A-Z]/.test(ident)) {
        return 'New' + ident.slice(1)
      }
      if (ident.length >= 3) {
        return 'new' + ident.charAt(0).toUpperCase() + ident.slice(1)
      }
      return ident + '_v2'
    }
  }

  const usedIndices = new Set()
  for (let i = 0; i < numReplacements; i++) {
    let idx = -1
    let attempts = 0
    while (idx === -1 && attempts < 10) {
      const candidate = safeIndices[Math.floor(rand() * safeIndices.length)]
      if (!usedIndices.has(candidate)) {
        idx = candidate
      }
      attempts++
    }
    if (idx === -1) break
    usedIndices.add(idx)
    result[idx] = replaceIdentifierInCode(result[idx], transformFn)
  }

  if (mode === 'original' && lineCount > 4) {
    const deletableIndices = []
    for (let i = 0; i < result.length; i++) {
      if (isSafeLineForDeletion(result[i])) {
        deletableIndices.push(i)
      }
    }
    const numDeletions = Math.min(2, Math.floor(lineCount / 6) + 1, deletableIndices.length)
    const usedDel = new Set()
    for (let i = 0; i < numDeletions; i++) {
      let candidateIdx = -1
      let attempts = 0
      while (candidateIdx === -1 && attempts < 10) {
        const di = deletableIndices[Math.floor(rand() * deletableIndices.length)]
        if (!usedDel.has(di)) candidateIdx = di
        attempts++
      }
      if (candidateIdx >= 0) {
        usedDel.add(candidateIdx)
      }
    }
    const sortedDel = Array.from(usedDel).sort((a, b) => b - a)
    sortedDel.forEach((idx) => {
      if (idx >= 0 && idx < result.length) {
        result.splice(idx, 1)
      }
    })
  }

  if (mode === 'modified' && lineCount > 3) {
    const numInsertions = Math.min(2, Math.floor(lineCount / 8) + 1)
    for (let i = 0; i < numInsertions; i++) {
      const insIdx = Math.floor(rand() * (result.length + 1))
      const indentMatch = result[Math.min(insIdx, result.length - 1)]?.match(/^(\s*)/)
      const indent = indentMatch ? indentMatch[1] : '  '
      result.splice(insIdx, 0, buildNaturalCodeLine(rand, indent))
    }
  }

  return result
}

export const transformContentForCommit = (filePath, baseContent, commitHash) => {
  if (!baseContent || typeof baseContent !== 'string') return baseContent || ''
  const seed = simpleHash(`${filePath}::${commitHash || 'base'}`)
  const rand = seededRandom(seed)
  const lines = baseContent.split('\n')

  if (!commitHash) return baseContent

  const transformed = applyLineTransformations(lines, rand, { mode: 'modified' })
  return transformed.join('\n')
}

export const generateOriginalContent = (file) => {
  if (!file || !file.content) return ''
  const content = file.content
  const lines = content.split('\n')

  if (file.status === FILE_CHANGE_STATUS.ADDED) {
    return ''
  }
  if (file.status === FILE_CHANGE_STATUS.DELETED) {
    return content
  }
  if (file.status === FILE_CHANGE_STATUS.MODIFIED) {
    const seed = simpleHash(file.path || file.name || 'default')
    const rand = seededRandom(seed)
    const modified = applyLineTransformations(lines, rand, { mode: 'original' })
    return modified.join('\n')
  }
  return content
}

export const buildFileTreeFromList = (fileList, fileContents, commitHash) => {
  if (!Array.isArray(fileList)) return null
  const tree = {
    id: 'root',
    name: 'my-project',
    type: FILE_TYPE.FOLDER,
    status: FILE_CHANGE_STATUS.UNCHANGED,
    children: [],
  }

  fileList.forEach(({ path, status }) => {
    const parts = path.split('/')
    let current = tree
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i]
      if (i === parts.length - 1) {
        const baseContent = fileContents[path] || `// ${part}\n// This is the content of ${path}`
        let finalContent
        if (status === FILE_CHANGE_STATUS.DELETED) {
          finalContent = baseContent
        } else if (commitHash && status !== FILE_CHANGE_STATUS.ADDED) {
          finalContent = transformContentForCommit(path, baseContent, commitHash)
        } else {
          finalContent = baseContent
        }
        current.children.push({
          id: `file-${path}-${commitHash || 'base'}`,
          name: part,
          type: FILE_TYPE.FILE,
          path,
          status,
          content: finalContent,
        })
      } else {
        let existing = current.children.find((c) => c.name === part && c.type === FILE_TYPE.FOLDER)
        if (!existing) {
          existing = {
            id: `folder-${parts.slice(0, i + 1).join('/')}-${commitHash || 'base'}`,
            name: part,
            type: FILE_TYPE.FOLDER,
            status: FILE_CHANGE_STATUS.UNCHANGED,
            children: [],
          }
          current.children.push(existing)
        }
        current = existing
      }
    }
  })

  return tree
}

export const computeCommitFileSnapshot = (commitHistory, targetCommitHash, baseFileList) => {
  if (!Array.isArray(commitHistory) || !Array.isArray(baseFileList)) return []
  const targetIdx = commitHistory.findIndex((c) => c.hash === targetCommitHash)
  if (targetIdx === -1) return baseFileList

  const fileMap = new Map()
  baseFileList.forEach((f) => fileMap.set(f.path, { path: f.path, status: FILE_CHANGE_STATUS.UNCHANGED }))

  for (let i = 0; i <= targetIdx; i++) {
    const commit = commitHistory[i]
    if (!commit) continue
    const files = Array.isArray(commit.files) ? commit.files : []
    const deletedFiles = Array.isArray(commit.deletedFiles) ? commit.deletedFiles : []

    files.forEach((entry) => {
      const { path, status: explicitStatus } = normalizeFileEntry(entry)
      if (i === targetIdx) {
        if (explicitStatus === FILE_CHANGE_STATUS.ADDED && !fileMap.has(path)) {
          fileMap.set(path, { path, status: FILE_CHANGE_STATUS.ADDED })
        } else if (explicitStatus === FILE_CHANGE_STATUS.MODIFIED && fileMap.has(path)) {
          fileMap.set(path, { path, status: FILE_CHANGE_STATUS.MODIFIED })
        } else if (!explicitStatus) {
          if (fileMap.has(path)) {
            fileMap.set(path, { path, status: FILE_CHANGE_STATUS.MODIFIED })
          } else {
            fileMap.set(path, { path, status: FILE_CHANGE_STATUS.ADDED })
          }
        }
      } else {
        if (!fileMap.has(path)) {
          fileMap.set(path, { path, status: FILE_CHANGE_STATUS.UNCHANGED })
        } else {
          fileMap.set(path, { path, status: FILE_CHANGE_STATUS.UNCHANGED })
        }
      }
    })

    deletedFiles.forEach((entry) => {
      const { path } = normalizeFileEntry(entry)
      if (i === targetIdx) {
        if (fileMap.has(path)) {
          fileMap.set(path, { path, status: FILE_CHANGE_STATUS.DELETED })
        } else {
          fileMap.set(path, { path, status: FILE_CHANGE_STATUS.DELETED })
        }
      } else {
        fileMap.delete(path)
      }
    })
  }

  return Array.from(fileMap.values())
}
