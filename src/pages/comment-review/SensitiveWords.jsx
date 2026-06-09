import { useState } from 'react'
import {
  addSensitiveWord,
  deleteSensitiveWord,
  getSensitiveWordList,
  formatDate,
} from './utils'
import { SENSITIVE_LEVEL, SENSITIVE_LEVEL_LABEL, SENSITIVE_LEVEL_COLOR } from './constants'

export default function SensitiveWords({
  words,
  onWordsChange,
  keyword,
  onKeywordChange,
}) {
  const [newWord, setNewWord] = useState('')
  const [newLevel, setNewLevel] = useState(SENSITIVE_LEVEL.LOW)
  const [addError, setAddError] = useState('')

  const filteredWords = getSensitiveWordList(words, keyword)

  const handleAdd = () => {
    setAddError('')
    const result = addSensitiveWord(words, newWord, newLevel)
    if (!result.success) {
      setAddError(result.error)
      return
    }
    onWordsChange(result.words)
    setNewWord('')
    setNewLevel(SENSITIVE_LEVEL.LOW)
  }

  const handleDelete = (wordId) => {
    const result = deleteSensitiveWord(words, wordId)
    if (result.success) {
      onWordsChange(result.words)
    }
  }

  return (
    <div>
      <div className="toolbar">
        <div className="toolbar-left">
          <input
            className="form-input search-input"
            type="text"
            placeholder="搜索敏感词..."
            value={keyword}
            onChange={(e) => onKeywordChange(e.target.value)}
          />
        </div>
      </div>

      <div className="toolbar" style={{ marginBottom: 16 }}>
        <div className="word-form-row" style={{ width: '100%' }}>
          <div className="form-row word-input">
            <label className="form-label">
              敏感词 <span className="required">*</span>
            </label>
            <input
              className={`form-input ${addError ? 'has-error' : ''}`}
              type="text"
              placeholder="请输入敏感词"
              value={newWord}
              onChange={(e) => {
                setNewWord(e.target.value)
                if (addError) setAddError('')
              }}
            />
            {addError && <div className="form-error">{addError}</div>}
          </div>
          <div className="form-row">
            <label className="form-label">
              敏感等级 <span className="required">*</span>
            </label>
            <select
              className="form-select"
              value={newLevel}
              onChange={(e) => setNewLevel(e.target.value)}
            >
              {Object.entries(SENSITIVE_LEVEL_LABEL).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div className="word-add-btn">
            <button className="btn btn-primary" onClick={handleAdd}>
              + 添加敏感词
            </button>
          </div>
        </div>
      </div>

      <div className="table-wrap">
        <table className="cr-table">
          <thead>
            <tr>
              <th className="col-word">敏感词</th>
              <th className="col-level">等级</th>
              <th className="col-add-time">添加时间</th>
              <th className="col-actions">操作</th>
            </tr>
          </thead>
          <tbody>
            {filteredWords.length === 0 ? (
              <tr>
                <td colSpan={4}>
                  <div className="empty-state">暂无敏感词</div>
                </td>
              </tr>
            ) : (
              filteredWords.map((word) => (
                <tr key={word.id}>
                  <td className="col-word">
                    <span className="sensitive-word-text">{word.word}</span>
                  </td>
                  <td className="col-level">
                    <span
                      className={`level-tag ${word.level}`}
                    >
                      {SENSITIVE_LEVEL_LABEL[word.level]}
                    </span>
                  </td>
                  <td className="col-add-time">
                    <span className="comment-time">{formatDate(word.createdAt)}</span>
                  </td>
                  <td className="col-actions">
                    <div className="row-actions">
                      <button
                        className="btn btn-sm btn-danger"
                        onClick={() => handleDelete(word.id)}
                      >
                        删除
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
