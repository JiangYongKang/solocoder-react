import { calculateSettlements } from './utils'

export default function SettlementPanel({ participants, expenses }) {
  const { balances, settlements } = calculateSettlements(participants, expenses)
  const participantMap = new Map(participants.map((p) => [p.id, p]))

  const getBalanceClass = (v) => {
    if (v > 0.005) return 'positive'
    if (v < -0.005) return 'negative'
    return 'zero'
  }

  const formatBalance = (v) => {
    if (v > 0.005) return `+¥${v.toFixed(2)}`
    if (v < -0.005) return `-¥${Math.abs(v).toFixed(2)}`
    return '¥0.00'
  }

  return (
    <section className="bill-splitter-section">
      <h2 className="section-title">结算结果</h2>

      {participants.length === 0 && (
        <div className="empty-hint">先添加参与者查看余额</div>
      )}

      {participants.length > 0 && (
        <>
          <div style={{ marginBottom: 8, fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>
            每人余额
          </div>
          {participants.map((p) => {
            const bal = balances[p.id] || 0
            return (
              <div key={p.id} className="balance-item">
                <div
                  className="participant-avatar"
                  style={{ width: 28, height: 28, fontSize: 12, background: p.color }}
                >
                  {p.name.charAt(0)}
                </div>
                <span className="balance-name">{p.name}</span>
                <span className={`balance-value ${getBalanceClass(bal)}`}>
                  {formatBalance(bal)}
                </span>
              </div>
            )
          })}

          <div className="settlements-title">转账结算</div>

          {settlements.length === 0 ? (
            <div className="settlements-empty">
              大家平账了，无需结算 🎉
            </div>
          ) : (
            settlements.map((s, idx) => {
              const fromP = participantMap.get(s.from)
              const toP = participantMap.get(s.to)
              return (
                <div key={idx} className="settlement-item">
                  {fromP ? (
                    <div
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: '50%',
                        background: fromP.color,
                        color: '#fff',
                        fontSize: 10,
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      {fromP.name.charAt(0)}
                    </div>
                  ) : null}
                  <span className="settlement-from">{fromP?.name || s.from}</span>
                  <span className="settlement-action">需支付</span>
                  {toP ? (
                    <div
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: '50%',
                        background: toP.color,
                        color: '#fff',
                        fontSize: 10,
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      {toP.name.charAt(0)}
                    </div>
                  ) : null}
                  <span className="settlement-to">{toP?.name || s.to}</span>
                  <span className="settlement-amount">¥{s.amount.toFixed(2)}</span>
                </div>
              )
            })
          )}
        </>
      )}
    </section>
  )
}
