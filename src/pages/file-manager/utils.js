import { createInitialData } from './initialData'

const STORAGE_KEY = 'file-manager-data'

export function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (parsed && parsed.rootId && parsed.nodes) {
        return parsed
      }
    }
  } catch {
    // ignore
  }
  const initial = createInitialData()
  saveData(initial)
  return initial
}

export function saveData(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch {
    // ignore
  }
}

export function generateId(prefix = 'node') {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

export function getNodeChildren(data, nodeId) {
  const node = data.nodes[nodeId]
  if (!node) return []
  return node.children ? node.children.map((id) => data.nodes[id]).filter(Boolean) : []
}

export function getPathToNode(data, nodeId) {
  const path = []
  let current = data.nodes[nodeId]
  while (current) {
    path.unshift({ id: current.id, name: current.name })
    current = current.parentId ? data.nodes[current.parentId] : null
  }
  return path
}

export function countFolderChildren(data, nodeId) {
  const node = data.nodes[nodeId]
  if (!node || !node.children) return 0
  let count = 0
  for (const childId of node.children) {
    const child = data.nodes[childId]
    if (child && child.type === 'folder') count++
  }
  return count
}

export function collectDescendantIds(data, nodeId) {
  const ids = []
  const node = data.nodes[nodeId]
  if (!node) return ids
  if (node.children) {
    for (const childId of node.children) {
      ids.push(childId)
      ids.push(...collectDescendantIds(data, childId))
    }
  }
  return ids
}

export function createFolder(data, parentId, name) {
  const now = Date.now()
  const id = generateId('folder')
  const newNode = {
    id,
    name,
    type: 'folder',
    parentId,
    children: [],
    createdAt: now,
    updatedAt: now,
  }
  const newNodes = { ...data.nodes, [id]: newNode }
  const parent = newNodes[parentId]
  if (parent) {
    newNodes[parentId] = {
      ...parent,
      children: [...(parent.children || []), id],
      updatedAt: now,
    }
  }
  return { ...data, nodes: newNodes }
}

export function getFileTypeFromName(name) {
  const idx = name.lastIndexOf('.')
  if (idx > 0 && idx < name.length - 1) {
    return name.slice(idx + 1).toLowerCase()
  }
  return ''
}

export function createFile(data, parentId, name) {
  const now = Date.now()
  const id = generateId('file')
  const newNode = {
    id,
    name,
    type: 'file',
    fileType: getFileTypeFromName(name),
    parentId,
    size: Math.floor(Math.random() * 10240) + 100,
    createdAt: now,
    updatedAt: now,
  }
  const newNodes = { ...data.nodes, [id]: newNode }
  const parent = newNodes[parentId]
  if (parent) {
    newNodes[parentId] = {
      ...parent,
      children: [...(parent.children || []), id],
      updatedAt: now,
    }
  }
  return { ...data, nodes: newNodes }
}

export function renameNode(data, nodeId, newName) {
  const node = data.nodes[nodeId]
  if (!node) return data
  const now = Date.now()
  const updatedNode = {
    ...node,
    name: newName,
    updatedAt: now,
  }
  if (node.type === 'file') {
    updatedNode.fileType = getFileTypeFromName(newName)
  }
  const newNodes = { ...data.nodes, [nodeId]: updatedNode }
  if (node.parentId && newNodes[node.parentId]) {
    newNodes[node.parentId] = {
      ...newNodes[node.parentId],
      updatedAt: now,
    }
  }
  return { ...data, nodes: newNodes }
}

export function deleteNode(data, nodeId) {
  if (nodeId === data.rootId) return data
  const node = data.nodes[nodeId]
  if (!node) return data
  const toDelete = new Set([nodeId, ...collectDescendantIds(data, nodeId)])
  const newNodes = {}
  for (const id of Object.keys(data.nodes)) {
    if (!toDelete.has(id)) {
      newNodes[id] = { ...data.nodes[id] }
    }
  }
  if (node.parentId && newNodes[node.parentId]) {
    newNodes[node.parentId] = {
      ...newNodes[node.parentId],
      children: (newNodes[node.parentId].children || []).filter((id) => id !== nodeId),
      updatedAt: Date.now(),
    }
  }
  return { ...data, nodes: newNodes }
}

export function sortItems(items, sortBy, sortOrder) {
  const sorted = [...items]
  const multiplier = sortOrder === 'asc' ? 1 : -1
  sorted.sort((a, b) => {
    if (a.type !== b.type) {
      return a.type === 'folder' ? -1 : 1
    }
    let va
    let vb
    switch (sortBy) {
      case 'type':
        va = a.type === 'folder' ? '' : (a.fileType || '')
        vb = b.type === 'folder' ? '' : (b.fileType || '')
        break
      case 'size':
        va = a.type === 'folder' ? -1 : (a.size || 0)
        vb = b.type === 'folder' ? -1 : (b.size || 0)
        if (typeof va === 'number' && typeof vb === 'number') {
          return (va - vb) * multiplier
        }
        break
      case 'name':
      default:
        va = a.name
        vb = b.name
        break
    }
    if (va < vb) return -1 * multiplier
    if (va > vb) return 1 * multiplier
    return 0
  })
  return sorted
}

export function formatFileSize(bytes) {
  if (bytes == null || isNaN(bytes)) return '-'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`
}

export function formatDate(timestamp) {
  if (timestamp == null || Number.isNaN(timestamp)) return '-'
  const d = new Date(timestamp)
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function isNameValid(name) {
  return typeof name === 'string' && name.trim().length > 0
}

export function hasChildWithName(data, parentId, name, excludeId = null) {
  const parent = data.nodes[parentId]
  if (!parent || !parent.children) return false
  for (const childId of parent.children) {
    if (childId === excludeId) continue
    const child = data.nodes[childId]
    if (child && child.name === name) return true
  }
  return false
}
