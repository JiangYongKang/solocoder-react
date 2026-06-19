import { useState, useEffect, useCallback } from 'react'
import TagTree from './TagTree.jsx'
import ResourceList from './ResourceList.jsx'
import TrendChart from './TrendChart.jsx'
import TagFormModal from './TagFormModal.jsx'
import MergeSplitModal from './MergeSplitModal.jsx'
import CSVImportModal from './CSVImportModal.jsx'
import {
  loadTags,
  saveTags,
  loadTrendData,
  saveTrendData,
  createTag,
  updateTag,
  deleteTag,
} from './storage.js'
import {
  tagsToCSV,
  downloadCSV,
  mergeTags,
  splitTag,
  moveTag,
  getTagById,
  generateTrendData,
  batchCreateTags,
} from './utils.js'
import { TREND_DAYS } from './constants.js'
import './tag-manager.css'

export default function TagManagerPage() {
  const [tags, setTags] = useState(() => loadTags())
  const [trendData, setTrendData] = useState(() => loadTrendData(loadTags()))
  const [selectedIds, setSelectedIds] = useState([])
  const [activeTagId, setActiveTagId] = useState(null)
  const [toast, setToast] = useState(null)

  const [formModal, setFormModal] = useState({
    open: false,
    mode: 'create',
    initialData: {},
  })
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [mergeSplitModal, setMergeSplitModal] = useState({
    open: false,
    mode: 'merge',
  })
  const [importModal, setImportModal] = useState(false)

  useEffect(() => {
    saveTags(tags)
  }, [tags])

  useEffect(() => {
    saveTrendData(trendData)
  }, [trendData])

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }, [])

  const handleCreateTag = () => {
    setFormModal({
      open: true,
      mode: 'create',
      title: '新建标签',
      initialData: { parentId: null },
    })
  }

  const handleEditTag = (tag) => {
    setFormModal({
      open: true,
      mode: 'edit',
      title: '编辑标签',
      initialData: { ...tag },
    })
  }

  const handleAddChildTag = (tag) => {
    setFormModal({
      open: true,
      mode: 'create',
      title: '创建子标签',
      initialData: { parentId: tag.id },
    })
  }

  const handleDeleteTag = (tag) => {
    const tagWithChildren = [tag.id, ...getAllChildIds(tag.id)]
    const totalResources = tagWithChildren.reduce(
      (sum, id) => sum + (getTagById(tags, id)?.resourceCount || 0),
      0
    )
    if (totalResources > 0) {
      setDeleteConfirm({ tag, totalResources, childCount: tagWithChildren.length - 1 })
    } else {
      confirmDelete(tag.id)
    }
  }

  const getAllChildIds = (parentId) => {
    const childIds = []
    function findChildren(pid) {
      tags.forEach((tag) => {
        if (tag.parentId === pid) {
          childIds.push(tag.id)
          findChildren(tag.id)
        }
      })
    }
    findChildren(parentId)
    return childIds
  }

  const confirmDelete = (tagId) => {
    const result = deleteTag(tags, tagId)
    if (result.success) {
      setTags(result.tags)
      setSelectedIds((prev) => prev.filter((id) => id !== tagId))
      if (activeTagId === tagId) {
        setActiveTagId(null)
      }
      setTrendData(generateTrendData(result.tags, TREND_DAYS))
      showToast(`删除成功，共删除 ${result.deletedCount} 个标签`)
    }
    setDeleteConfirm(null)
  }

  const handleFormConfirm = (data) => {
    if (formModal.mode === 'create') {
      const result = createTag(tags, data)
      if (result.success) {
        setTags(result.tags)
        setTrendData(generateTrendData(result.tags, TREND_DAYS))
        showToast('标签创建成功')
      } else {
        showToast(Object.values(result.errors)[0], 'error')
        return
      }
    } else {
      const result = updateTag(tags, formModal.initialData.id, data)
      if (result.success) {
        setTags(result.tags)
        setTrendData(generateTrendData(result.tags, TREND_DAYS))
        showToast('标签更新成功')
      } else {
        showToast(Object.values(result.errors)[0], 'error')
        return
      }
    }
    setFormModal({ open: false, mode: 'create', initialData: {} })
  }

  const handleSelectionChange = (ids) => {
    setSelectedIds(ids)
  }

  const handleTagClick = (tagId) => {
    setActiveTagId(tagId)
  }

  const handleMoveTag = (sourceId, targetId, position) => {
    const result = moveTag(tags, sourceId, targetId, position)
    if (result.success) {
      setTags(result.tags)
      showToast('移动成功')
    } else {
      showToast(result.error, 'error')
    }
  }

  const handleMerge = () => {
    if (selectedIds.length < 2) {
      showToast('请至少选择两个标签进行合并', 'error')
      return
    }
    setMergeSplitModal({
      open: true,
      mode: 'merge',
    })
  }

  const handleSplit = () => {
    if (selectedIds.length !== 1) {
      showToast('请选择一个标签进行拆分', 'error')
      return
    }
    const tag = getTagById(tags, selectedIds[0])
    if (!tag || (tag.resourceCount || 0) < 2) {
      showToast('资源数不足，无法拆分', 'error')
      return
    }
    setMergeSplitModal({
      open: true,
      mode: 'split',
    })
  }

  const handleMergeSplitConfirm = (data) => {
    if (data.mode === 'merge') {
      const result = mergeTags(tags, data.sourceIds, data.targetId)
      if (result.success) {
        setTags(result.tags)
        setSelectedIds([data.targetId])
        setActiveTagId(data.targetId)
        setTrendData(generateTrendData(result.tags, TREND_DAYS))
        showToast(
          `合并成功，合并了 ${result.mergedCount} 个标签，转移了 ${result.transferredResources} 个资源`
        )
      } else {
        showToast(result.error, 'error')
        return
      }
    } else {
      const result = splitTag(tags, data.sourceId, data.newTagName, data.newTagColor)
      if (result.success) {
        setTags(result.tags)
        setTrendData(generateTrendData(result.tags, TREND_DAYS))
        showToast(
          `拆分成功，新标签「${result.newTag.name}」获得 ${result.transferredResources} 个资源`
        )
      } else {
        showToast(result.error, 'error')
        return
      }
    }
    setMergeSplitModal({ open: false, mode: 'merge' })
  }

  const handleExportCSV = () => {
    const getParentName = (parentId) => {
      if (!parentId) return ''
      const parent = getTagById(tags, parentId)
      return parent ? parent.name : ''
    }
    const csv = tagsToCSV(tags, getParentName)
    downloadCSV(csv, `tags_${Date.now()}.csv`)
    showToast('导出成功')
  }

  const handleImportCSV = () => {
    setImportModal(true)
  }

  const handleImportConfirm = (validRows, validationResult) => {
    const result = batchCreateTags(tags, validRows)
    setTags(result.tags)
    setTrendData(generateTrendData(result.tags, TREND_DAYS))
    showToast(
      `导入完成：成功 ${result.created} 条，跳过 ${validationResult.invalid.length} 条`
    )
    setImportModal(false)
  }

  const activeTag = activeTagId ? getTagById(tags, activeTagId) : null
  const selectedTags = selectedIds
    .map((id) => getTagById(tags, id))
    .filter(Boolean)

  return (
    <div className="tag-manager-container">
      <div className="tag-manager-header">
        <h1 className="tag-manager-title">标签管理后台</h1>
        <div className="tag-manager-toolbar">
          <button className="btn btn-primary" onClick={handleCreateTag}>
            ➕ 新建标签
          </button>
          <button
            className="btn btn-secondary"
            onClick={handleMerge}
            disabled={selectedIds.length < 2}
          >
            🔗 合并
          </button>
          <button
            className="btn btn-secondary"
            onClick={handleSplit}
            disabled={selectedIds.length !== 1}
          >
            ✂️ 拆分
          </button>
          <button className="btn btn-secondary" onClick={handleImportCSV}>
            📥 导入 CSV
          </button>
          <button className="btn btn-secondary" onClick={handleExportCSV}>
            📤 导出 CSV
          </button>
        </div>
      </div>

      <div className="tag-manager-body">
        <div className="tag-tree-panel">
          <TagTree
            tags={tags}
            selectedIds={new Set(selectedIds)}
            onSelectionChange={handleSelectionChange}
            onTagClick={handleTagClick}
            onEdit={handleEditTag}
            onDelete={handleDeleteTag}
            onAddChild={handleAddChildTag}
            onMove={handleMoveTag}
          />
        </div>
        <div className="tag-detail-panel">
          <ResourceList tag={activeTag} />
        </div>
      </div>

      <div className="tag-manager-footer">
        <TrendChart tags={tags} trendData={trendData} />
      </div>

      {formModal.open && (
        <TagFormModal
          key={`${formModal.mode}_${formModal.initialData.id || 'new'}`}
          open={formModal.open}
          mode={formModal.mode}
          title={formModal.title}
          initialData={formModal.initialData}
          allTags={tags}
          onConfirm={handleFormConfirm}
          onCancel={() =>
            setFormModal({ open: false, mode: 'create', initialData: {} })
          }
        />
      )}

      {deleteConfirm && (
        <div
          className="modal-overlay"
          onClick={() => setDeleteConfirm(null)}
        >
          <div
            className="modal-content modal-small"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3 className="modal-title">确认删除</h3>
              <button
                className="modal-close"
                onClick={() => setDeleteConfirm(null)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <p>
                确定要删除标签「
                <strong style={{ color: deleteConfirm.tag.color }}>
                  {deleteConfirm.tag.name}
                </strong>
                」吗？
              </p>
              {deleteConfirm.childCount > 0 && (
                <p style={{ color: 'var(--text-secondary)' }}>
                  同时将删除其下 {deleteConfirm.childCount} 个子标签
                </p>
              )}
              <p style={{ color: 'var(--danger)' }}>
                该标签及其子标签共关联 {deleteConfirm.totalResources} 个资源，删除后数据将无法恢复。
              </p>
            </div>
            <div className="form-actions">
              <button
                className="btn btn-secondary"
                onClick={() => setDeleteConfirm(null)}
              >
                取消
              </button>
              <button
                className="btn btn-danger"
                onClick={() => confirmDelete(deleteConfirm.tag.id)}
              >
                确认删除
              </button>
            </div>
          </div>
        </div>
      )}

      <MergeSplitModal
        open={mergeSplitModal.open}
        mode={mergeSplitModal.mode}
        selectedTags={selectedTags}
        allTags={tags}
        onConfirm={handleMergeSplitConfirm}
        onCancel={() => setMergeSplitModal({ open: false, mode: 'merge' })}
      />

      <CSVImportModal
        open={importModal}
        existingTags={tags}
        onConfirm={handleImportConfirm}
        onCancel={() => setImportModal(false)}
      />

      {toast && (
        <div className={`toast ${toast.type}`}>
          {toast.message}
        </div>
      )}
    </div>
  )
}
