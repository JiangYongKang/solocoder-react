import { useState, useRef } from 'react'
import { formatTimestamp } from './constants.js'

function SavePanel({ layouts, currentConfig, onSave, onClose }) {
  const [name, setName] = useState(`我的布局 ${layouts.length + 1}`)
  return (
    <div className="gg-modal-body">
      <div className="gg-field">
        <div className="gg-field-label">布局名称</div>
        <input
          type="text"
          className="gg-text-input"
          placeholder="输入布局名称..."
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
        />
      </div>
      <div style={{
        background: '#f8fafc',
        padding: 12,
        borderRadius: 6,
        border: '1px solid #e2e8f0',
        fontSize: 12,
        color: '#475569',
      }}>
        <div>当前配置：</div>
        <div style={{ marginTop: 6, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
          <span>网格：{currentConfig.rows} × {currentConfig.cols}</span>
          <span>间距：{currentConfig.rowGap}px / {currentConfig.colGap}px</span>
          <span>单元格数：{currentConfig.cells.length}</span>
          <span>保存时间：{formatTimestamp(Date.now())}</span>
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 'auto', paddingTop: 8 }}>
        <button className="gg-btn" onClick={onClose}>取消</button>
        <button
          className="gg-btn gg-btn-primary"
          onClick={() => {
            if (name.trim()) {
              onSave(name.trim())
              onClose()
            }
          }}
        >
          💾 保存
        </button>
      </div>
    </div>
  )
}

function LoadPanel({ layouts, onLoad, onDelete, onExport, onClose }) {
  if (layouts.length === 0) {
    return (
      <div className="gg-modal-body">
        <div className="gg-empty-state">
          <div style={{ fontSize: 40, marginBottom: 10 }}>📂</div>
          <div>暂无保存的布局</div>
          <div style={{ marginTop: 6, fontSize: 12, color: '#94a3b8' }}>
            配置好网格后，点击「保存布局」创建第一个
          </div>
        </div>
      </div>
    )
  }
  return (
    <div className="gg-modal-body">
      <div className="gg-layout-list">
        {layouts.map((l) => (
          <div
            key={l.id}
            className="gg-layout-item"
            onClick={() => onLoad(l.id)}
          >
            <div className="gg-layout-info">
              <span className="gg-layout-name">{l.name}</span>
              <div className="gg-layout-meta">
                <span>{l.config?.rows || 0} × {l.config?.cols || 0}</span>
                <span>间距 {l.config?.rowGap || 0}/{l.config?.colGap || 0}px</span>
                <span>{formatTimestamp(l.timestamp)}</span>
              </div>
            </div>
            <div className="gg-layout-actions" onClick={(e) => e.stopPropagation()}>
              <button
                className="gg-btn gg-btn-sm"
                title="导出 JSON"
                onClick={(e) => { e.stopPropagation(); onExport(l) }}
              >
                ⬇
              </button>
              <button
                className="gg-btn gg-btn-sm gg-btn-danger"
                title="删除"
                onClick={(e) => { e.stopPropagation(); onDelete(l.id) }}
              >
                🗑
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function ImportPanel({ onImport, onClose, onError }) {
  const fileRef = useRef(null)
  const [preview, setPreview] = useState(null)

  const handleFile = (file) => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const json = e.target?.result
        if (typeof json !== 'string') {
          onError('文件内容读取失败')
          return
        }
        const parsed = JSON.parse(json)
        setPreview({
          name: parsed.name || file.name,
          rows: parsed.config?.rows || '?',
          cols: parsed.config?.cols || '?',
          timestamp: parsed.timestamp ? formatTimestamp(parsed.timestamp) : '未知',
          raw: json,
        })
      } catch (err) {
        onError('JSON 解析失败: ' + (err.message || '格式错误'))
      }
    }
    reader.readAsText(file)
  }

  return (
    <div className="gg-modal-body">
      <div style={{
        border: '2px dashed #cbd5e1',
        borderRadius: 8,
        padding: 30,
        textAlign: 'center',
        cursor: 'pointer',
        background: '#f8fafc',
      }} onClick={() => fileRef.current?.click()}>
        <div style={{ fontSize: 40, marginBottom: 10 }}>⬆</div>
        <div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>点击上传 JSON 文件</div>
        <div style={{ marginTop: 6, fontSize: 12, color: '#64748b' }}>或将文件拖拽到此处</div>
        <input
          ref={fileRef}
          type="file"
          accept=".json,application/json"
          style={{ display: 'none' }}
          onChange={(e) => {
            const f = e.target.files?.[0]
            handleFile(f)
            e.target.value = ''
          }}
        />
      </div>
      {preview && (
        <div style={{
          background: '#ecfdf5',
          border: '1px solid #a7f3d0',
          padding: 12,
          borderRadius: 6,
          fontSize: 12,
          color: '#065f46',
        }}>
          <div style={{ fontWeight: 600, marginBottom: 6 }}>✓ 解析成功，预览：</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
            <span>名称：{preview.name}</span>
            <span>网格：{preview.rows} × {preview.cols}</span>
            <span style={{ gridColumn: '1 / -1' }}>时间：{preview.timestamp}</span>
          </div>
        </div>
      )}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 'auto', paddingTop: 8 }}>
        <button className="gg-btn" onClick={onClose}>取消</button>
        <button
          className="gg-btn gg-btn-primary"
          disabled={!preview}
          onClick={() => {
            if (preview?.raw) onImport(preview.raw)
          }}
        >
          ✓ 导入
        </button>
      </div>
    </div>
  )
}

export default function StorageModal({
  mode,
  layouts,
  currentConfig,
  onClose,
  onSave,
  onLoad,
  onDelete,
  onImport,
  onExport,
  onError,
}) {
  const titleMap = {
    save: '保存布局',
    load: '加载布局',
    import: '导入布局',
  }
  return (
    <div className="gg-modal-overlay" onClick={onClose}>
      <div className="gg-modal" onClick={(e) => e.stopPropagation()}>
        <div className="gg-modal-header">
          <h3 className="gg-modal-title">{titleMap[mode] || '布局管理'}</h3>
          <button className="gg-modal-close" onClick={onClose}>×</button>
        </div>
        {mode === 'save' && (
          <SavePanel
            layouts={layouts}
            currentConfig={currentConfig}
            onSave={onSave}
            onClose={onClose}
          />
        )}
        {mode === 'load' && (
          <LoadPanel
            layouts={layouts}
            onLoad={(id) => { onLoad(id); onClose() }}
            onDelete={onDelete}
            onExport={onExport}
            onClose={onClose}
          />
        )}
        {mode === 'import' && (
          <ImportPanel
            onImport={(json) => { onImport(json); onClose() }}
            onClose={onClose}
            onError={onError}
          />
        )}
      </div>
    </div>
  )
}
