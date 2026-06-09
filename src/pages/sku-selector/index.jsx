import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import './sku-selector.css'
import {
  addSpecGroup,
  updateSpecGroup,
  deleteSpecGroup,
  addSpecValue,
  updateSpecValue,
  deleteSpecValue,
  generateSkuList,
  syncSkuList,
  updateSku,
  batchSetStock,
  batchSetPrice,
  findSkuBySelection,
  getSelectedSummary,
  getDisabledValues,
  getImagesForSelection,
  loadFromStorage,
  saveToStorage,
  clearStorage,
  DEFAULT_SPEC_GROUPS,
} from './skuCore'

let _initStorageCache = null

function _getInitStorage() {
  if (!_initStorageCache) {
    _initStorageCache = loadFromStorage()
  }
  return _initStorageCache
}

function SpecConfigPanel({ groups, onGroupsChange }) {
  const fileInputRefs = useRef({})

  const handleAddGroup = () => {
    onGroupsChange(addSpecGroup(groups, `规格组${groups.length + 1}`))
  }

  const handleUpdateGroupName = (groupId, name) => {
    onGroupsChange(updateSpecGroup(groups, groupId, { name }))
  }

  const handleDeleteGroup = (groupId) => {
    onGroupsChange(deleteSpecGroup(groups, groupId))
  }

  const handleAddValue = (groupId) => {
    onGroupsChange(addSpecValue(groups, groupId, `规格值${(groups.find((g) => g.id === groupId)?.values?.length || 0) + 1}`))
  }

  const handleUpdateValueName = (groupId, valueId, name) => {
    onGroupsChange(updateSpecValue(groups, groupId, valueId, { name }))
  }

  const handleDeleteValue = (groupId, valueId) => {
    onGroupsChange(deleteSpecValue(groups, groupId, valueId))
  }

  const handleImageUploadClick = (groupId, valueId) => {
    const key = `${groupId}_${valueId}`
    fileInputRefs.current[key]?.click()
  }

  const handleImageFileChange = (e, groupId, valueId) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result
      if (dataUrl) {
        onGroupsChange(updateSpecValue(groups, groupId, valueId, { image: dataUrl }))
      }
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  return (
    <div className="sku-panel">
      <div className="sku-panel-header">
        <h3 className="sku-panel-title">规格配置</h3>
      </div>
      <div className="sku-panel-body">
        {groups.map((group) => (
          <div key={group.id} className="sku-group">
            <div className="sku-group-header">
              <input
                className="sku-group-input"
                value={group.name}
                onChange={(e) => handleUpdateGroupName(group.id, e.target.value)}
                placeholder="规格组名称"
              />
              <button
                className="sku-group-delete"
                onClick={() => handleDeleteGroup(group.id)}
                title="删除规格组"
              >
                ×
              </button>
            </div>
            <div className="sku-values-list">
              {(group.values || []).map((value) => (
                <div key={value.id} className="sku-value-row">
                  <input
                    className="sku-value-input"
                    value={value.name}
                    onChange={(e) => handleUpdateValueName(group.id, value.id, e.target.value)}
                    placeholder="规格值"
                  />
                  <button
                    className={`sku-value-image-btn ${value.image ? 'has-image' : ''}`}
                    onClick={() => handleImageUploadClick(group.id, value.id)}
                    title={value.image ? '已上传图片，点击更换' : '上传图片'}
                  >
                    {value.image ? '已配图' : '配图'}
                  </button>
                  <input
                    ref={(el) => {
                      const key = `${group.id}_${value.id}`
                      fileInputRefs.current[key] = el
                    }}
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={(e) => handleImageFileChange(e, group.id, value.id)}
                  />
                  <button
                    className="sku-value-delete"
                    onClick={() => handleDeleteValue(group.id, value.id)}
                    title="删除规格值"
                  >
                    ×
                  </button>
                </div>
              ))}
              <button
                className="sku-add-value-btn"
                onClick={() => handleAddValue(group.id)}
              >
                + 添加规格值
              </button>
            </div>
          </div>
        ))}
        <button
          className="sku-add-group-btn"
          onClick={handleAddGroup}
        >
          + 添加规格组
        </button>
      </div>
    </div>
  )
}

