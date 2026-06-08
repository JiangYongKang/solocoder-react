import { FILE_CHANGE_STATUS, FILE_TYPE } from './constants'

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
    const modified = [...lines]
    for (let i = 0; i < Math.min(3, modified.length); i++) {
      const idx = Math.floor(Math.random() * modified.length)
      if (modified[idx].length > 10) {
        modified[idx] = modified[idx].replace(/\w+/, 'old')
      }
    }
    if (modified.length > 2) {
      modified.splice(Math.floor(modified.length / 2), 0, '// removed line 1', '// removed line 2')
    }
    return modified.join('\n')
  }
  return content
}
