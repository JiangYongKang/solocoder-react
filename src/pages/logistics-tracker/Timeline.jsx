import { STATUS_META, STATUS_TYPES } from './constants.js'

function Timeline({ nodes, isSigned, signer, signTime }) {
  if (!nodes || nodes.length === 0) {
    return (
      <div className="logistics-timeline-empty">
        暂无物流节点信息
      </div>
    )
  }

  return (
    <div className="logistics-timeline">
      {isSigned && signTime && (
        <div className="logistics-signed-badge">
          <span className="logistics-signed-icon">✅</span>
          <span className="logistics-signed-text">
            已签收 · {signer ? `签收人: ${signer}` : ''} · {signTime}
          </span>
        </div>
      )}

      <div className="logistics-timeline-list">
        {nodes.map((node, index) => {
          const meta = STATUS_META[node.status] || STATUS_META[STATUS_TYPES.IN_TRANSIT]
          const isLatest = index === 0
          const isLast = index === nodes.length - 1

          return (
            <div
              key={index}
              className={`logistics-timeline-item ${isLatest ? 'is-latest' : ''} ${node.isException ? 'is-exception' : ''}`}
            >
              <div className="logistics-timeline-line-col">
                <div
                  className={`logistics-timeline-dot ${isLatest ? 'is-latest' : ''} ${node.isException ? 'is-exception' : ''}`}
                  style={{ backgroundColor: node.isException ? '#f5222d' : (isLatest ? meta.color : '#d9d9d9') }}
                >
                  <span className="logistics-timeline-icon">{meta.icon}</span>
                </div>
                {!isLast && (
                  <div
                    className={`logistics-timeline-line ${isLatest ? 'is-latest' : ''}`}
                    style={{ backgroundColor: node.isException ? '#f5222d' : '#e8e8e8' }}
                  />
                )}
              </div>

              <div className="logistics-timeline-content">
                <div className="logistics-timeline-header">
                  <span
                    className={`logistics-timeline-status ${isLatest ? 'is-latest' : ''} ${node.isException ? 'is-exception' : ''}`}
                    style={{ color: node.isException ? '#f5222d' : (isLatest ? meta.color : '#666') }}
                  >
                    {meta.label}
                  </span>
                  <span className="logistics-timeline-time">{node.time}</span>
                </div>

                <div className="logistics-timeline-location">{node.location}</div>
                <div className="logistics-timeline-desc">{node.description}</div>

                {node.isException && node.exceptionReason && (
                  <div className="logistics-timeline-exception-tip">
                    ⚠️ {node.exceptionReason}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default Timeline
