import { useState, useRef } from 'react'
import { parseCSV, validateImportData } from './utils.js'

export default function CSVImportModal({ open, existingTags, onConfirm, onCancel }) {
  const [parsedData, setParsedData] = useState(null)
  const [validationResult, setValidationResult] = useState(null)
  const [error, setError] = useState('')
  const fileInputRef = useRef(null)

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    setError('')
    setParsedData(null)
    setValidationResult(null)

    try {
      const text = await file.text()
      const parseResult = parseCSV(text)
      if (!parseResult.success) {
        setError(parseResult.error || 'CSV 解析失败')
        return
      }
      if (parseResult.data.length === 0) {
        setError('CSV 文件中没有数据行')
        return
      }
      setParsedData(parseResult)
      const validation = validateImportData(parseResult.data, existingTags)
      setValidationResult(validation)
    } catch {
      setError('文件读取失败')
    }
  }

  const handleConfirm = () => {
    if (validationResult && validationResult.valid.length > 0) {
      onConfirm(validationResult.valid, validationResult)
      resetState()
    }
  }

  const handleCancel = () => {
    resetState()
    onCancel()
  }

  const resetState = () => {
    setParsedData(null)
    setValidationResult(null)
    setError('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  if (!open) return null

  const previewRows = parsedData ? parsedData.data.slice(0, 5) : []
  const headers = parsedData ? parsedData.headers : []

  return (
    <div className="modal-overlay" onClick={handleCancel}>
      <div
        className="modal-content modal-large"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h3 className="modal-title">导入标签数据</h3>
          <button className="modal-close" onClick={handleCancel}>
            ×
          </button>
        </div>
        <div className="modal-body">
          <div className="form-row">
            <label className="form-label">选择 CSV 文件</label>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              className="form-input"
              onChange={handleFileChange}
            />
            <span className="form-hint">
              CSV 列名需包含：标签名称、父标签名称、颜色 HEX、资源计数（标签名称为必填）
            </span>
          </div>

          {error && <div className="csv-import-result error">{error}</div>}

          {validationResult && (
            <div
              className={`csv-import-result ${validationResult.invalid.length > 0 ? 'warning' : 'success'}`}
            >
              共 {validationResult.valid.length + validationResult.invalid.length} 条数据，
              有效 {validationResult.valid.length} 条，
              无效 {validationResult.invalid.length} 条
              {validationResult.invalid.length > 0 && '（无效数据将被跳过）'}
            </div>
          )}

          {validationResult?.invalid.length > 0 && (
            <div className="invalid-records">
              <div className="invalid-title">无效数据详情</div>
              {validationResult.invalid.slice(0, 5).map((item) => (
                <div key={item.index} className="invalid-item">
                  <span className="invalid-row">第 {item.index} 行：</span>
                  {Object.entries(item.errors).map(([field, msg]) => (
                    <span key={field} className="invalid-msg">
                      {msg}
                    </span>
                  ))}
                </div>
              ))}
              {validationResult.invalid.length > 5 && (
                <div className="invalid-more">
                  还有 {validationResult.invalid.length - 5} 条无效数据...
                </div>
              )}
            </div>
          )}

          {parsedData && previewRows.length > 0 && (
            <div className="csv-preview">
              <div className="csv-preview-title">数据预览（前 {previewRows.length} 行）</div>
              <div style={{ overflowX: 'auto' }}>
                <table className="csv-preview-table">
                  <thead>
                    <tr>
                      <th style={{ width: 40 }}>#</th>
                      {headers.map((h) => (
                        <th key={h}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {previewRows.map((row, idx) => {
                      const rowInvalid = validationResult?.invalid.some(
                        (inv) => inv.index === idx + 2
                      )
                      return (
                        <tr
                          key={idx}
                          style={rowInvalid ? { background: 'rgba(239,68,68,0.08)' } : {}}
                        >
                          <td>{idx + 1}</td>
                          {headers.map((h) => (
                            <td key={h}>{row[h] || ''}</td>
                          ))}
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="form-actions" style={{ marginTop: 24 }}>
            <button className="btn btn-secondary" onClick={handleCancel}>
              取消
            </button>
            <button
              className="btn btn-primary"
              onClick={handleConfirm}
              disabled={!validationResult || validationResult.valid.length === 0}
            >
              确认导入（{validationResult?.valid.length || 0} 条）
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
