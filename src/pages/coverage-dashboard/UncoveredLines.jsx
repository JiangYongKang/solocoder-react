import { getUncoveredLines, formatPercentage } from './utils'

const UncoveredLines = ({ file }) => {
  if (!file) {
    return (
      <div className="cv-uncovered-panel">
        <div className="cv-uncovered-header">
          <h3 className="cv-uncovered-title">未覆盖代码行</h3>
        </div>
        <div className="cv-uncovered-empty">
          请选择左侧文件查看未覆盖的代码行
        </div>
      </div>
    )
  }

  const uncoveredLines = getUncoveredLines(file)
  const totalLines = file.lines?.length || 0
  const uncoveredCount = file.uncoveredLines?.length || 0
  const coveredCount = totalLines - uncoveredCount
  const coveragePercent = totalLines > 0 ? (coveredCount / totalLines) * 100 : 0

  return (
    <div className="cv-uncovered-panel">
      <div className="cv-uncovered-header">
        <h3 className="cv-uncovered-title">未覆盖代码行</h3>
        <div className="cv-uncovered-file-info">
          <span className="cv-file-path">{file.path}</span>
          <span className="cv-file-stats">
            共 {totalLines} 行，未覆盖 {uncoveredCount} 行，
            覆盖率 {formatPercentage(coveragePercent, 1)}
          </span>
        </div>
      </div>

      {uncoveredLines.length === 0 ? (
        <div className="cv-uncovered-success">
          🎉 该文件所有代码行都已被测试覆盖！
        </div>
      ) : (
        <div className="cv-uncovered-code">
          <div className="cv-code-container">
            {file.lines?.map((line) => {
              const isUncovered = file.uncoveredLines?.includes(line.line)
              return (
                <div
                  key={line.line}
                  className={`cv-code-line ${isUncovered ? 'uncovered' : 'covered'}`}
                >
                  <span className="cv-line-number">{line.line}</span>
                  <span className="cv-line-code">
                    {line.code || '\u00A0'}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

export default UncoveredLines
