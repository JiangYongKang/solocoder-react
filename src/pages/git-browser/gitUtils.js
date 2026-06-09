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

const applyLineTransformations = (lines, rand, options = {}) => {
  const { mode = 'original' } = options
  const result = [...lines]
  const lineCount = result.length

  if (lineCount === 0) return result

  const numReplacements = Math.min(
    Math.max(1, Math.floor(lineCount * 0.15) + 1),
    Math.floor(lineCount / 2),
    3
  )

  for (let i = 0; i < numReplacements; i++) {
    const idx = Math.floor(rand() * lineCount)
    if (typeof result[idx] === 'string' && result[idx].length > 5) {
      if (mode === 'original') {
        result[idx] = result[idx].replace(/[A-Za-z_][A-Za-z0-9_]*/, (match) => {
          if (match.length >= 3 && /^[A-Z]/.test(match)) {
            return 'Old' + match.slice(1)
          }
          if (match.length >= 3) {
            return 'old' + match.charAt(0).toUpperCase() + match.slice(1)
          }
          return match + '_old'
        })
      } else {
        result[idx] = result[idx].replace(/[A-Za-z_][A-Za-z0-9_]*/, (match) => {
          if (match.length >= 3 && /^[A-Z]/.test(match)) {
            return 'New' + match.slice(1)
          }
          if (match.length >= 3) {
            return 'new' + match.charAt(0).toUpperCase() + match.slice(1)
          }
          return match + '_v2'
        })
      }
    }
  }

  if (mode === 'original' && lineCount > 4) {
    const numDeletions = Math.min(2, Math.floor(lineCount / 6) + 1)
    for (let i = 0; i < numDeletions; i++) {
      const delIdx = Math.floor(rand() * result.length)
      if (delIdx >= 0 && delIdx < result.length) {
        result.splice(delIdx, 1)
      }
    }
  }

  if (mode === 'modified' && lineCount > 3) {
    const numInsertions = Math.min(2, Math.floor(lineCount / 8) + 1)
    for (let i = 0; i < numInsertions; i++) {
      const insIdx = Math.floor(rand() * (result.length + 1))
      const placeholderLines = [
        '  // TODO: handle edge case',
        '  const processed = input.trim()',
        '  return result ?? defaultValue',
        '  /* istanbul ignore next */',
        '  logger.debug("step completed")',
      ]
      result.splice(insIdx, 0, placeholderLines[Math.floor(rand() * placeholderLines.length)])
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
