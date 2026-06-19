import { useState, useMemo } from 'react'
import ColorPicker from './ColorPicker.jsx'
import { DEFAULT_COLOR } from './constants.js'

export default function MergeSplitModal({
  open,
  mode = 'merge',
  selectedTags = [],
  allTags = [],
  onConfirm,
  onCancel,
}) {
  const [targetId, setTargetId] = useState('')
  const [newTagName, setNewTagName] = useState('')
  const [newTagColor, setNewTagColor] = useState(DEFAULT_COLOR)
  const [errors, setErrors] = useState({})

  const sourceTag = selectedTags[0]

  const validMergeSources = useMemo(() => {
    return selectedTags.filter((t) => t.id !== targetId)
  }, [selectedTags, targetId])

  const handleConfirm = () => {
    const newErrors = {}
    if (mode === 'merge') {
      if (!targetId) {
        newErrors.targetId = '请选择主标签'
      }
      if (validMergeSources.length < 1) {
        newErrors.general = '请至少选择两个不同的标签进行合并'
      }
    } else {
      if (!newTagName.trim()) {
        newErrors.name = '请输入新标签名称'
      } else if (!sourceTag) {
        newErrors.general = '请先选择要拆分的标签'
      } else {
        const duplicate = allTags.some(
          (t) =>
            t.parentId === sourceTag.parentId &&
            t.name.trim() === newTagName.trim()
        )
        if (duplicate) {
          newErrors.name = '同级标签下名称已存在'
        }
      }
      if (sourceTag && (sourceTag.resourceCount || 0) < 2) {
        newErrors.general = '资源数不足，无法拆分'
      }
    }
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }
    if (mode === 'merge') {
      onConfirm({
        mode,
        sourceIds: validMergeSources.map((t) => t.id),
        targetId,
      })
    } else {
      onConfirm({
        mode,
        sourceId: sourceTag.id,
        newTagName: newTagName.trim(),
        newTagColor,
      })
    }
  }

  if (!open) return null

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">
            {mode === 'merge' ? '合并标签' : '拆分标签'}
          </h3>
          <button className="modal-close" onClick={onCancel}>
            ×
          </button>
        </div>
        <div className="modal-body">
          {errors.general && (
            <div className="alert alert-error">{errors.general}</div>
          )}

          {mode === 'merge' ? (
            <>
              <div className="form-row">
                <label className="form-label">已选择的标签</label>
                <div className="tag-chips">
                  {selectedTags.map((tag) => (
                    <span
                      key={tag.id}
                      className="tag-chip"
                      style={{
                        backgroundColor: tag.color + '20',
                        color: tag.color,
                        borderColor: tag.color,
                      }}
                    >
                      {tag.name} ({tag.resourceCount || 0})
                    </span>
                  ))}
                </div>
              </div>
              <div className="form-row">
                <label className="form-label">选择主标签</label>
                <select
                  className={`form-input ${errors.targetId ? 'error' : ''}`}
                  value={targetId}
                  onChange={(e) => setTargetId(e.target.value)}
                >
                  <option value="">请选择主标签</option>
                  {selectedTags.map((tag) => (
                    <option key={tag.id} value={tag.id}>
                      {tag.name} ({tag.resourceCount || 0})
                    </option>
                  ))}
                </select>
                {errors.targetId && (
                  <span className="form-error">{errors.targetId}</span>
                )}
                <p className="form-hint">
                  其他标签的资源将归入主标签，其他标签将被删除
                </p>
              </div>
              {targetId && (
                <div className="merge-preview">
                  <div className="preview-title">合并后预览</div>
                  <div className="preview-item">
                    <span>主标签：</span>
                    <strong>
                      {selectedTags.find((t) => t.id === targetId)?.name}
                    </strong>
                  </div>
                  <div className="preview-item">
                    <span>合并后资源数：</span>
                    <strong>
                      {selectedTags.reduce(
                        (sum, t) => sum + (t.resourceCount || 0),
                        0
                      )}
                    </strong>
                  </div>
                </div>
              )}
            </>
          ) : (
            <>
              {sourceTag && (
                <div className="form-row">
                  <label className="form-label">要拆分的标签</label>
                  <div
                    className="tag-chip large"
                    style={{
                      backgroundColor: sourceTag.color + '20',
                      color: sourceTag.color,
                      borderColor: sourceTag.color,
                    }}
                  >
                    {sourceTag.name} ({sourceTag.resourceCount || 0})
                  </div>
                </div>
              )}
              <div className="form-row">
                <label className="form-label">新标签名称</label>
                <input
                  type="text"
                  className={`form-input ${errors.name ? 'error' : ''}`}
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  placeholder="请输入新标签名称"
                />
                {errors.name && (
                  <span className="form-error">{errors.name}</span>
                )}
              </div>
              <div className="form-row">
                <label className="form-label">新标签颜色</label>
                <ColorPicker
                  value={newTagColor}
                  onChange={setNewTagColor}
                  onReset={() => setNewTagColor(DEFAULT_COLOR)}
                />
              </div>
              {sourceTag && (
                <div className="split-preview">
                  <div className="preview-title">拆分后预览</div>
                  <div className="preview-row">
                    <div className="preview-item">
                      <span>{sourceTag.name}：</span>
                      <strong>
                        {Math.ceil((sourceTag.resourceCount || 0) / 2)}
                      </strong>
                    </div>
                    <div className="preview-arrow">→</div>
                    <div className="preview-item">
                      <span>
                        {newTagName.trim() || '新标签'}：
                      </span>
                      <strong>
                        {Math.floor((sourceTag.resourceCount || 0) / 2)}
                      </strong>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
        <div className="form-actions">
          <button className="btn btn-secondary" onClick={onCancel}>
            取消
          </button>
          <button className="btn btn-primary" onClick={handleConfirm}>
            确认{mode === 'merge' ? '合并' : '拆分'}
          </button>
        </div>
      </div>
    </div>
  )
}
