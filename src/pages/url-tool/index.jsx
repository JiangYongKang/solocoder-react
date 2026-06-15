import { useState, useMemo, useCallback, useEffect } from 'react'
import { Link } from 'react-router-dom'
import './url-tool.css'
import {
  parseUrl,
  parseQueryParams,
  buildQueryString,
  buildUrl,
  urlEncode,
  urlDecode,
  encodeQueryParamsOnly,
  base64Encode,
  base64Decode,
  queryParamsToJson,
  jsonToQueryParams,
  parseBatchUrls,
  exportToCsv,
  downloadCsvFile,
  copyToClipboard,
} from './urlToolUtils'

const DEFAULT_URL = 'https://www.example.com:8080/path/to/page?name=value&id=1&keyword=hello%20world#section'

const UrlToolPage = () => {
  const [url, setUrl] = useState(DEFAULT_URL)
  const [params, setParams] = useState(() => {
    const parsed = parseUrl(DEFAULT_URL)
    return parseQueryParams(parsed.search)
  })
  const [base64Input, setBase64Input] = useState('')
  const [base64Output, setBase64Output] = useState('')
  const [base64Error, setBase64Error] = useState(null)
  const [jsonInput, setJsonInput] = useState('')
  const [jsonOutput, setJsonOutput] = useState('')
  const [jsonError, setJsonError] = useState(null)
  const [batchInput, setBatchInput] = useState('')
  const [batchResults, setBatchResults] = useState([])
  const [toast, setToast] = useState(null)

  const parsedUrl = useMemo(() => {
    return parseUrl(url)
  }, [url])

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 2000)
      return () => clearTimeout(timer)
    }
  }, [toast])

  const showToast = useCallback((type, message) => {
    setToast({ type, message })
  }, [])

  const syncUrlAndParams = useCallback((newUrl, newParams) => {
    setUrl(newUrl)
    setParams(newParams)
  }, [])

  const handleUrlChange = useCallback((e) => {
    const newUrl = e.target.value
    const parsed = parseUrl(newUrl)
    const newParams = parsed.success ? parseQueryParams(parsed.search) : []
    syncUrlAndParams(newUrl, newParams)
  }, [syncUrlAndParams])

  const rebuildUrlFromParams = useCallback((newParams, currentUrl) => {
    const currentParsed = parseUrl(currentUrl)
    if (!currentParsed.success) return
    const newSearch = buildQueryString(newParams)
    const newUrl = buildUrl({
      protocol: currentParsed.protocol,
      hostname: currentParsed.hostname,
      port: currentParsed.port,
      pathname: currentParsed.pathname,
      search: newSearch,
      hash: currentParsed.hash,
    })
    syncUrlAndParams(newUrl, newParams)
  }, [syncUrlAndParams])

  const handleParamKeyChange = useCallback((index, value) => {
    setParams((prev) => {
      const newParams = [...prev]
      newParams[index] = { ...newParams[index], key: value }
      rebuildUrlFromParams(newParams, url)
      return newParams
    })
  }, [url, rebuildUrlFromParams])

  const handleParamValueChange = useCallback((index, value) => {
    setParams((prev) => {
      const newParams = [...prev]
      newParams[index] = { ...newParams[index], value: value }
      rebuildUrlFromParams(newParams, url)
      return newParams
    })
  }, [url, rebuildUrlFromParams])

  const handleAddParam = useCallback(() => {
    setParams((prev) => {
      const newParams = [...prev, { key: '', value: '' }]
      rebuildUrlFromParams(newParams, url)
      return newParams
    })
  }, [url, rebuildUrlFromParams])

  const handleDeleteParam = useCallback((index) => {
    setParams((prev) => {
      const newParams = prev.filter((_, i) => i !== index)
      rebuildUrlFromParams(newParams, url)
      return newParams
    })
  }, [url, rebuildUrlFromParams])

  const handleClearParams = useCallback(() => {
    const newParams = []
    rebuildUrlFromParams(newParams, url)
  }, [url, rebuildUrlFromParams])

  const handleUrlEncode = useCallback(() => {
    const result = urlEncode(url)
    if (result.success) {
      const parsed = parseUrl(result.result)
      const newParams = parsed.success ? parseQueryParams(parsed.search) : params
      syncUrlAndParams(result.result, newParams)
      showToast('success', 'URL 编码完成')
    } else {
      showToast('error', result.error)
    }
  }, [url, params, showToast, syncUrlAndParams])

  const handleUrlDecode = useCallback(() => {
    const result = urlDecode(url)
    if (result.success) {
      const parsed = parseUrl(result.result)
      const newParams = parsed.success ? parseQueryParams(parsed.search) : params
      syncUrlAndParams(result.result, newParams)
      showToast('success', 'URL 解码完成')
    } else {
      showToast('error', result.error)
    }
  }, [url, params, showToast, syncUrlAndParams])

  const handleEncodeParamsOnly = useCallback(() => {
    const result = encodeQueryParamsOnly(url)
    if (result.success) {
      const parsed = parseUrl(result.result)
      const newParams = parsed.success ? parseQueryParams(parsed.search) : params
      syncUrlAndParams(result.result, newParams)
      showToast('success', '参数编码完成')
    } else {
      showToast('error', result.error)
    }
  }, [url, params, showToast, syncUrlAndParams])

  const handleBase64Encode = useCallback(() => {
    const result = base64Encode(base64Input)
    if (result.success) {
      setBase64Output(result.result)
      setBase64Error(null)
      showToast('success', 'Base64 编码完成')
    } else {
      setBase64Error(result.error)
      setBase64Output('')
      showToast('error', result.error)
    }
  }, [base64Input, showToast])

  const handleBase64Decode = useCallback(() => {
    const result = base64Decode(base64Input)
    if (result.success) {
      setBase64Output(result.result)
      setBase64Error(null)
      showToast('success', 'Base64 解码完成')
    } else {
      setBase64Error(result.error)
      setBase64Output('')
      showToast('error', result.error)
    }
  }, [base64Input, showToast])

  const handleCopyBase64Output = useCallback(async () => {
    if (!base64Output) return
    const success = await copyToClipboard(base64Output)
    if (success) {
      showToast('success', '已复制')
    } else {
      showToast('error', '复制失败')
    }
  }, [base64Output, showToast])

  const handleParamsToJson = useCallback(() => {
    const result = queryParamsToJson(params)
    if (result.success) {
      setJsonOutput(result.result)
      setJsonError(null)
      showToast('success', '转换完成')
    } else {
      setJsonError(result.error)
      setJsonOutput('')
      showToast('error', result.error)
    }
  }, [params, showToast])

  const handleJsonToParams = useCallback(() => {
    const result = jsonToQueryParams(jsonInput)
    if (result.success) {
      rebuildUrlFromParams(result.params, url)
      setJsonError(null)
      showToast('success', '转换完成')
    } else {
      setJsonError(result)
      setJsonOutput('')
      const lineInfo = result.line ? `第 ${result.line} 行` : ''
      const colInfo = result.column ? `，第 ${result.column} 列` : ''
      showToast('error', `${lineInfo}${colInfo}${lineInfo || colInfo ? '：' : ''}${result.error}`)
    }
  }, [jsonInput, url, showToast, rebuildUrlFromParams])

  const handleCopyJsonOutput = useCallback(async () => {
    if (!jsonOutput) return
    const success = await copyToClipboard(jsonOutput)
    if (success) {
      showToast('success', '已复制')
    } else {
      showToast('error', '复制失败')
    }
  }, [jsonOutput, showToast])

  const handleBatchParse = useCallback(() => {
    const result = parseBatchUrls(batchInput)
    if (result.success) {
      setBatchResults(result.results)
      showToast('success', `解析完成，共 ${result.results.length} 条`)
    } else {
      showToast('error', result.error)
    }
  }, [batchInput, showToast])

  const handleExportCsv = useCallback(() => {
    const result = exportToCsv(batchResults)
    if (result.success) {
      const success = downloadCsvFile(result.content)
      if (success) {
        showToast('success', '导出成功')
      } else {
        showToast('error', '导出失败')
      }
    } else {
      showToast('error', result.error)
    }
  }, [batchResults, showToast])

  const handleClearAll = useCallback(() => {
    setUrl('')
    setParams([])
    setBase64Input('')
    setBase64Output('')
    setBase64Error(null)
    setJsonInput('')
    setJsonOutput('')
    setJsonError(null)
    setBatchInput('')
    setBatchResults([])
  }, [])

  const handleLoadSample = useCallback(() => {
    const parsed = parseUrl(DEFAULT_URL)
    const newParams = parsed.success ? parseQueryParams(parsed.search) : []
    syncUrlAndParams(DEFAULT_URL, newParams)
  }, [syncUrlAndParams])

  const displayPort = parsedUrl.port || '默认'

  return (
    <div className="ut-page">
      <div className="ut-container">
        <header className="ut-header">
          <Link to="/" className="ut-back-link">
            ← 返回首页
          </Link>
          <h1 className="ut-title">URL 解析编解码工具箱</h1>
          <div className="ut-header-spacer" />
        </header>

        <div className="ut-main-layout">
          <div className="ut-toolbar-row">
            <button className="ut-btn" onClick={handleLoadSample}>
              加载示例
            </button>
            <button className="ut-btn" onClick={handleClearAll}>
              清空全部
            </button>
          </div>

          <div className="ut-panel">
            <div className="ut-panel-header">
              <h3 className="ut-panel-title">URL 输入</h3>
              <div className="ut-panel-actions">
                <button className="ut-btn ut-btn-sm" onClick={handleUrlEncode}>
                  URL 编码
                </button>
                <button className="ut-btn ut-btn-sm" onClick={handleUrlDecode}>
                  URL 解码
                </button>
                <button className="ut-btn ut-btn-sm" onClick={handleEncodeParamsOnly}>
                  仅编码参数
                </button>
              </div>
            </div>
            <div className="ut-panel-body">
              <input
                type="text"
                className="ut-input ut-url-input"
                value={url}
                onChange={handleUrlChange}
                placeholder="在此粘贴或输入 URL..."
                spellCheck={false}
              />
              {!parsedUrl.success && url && (
                <div className="ut-error-box">{parsedUrl.error}</div>
              )}
            </div>
          </div>

          <div className="ut-panel">
            <div className="ut-panel-header">
              <h3 className="ut-panel-title">URL 拆解</h3>
            </div>
            <div className="ut-panel-body">
              <div className="ut-url-parts">
                <div className="ut-url-part">
                  <span className="ut-part-label">协议</span>
                  <span className="ut-part-value">{parsedUrl.protocol || '-'}</span>
                </div>
                <div className="ut-url-part">
                  <span className="ut-part-label">主机名</span>
                  <span className="ut-part-value">{parsedUrl.hostname || '-'}</span>
                </div>
                <div className="ut-url-part">
                  <span className="ut-part-label">端口号</span>
                  <span className="ut-part-value">{displayPort}</span>
                </div>
                <div className="ut-url-part">
                  <span className="ut-part-label">路径</span>
                  <span className="ut-part-value">{parsedUrl.pathname || '-'}</span>
                </div>
                <div className="ut-url-part">
                  <span className="ut-part-label">查询字符串</span>
                  <span className="ut-part-value">{parsedUrl.search || '-'}</span>
                </div>
                <div className="ut-url-part">
                  <span className="ut-part-label">哈希</span>
                  <span className="ut-part-value">{parsedUrl.hash || '-'}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="ut-panel">
            <div className="ut-panel-header">
              <h3 className="ut-panel-title">查询参数编辑</h3>
              <div className="ut-panel-actions">
                <button className="ut-btn ut-btn-sm" onClick={handleParamsToJson}>
                  参数 → JSON
                </button>
                <button className="ut-btn ut-btn-sm" onClick={handleJsonToParams}>
                  JSON → 参数
                </button>
                <button className="ut-btn ut-btn-sm" onClick={handleAddParam}>
                  + 添加参数
                </button>
                <button className="ut-btn ut-btn-sm ut-btn-danger" onClick={handleClearParams}>
                  清空参数
                </button>
              </div>
            </div>
            <div className="ut-panel-body">
              <div className="ut-params-table">
                <div className="ut-params-header">
                  <div className="ut-params-cell ut-params-key-header">键 (Key)</div>
                  <div className="ut-params-cell ut-params-value-header">值 (Value)</div>
                  <div className="ut-params-cell ut-params-actions-header">操作</div>
                </div>
                {params.length === 0 ? (
                  <div className="ut-params-empty">暂无参数，点击"添加参数"按钮新增</div>
                ) : (
                  params.map((param, index) => (
                    <div key={index} className="ut-params-row">
                      <div className="ut-params-cell">
                        <input
                          type="text"
                          className="ut-input ut-param-input"
                          value={param.key}
                          onChange={(e) => handleParamKeyChange(index, e.target.value)}
                          placeholder="键名"
                          spellCheck={false}
                        />
                      </div>
                      <div className="ut-params-cell">
                        <input
                          type="text"
                          className="ut-input ut-param-input"
                          value={param.value}
                          onChange={(e) => handleParamValueChange(index, e.target.value)}
                          placeholder="值"
                          spellCheck={false}
                        />
                      </div>
                      <div className="ut-params-cell">
                        <button
                          className="ut-icon-btn danger"
                          onClick={() => handleDeleteParam(index)}
                          title="删除"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="ut-json-converter">
                <div className="ut-json-input-section">
                  <div className="ut-section-label">JSON 输入</div>
                  <textarea
                    className="ut-textarea"
                    value={jsonInput}
                    onChange={(e) => setJsonInput(e.target.value)}
                    placeholder='在此粘贴 JSON 对象，如 {"name":"value"}'
                    spellCheck={false}
                    rows={4}
                  />
                  {jsonError && (
                    <div className="ut-error-box">
                      {jsonError.line ? `第 ${jsonError.line} 行` : ''}
                      {jsonError.column ? `，第 ${jsonError.column} 列` : ''}
                      {jsonError.line || jsonError.column ? '：' : ''}
                      {jsonError.error}
                    </div>
                  )}
                </div>
                <div className="ut-json-output-section">
                  <div className="ut-section-label">
                    JSON 输出
                    {jsonOutput && (
                      <button className="ut-btn ut-btn-sm ut-btn-inline" onClick={handleCopyJsonOutput}>
                        复制
                      </button>
                    )}
                  </div>
                  <pre className="ut-json-output">{jsonOutput || '转换结果将显示在这里'}</pre>
                </div>
              </div>
            </div>
          </div>

          <div className="ut-panel">
            <div className="ut-panel-header">
              <h3 className="ut-panel-title">Base64 编解码</h3>
              <div className="ut-panel-actions">
                <button className="ut-btn ut-btn-sm" onClick={handleBase64Encode}>
                  Base64 编码
                </button>
                <button className="ut-btn ut-btn-sm" onClick={handleBase64Decode}>
                  Base64 解码
                </button>
                {base64Output && (
                  <button className="ut-btn ut-btn-sm ut-btn-primary" onClick={handleCopyBase64Output}>
                    复制结果
                  </button>
                )}
              </div>
            </div>
            <div className="ut-panel-body">
              <div className="ut-base64-section">
                <div className="ut-base64-input">
                  <div className="ut-section-label">输入文本</div>
                  <textarea
                    className="ut-textarea"
                    value={base64Input}
                    onChange={(e) => setBase64Input(e.target.value)}
                    placeholder="输入待编码或解码的文本..."
                    spellCheck={false}
                    rows={4}
                  />
                </div>
                <div className="ut-base64-output">
                  <div className="ut-section-label">输出结果</div>
                  {base64Error ? (
                    <div className="ut-error-box">{base64Error}</div>
                  ) : (
                    <pre className="ut-base64-result">{base64Output || '结果将显示在这里'}</pre>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="ut-panel">
            <div className="ut-panel-header">
              <h3 className="ut-panel-title">批量解析</h3>
              <div className="ut-panel-actions">
                <button className="ut-btn ut-btn-sm" onClick={handleBatchParse}>
                  批量解析
                </button>
                {batchResults.length > 0 && (
                  <button className="ut-btn ut-btn-sm ut-btn-primary" onClick={handleExportCsv}>
                    导出 CSV
                  </button>
                )}
              </div>
            </div>
            <div className="ut-panel-body">
              <textarea
                className="ut-textarea ut-batch-input"
                value={batchInput}
                onChange={(e) => setBatchInput(e.target.value)}
                placeholder="每行一个 URL，例如：&#10;https://www.example.com/path?a=1&#10;https://test.org/page?id=2"
                spellCheck={false}
                rows={6}
              />

              {batchResults.length > 0 && (
                <div className="ut-batch-results">
                  <div className="ut-batch-table">
                    <div className="ut-batch-header">
                      <div className="ut-batch-cell ut-batch-index">序号</div>
                      <div className="ut-batch-cell ut-batch-url">完整 URL</div>
                      <div className="ut-batch-cell ut-batch-protocol">协议</div>
                      <div className="ut-batch-cell ut-batch-host">主机名</div>
                      <div className="ut-batch-cell ut-batch-path">路径</div>
                      <div className="ut-batch-cell ut-batch-count">参数个数</div>
                      <div className="ut-batch-cell ut-batch-status">状态</div>
                    </div>
                    {batchResults.map((result) => (
                      <div key={result.index} className="ut-batch-row">
                        <div className="ut-batch-cell ut-batch-index">{result.index}</div>
                        <div className="ut-batch-cell ut-batch-url" title={result.url}>
                          {result.url}
                        </div>
                        <div className="ut-batch-cell ut-batch-protocol">{result.protocol}</div>
                        <div className="ut-batch-cell ut-batch-host">{result.hostname}</div>
                        <div className="ut-batch-cell ut-batch-path">{result.pathname}</div>
                        <div className="ut-batch-cell ut-batch-count">{result.paramCount}</div>
                        <div className={`ut-batch-cell ut-batch-status ${result.success ? 'ut-status-success' : 'ut-status-error'}`}>
                          {result.success ? '成功' : `失败: ${result.error}`}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {toast && (
        <div
          className="ut-toast"
          style={{
            background:
              toast.type === 'error'
                ? 'var(--ut-error-bg)'
                : 'var(--ut-success-bg)',
            color:
              toast.type === 'error'
                ? 'var(--ut-error-text)'
                : 'var(--ut-success-text)',
          }}
        >
          {toast.message}
        </div>
      )}
    </div>
  )
}

export default UrlToolPage
