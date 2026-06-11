import { useState, useRef } from 'react'
import * as XLSX from 'xlsx'
import { parseCSV, parseExcelData } from '../utils.js'
import { PREVIEW_ROW_COUNT } from '../constants.js'

export default function FileUploadStep({ parsedData, onParsed, parseError, onParseError }) {
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef(null)

  const handleFile = async (file) => {
    if (!file) return
    onParseError(null)
    const fileName = file.name.toLowerCase()
    try {
      if (fileName.endsWith('.csv')) {
        const text = await file.text()
        const result = parseCSV(text)
        if (!result.success) {
          onParseError(result.error || 'CSV 解析失败')
          return
        }
        if (result.data.length === 0) {
          onParseError('文件中没有数据行')
          return
        }
        onParsed({ ...result, fileName, fileSize: file.size })
      } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
        const buffer = await file.arrayBuffer()
        const workbook = XLSX.read(buffer, { type: 'array' })
        const firstSheetName = workbook.SheetNames[0]
        if (!firstSheetName) {
          onParseError('Excel 文件中没有工作表')
          return
        }
        const worksheet = workbook.Sheets[firstSheetName]
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: '' })
        const result = parseExcelData(jsonData)
        if (!result.success) {
          onParseError(result.error || 'Excel 解析失败')
          return
        }
        if (result.data.length === 0) {
          onParseError('文件中没有数据行')
          return
        }
        onParsed({ ...result, fileName, fileSize: file.size })
      } else {
        onParseError('不支持的文件格式，请上传 .csv 或 .xlsx 文件')
      }
    } catch {
      onParseError('文件读取失败，请检查文件是否损坏')
    }
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) {
      handleFile(file)
    }
  }

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  const handleInputChange = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFile(file)
    }
  }

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const previewRows = parsedData ? parsedData.data.slice(0, PREVIEW_ROW_COUNT) : []

  return (
    <div>
      {!parsedData ? (
        <div>
          <div
            className={`upload-area ${isDragging ? 'dragging' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={handleClick}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              style={{ display: 'none' }}
              onChange={handleInputChange}
            />
            <div className="upload-icon">📂</div>
            <div className="upload-title">拖拽文件到此处，或点击选择文件</div>
            <div className="upload-desc">
              支持 CSV 和 Excel (.xlsx) 格式文件
            </div>
            <button className="btn btn-primary">选择文件</button>
            <div className="upload-formats">
              提示：CSV 文件需支持 UTF-8 编码，Excel 文件读取第一个工作表
            </div>
          </div>
          {parseError && (
            <div className="upload-error">{parseError}</div>
          )}
        </div>
      ) : (
        <div>
          <div className="file-info">
            <div className="file-info-left">
              <div className="file-icon">
                {parsedData.fileName.endsWith('.csv') ? 'CSV' : 'XLSX'}
              </div>
              <div className="file-details">
                <div className="file-name">{parsedData.fileName}</div>
                <div className="file-meta">
                  {formatFileSize(parsedData.fileSize)} · {parsedData.data.length} 行数据 · {parsedData.headers.length} 列
                </div>
              </div>
            </div>
            <button className="btn btn-secondary btn-sm" onClick={() => {
              onParsed(null)
              onParseError(null)
              if (fileInputRef.current) fileInputRef.current.value = ''
            }}>
              重新上传
            </button>
          </div>

          {parseError && (
            <div className="upload-error">{parseError}</div>
          )}

          <div className="preview-section">
            <div className="section-title">
              <span>数据预览（前 {Math.min(previewRows.length, PREVIEW_ROW_COUNT)} 行）</span>
            </div>
            <div className="preview-table-wrap">
              <table className="preview-table">
                <thead>
                  <tr>
                    <th style={{ width: 50 }}>#</th>
                    {parsedData.headers.map((header) => (
                      <th key={header}>{header}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {previewRows.map((row, idx) => (
                    <tr key={idx}>
                      <td>{idx + 1}</td>
                      {parsedData.headers.map((header) => (
                        <td key={header}>{row[header] || ''}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
