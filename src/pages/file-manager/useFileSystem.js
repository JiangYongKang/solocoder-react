import { useState, useEffect, useCallback } from 'react'
import {
  loadData,
  saveData,
  createFolder,
  createFile,
  renameNode,
  deleteNode,
  getNodeChildren,
  getPathToNode,
  countFolderChildren,
  sortItems,
  isNameValid,
  hasChildWithName,
} from './utils'

export function useFileSystem() {
  const [data, setData] = useState(() => loadData())
  const [currentFolderId, setCurrentFolderId] = useState(() => {
    const initial = loadData()
    return initial.rootId
  })
  const [expandedFolders, setExpandedFolders] = useState(() => {
    const initial = loadData()
    return new Set([initial.rootId])
  })
  const [viewMode, setViewMode] = useState('grid')
  const [sortBy, setSortBy] = useState('name')
  const [sortOrder, setSortOrder] = useState('asc')

  useEffect(() => {
    saveData(data)
  }, [data])

  const toggleFolder = useCallback((folderId) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev)
      if (next.has(folderId)) {
        next.delete(folderId)
      } else {
        next.add(folderId)
      }
      return next
    })
  }, [])

  const selectFolder = useCallback((folderId) => {
    setCurrentFolderId(folderId)
    setExpandedFolders((prev) => {
      const next = new Set(prev)
      next.add(folderId)
      return next
    })
  }, [])

  const getCurrentChildren = useCallback(() => {
    const children = getNodeChildren(data, currentFolderId)
    return sortItems(children, sortBy, sortOrder)
  }, [data, currentFolderId, sortBy, sortOrder])

  const getCurrentPath = useCallback(() => {
    return getPathToNode(data, currentFolderId)
  }, [data, currentFolderId])

  const getFolderChildCount = useCallback((folderId) => {
    return countFolderChildren(data, folderId)
  }, [data])

  const isFolderExpanded = useCallback((folderId) => {
    return expandedFolders.has(folderId)
  }, [expandedFolders])

  const handleCreateFolder = useCallback((parentId, name) => {
    if (!isNameValid(name)) return { success: false, error: '名称不能为空' }
    if (hasChildWithName(data, parentId, name)) {
      return { success: false, error: '该名称已存在' }
    }
    setData((prev) => createFolder(prev, parentId, name))
    return { success: true }
  }, [data])

  const handleCreateFile = useCallback((parentId, name) => {
    if (!isNameValid(name)) return { success: false, error: '名称不能为空' }
    if (hasChildWithName(data, parentId, name)) {
      return { success: false, error: '该名称已存在' }
    }
    setData((prev) => createFile(prev, parentId, name))
    return { success: true }
  }, [data])

  const handleRename = useCallback((nodeId, newName) => {
    if (!isNameValid(newName)) return { success: false, error: '名称不能为空' }
    const node = data.nodes[nodeId]
    if (!node) return { success: false, error: '节点不存在' }
    if (hasChildWithName(data, node.parentId, newName, nodeId)) {
      return { success: false, error: '该名称已存在' }
    }
    setData((prev) => renameNode(prev, nodeId, newName))
    return { success: true }
  }, [data])

  const handleDelete = useCallback((nodeId) => {
    if (nodeId === data.rootId) return { success: false, error: '不能删除根目录' }
    setData((prev) => deleteNode(prev, nodeId))
    return { success: true }
  }, [data])

  const setSort = useCallback((newSortBy) => {
    setSortBy((prev) => {
      if (prev === newSortBy) {
        setSortOrder((order) => (order === 'asc' ? 'desc' : 'asc'))
        return prev
      }
      setSortOrder('asc')
      return newSortBy
    })
  }, [])

  return {
    data,
    currentFolderId,
    viewMode,
    sortBy,
    sortOrder,
    expandedFolders,
    setViewMode,
    setSort,
    toggleFolder,
    selectFolder,
    getCurrentChildren,
    getCurrentPath,
    getFolderChildCount,
    isFolderExpanded,
    handleCreateFolder,
    handleCreateFile,
    handleRename,
    handleDelete,
  }
}