function SkuListPanel({ skus, groups, onSkusChange }) {
  const [batchStock, setBatchStock] = useState('')
  const [batchPrice, setBatchPrice] = useState('')

  const handleBatchSetStock = () => {
    if (batchStock === '') return
    onSkusChange(batchSetStock(skus, batchStock))
  }

  const handleBatchSetPrice = () => {
    if (batchPrice === '') return
    onSkusChange(batchSetPrice(skus, batchPrice))
  }

  const handleSkuStockChange = (skuId, stock) => {
    const num = stock === '' ? '' : Number(stock)
    onSkusChange(updateSku(skus, skuId, { stock: num === '' ? '' : (Number.isFinite(num) ? num : 0) }))
  }

  const handleSkuPriceChange = (skuId, price) => {
    const num = price === '' ? '' : Number(price)
    onSkusChange(updateSku(skus, skuId, { price: num === '' ? '' : (Number.isFinite(num) ? num : 0) }))
  }

  return (
    <div className="sku-panel">
      <div className="sku-panel-header">
        <h3 className="sku-panel-title">SKU 列表</h3>
        <span style={{ fontSize: 12, color: 'var(--text)' }}>共 {skus.length} 个 SKU</span>
      </div>
      <div className="sku-batch-bar">
        <span style={{ fontSize: 13, color: 'var(--text)' }}>批量设置：</span>
        <input
          className="sku-batch-input"
          type="number"
          placeholder="库存"
          value={batchStock}
          onChange={(e) => setBatchStock(e.target.value)}
        />
        <button className="sku-btn sku-btn-small" onClick={handleBatchSetStock}>
          设库存
        </button>
        <input
          className="sku-batch-input"
          type="number"
          step="0.01"
          placeholder="价格"
          value={batchPrice}
          onChange={(e) => setBatchPrice(e.target.value)}
        />
        <button className="sku-btn sku-btn-small" onClick={handleBatchSetPrice}>
          设价格
        </button>
      </div>
      <div className="sku-table-wrap">
        {skus.length === 0 ? (
          <div className="sku-empty">请先在左侧配置规格组和规格值</div>
        ) : (
          <table className="sku-table">
            <thead>
              <tr>
                <th>#</th>
                <th>规格组合</th>
                <th>库存</th>
                <th>价格</th>
              </tr>
            </thead>
            <tbody>
              {skus.map((sku, idx) => (
                <tr key={sku.id}>
                  <td>{idx + 1}</td>
                  <td>
                    <div className="sku-spec-tags">
                      {(sku.specDetails || []).map((detail, i) => (
                        <span key={i} className="sku-spec-tag">
                          {detail.groupName}: {detail.valueName}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td>
                    <input
                      className="sku-num-input"
                      type="number"
                      min="0"
                      value={sku.stock}
                      onChange={(e) => handleSkuStockChange(sku.id, e.target.value)}
                    />
                  </td>
                  <td>
                    <input
                      className="sku-num-input"
                      type="number"
                      min="0"
                      step="0.01"
                      value={sku.price}
                      onChange={(e) => handleSkuPriceChange(sku.id, e.target.value)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

function PreviewPanel({ groups, skus, selection, onSelectionChange }) {
  const disabledValues = useMemo(
    () => getDisabledValues(groups, skus, selection),
    [groups, skus, selection]
  )

  const matchedSku = useMemo(
    () => findSkuBySelection(skus, selection),
    [skus, selection]
  )

  const summary = useMemo(
    () => getSelectedSummary(groups, selection),
    [groups, selection]
  )

  const images = useMemo(
    () => getImagesForSelection(groups, selection),
    [groups, selection]
  )

  const handleValueClick = (groupId, valueId) => {
    const currentValue = selection[groupId]
    if (currentValue === valueId) {
      const newSelection = { ...selection }
      delete newSelection[groupId]
      onSelectionChange(newSelection)
    } else {
      onSelectionChange({ ...selection, [groupId]: valueId })
    }
  }

  const handleClearSelection = () => {
    onSelectionChange({})
  }

  const isValueDisabled = (groupId, valueId) => {
    const list = disabledValues[groupId]
    return Array.isArray(list) && list.includes(valueId)
  }

  return (
    <div className="sku-panel">
      <div className="sku-panel-header">
        <h3 className="sku-panel-title">商品预览</h3>
      </div>

      <div className="sku-preview-main">
        {images.length > 0 ? (
          <div className="sku-preview-images">
            {images.map((img) => (
              <img
                key={img.valueId}
                className="sku-preview-image"
                src={img.image}
                alt={img.valueName}
              />
            ))}
          </div>
        ) : (
          <div className="sku-preview-placeholder">暂无商品图片</div>
        )}
        <div className="sku-preview-price">
          ¥{matchedSku && matchedSku.price != null ? Number(matchedSku.price).toFixed(2) : '--'}
        </div>
        <div className={`sku-preview-stock ${matchedSku && (matchedSku.stock ?? 0) === 0 ? 'out' : ''}`}>
          {matchedSku
            ? ((matchedSku.stock ?? 0) > 0
              ? `库存：${matchedSku.stock} 件`
              : '无货')
            : '请选择完整规格查看库存'}
        </div>
      </div>

      <div className="sku-preview-summary">{summary}</div>

      {groups.map((group) => (
        <div key={group.id} className="sku-selector-section">
          <div className="sku-selector-label">{group.name}</div>
          <div className="sku-selector-btns">
            {(group.values || []).map((value) => {
              const isActive = selection[group.id] === value.id
              const isDisabled = isValueDisabled(group.id, value.id)
              return (
                <button
                  key={value.id}
                  className={`sku-spec-btn ${isActive ? 'active' : ''}`}
                  disabled={isDisabled}
                  onClick={() => handleValueClick(group.id, value.id)}
                >
                  {value.image && (
                    <img
                      className="sku-spec-btn-thumb"
                      src={value.image}
                      alt={value.name}
                    />
                  )}
                  {value.name}
                </button>
              )
            })}
          </div>
        </div>
      ))}

      {Object.keys(selection).length > 0 && (
        <button
          className="sku-btn sku-btn-primary sku-clear-btn"
          onClick={handleClearSelection}
        >
          清空选择
        </button>
      )}
    </div>
  )
}

function SkuSelectorPage() {
  const navigate = useNavigate()
  const lastSaveAlertRef = useRef(0)

  const [groups, setGroups] = useState(() => {
    const saved = _getInitStorage()
    if (saved.groups && saved.groups.length > 0) return saved.groups
    return DEFAULT_SPEC_GROUPS
  })

  const [skus, setSkus] = useState(() => {
    const saved = _getInitStorage()
    if (saved.skus && saved.skus.length > 0) return saved.skus
    return generateSkuList(DEFAULT_SPEC_GROUPS)
  })

  const [selection, setSelection] = useState({})

  useEffect(() => {
    const newSkus = generateSkuList(groups)
    setSkus((prevSkus) => syncSkuList(prevSkus, newSkus))
  }, [groups])

  useEffect(() => {
    setSelection({})
  }, [groups])

  useEffect(() => {
    const err = _initStorageCache?.error
    _initStorageCache = null
    if (err) {
      alert('读取本地存储失败: ' + err)
    }
  }, [])

  useEffect(() => {
    const result = saveToStorage({ groups, skus })
    if (!result.success) {
      const now = Date.now()
      if (now - lastSaveAlertRef.current >= 5000) {
        lastSaveAlertRef.current = now
        alert('保存本地存储失败，数据可能丢失: ' + result.error)
      }
    }
  }, [groups, skus])

  const handleGroupsChange = useCallback((newGroups) => {
    setGroups(newGroups)
  }, [])

  const handleSkusChange = useCallback((newSkus) => {
    setSkus(newSkus)
  }, [])

  const handleSelectionChange = useCallback((newSelection) => {
    setSelection(newSelection)
  }, [])

  const handleClearAll = () => {
    if (confirm('确定要清空所有配置吗？')) {
      setGroups([])
      setSkus([])
      setSelection({})
      const result = clearStorage()
      if (!result.success) {
        console.warn('清除本地存储失败:', result.error)
      }
    }
  }

  const handleResetDefault = () => {
    if (confirm('确定要恢复默认示例配置吗？')) {
      setGroups(DEFAULT_SPEC_GROUPS)
      setSkus(generateSkuList(DEFAULT_SPEC_GROUPS))
      setSelection({})
    }
  }

  return (
    <div className="sku-page">
      <div className="sku-header">
        <div className="sku-header-left">
          <button className="sku-btn sku-btn-back" onClick={() => navigate('/')}>
            ← 返回
          </button>
          <h1 className="sku-title">SKU 规格选择器</h1>
        </div>
        <div className="sku-header-actions">
          <button className="sku-btn" onClick={handleResetDefault}>
            🔄 默认示例
          </button>
          <button className="sku-btn sku-btn-danger" onClick={handleClearAll}>
            🗑️ 清空
          </button>
        </div>
      </div>

      <div className="sku-main">
        <SpecConfigPanel groups={groups} onGroupsChange={handleGroupsChange} />
        <SkuListPanel skus={skus} groups={groups} onSkusChange={handleSkusChange} />
        <PreviewPanel
          groups={groups}
          skus={skus}
          selection={selection}
          onSelectionChange={handleSelectionChange}
        />
      </div>
    </div>
  )
}

export default SkuSelectorPage
