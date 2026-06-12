import {
    APPROVAL_ACTION,
    APPROVAL_ACTION_LABEL,
    RELEASE_STATUS_COLOR,
    RELEASE_STATUS_LABEL,
} from '../constants.js'
import { formatDateOnly, getStatusActions, isReleaseEditable } from '../utils.js'

export default function ReleaseList({
  items,
  onEdit,
  onDetail,
  onDiff,
  onApprovalAction,
  diffBaseId,
  diffCompareId,
  onSelectForDiff,
  isDiffSelectMode,
  isProcessing = () => false,
}) {
  return (
    <div className="rm-table-wrap">
      <table className="rm-table">
        <thead>
          <tr>
            {isDiffSelectMode && <th style={{ width: 40 }}></th>}
            <th style={{ width: 120 }}>版本号</th>
            <th>发布标题</th>
            <th style={{ width: 110 }}>发布日期</th>
            <th style={{ width: 100 }}>发布人</th>
            <th style={{ width: 100 }}>状态</th>
            <th style={{ width: 320 }}>操作</th>
          </tr>
        </thead>
        <tbody>
          {items.length === 0 && (
            <tr>
              <td colSpan={isDiffSelectMode ? 7 : 6} className="rm-empty">
                暂无数据
              </td>
            </tr>
          )}
          {items.map((release) => {
            const editable = isReleaseEditable(release)
            const actions = getStatusActions(release)
            const checkedForDiff = diffBaseId === release.id || diffCompareId === release.id
            const disabled = isProcessing(release.id)

            return (
              <tr key={release.id} className="rm-table-row">
                {isDiffSelectMode && (
                  <td>
                    <input
                      type="checkbox"
                      checked={checkedForDiff}
                      disabled={diffBaseId === release.id}
                      onChange={(e) => {
                        if (e.target.checked) {
                          onSelectForDiff(release.id)
                        } else if (diffCompareId === release.id) {
                          onSelectForDiff(null)
                        }
                      }}
                    />
                  </td>
                )}
                <td>
                  <span className="rm-version">{release.version}</span>
                </td>
                <td>
                  <a className="rm-title-link" onClick={() => onDetail(release)}>
                    {release.title}
                  </a>
                </td>
                <td>{release.releaseDate || formatDateOnly(release.createdAt)}</td>
                <td>{release.publisher}</td>
                <td>
                  <span
                    className="rm-status-tag"
                    style={{
                      background: RELEASE_STATUS_COLOR[release.status] + '22',
                      color: RELEASE_STATUS_COLOR[release.status],
                      borderColor: RELEASE_STATUS_COLOR[release.status],
                    }}
                  >
                    {RELEASE_STATUS_LABEL[release.status]}
                  </span>
                </td>
                <td>
                  <div className="rm-actions">
                    {editable && (
                      <button className="rm-action-btn" onClick={() => onEdit(release)} disabled={disabled}>
                        编辑
                      </button>
                    )}
                    <button className="rm-action-btn" onClick={() => onDetail(release)} disabled={disabled}>
                      详情
                    </button>
                    <button className="rm-action-btn" onClick={() => onDiff(release)} disabled={disabled}>
                      对比
                    </button>
                    {actions.includes(APPROVAL_ACTION.SUBMIT) && (
                      <button
                        className="rm-action-btn rm-action-warn"
                        onClick={() => onApprovalAction(release.id, APPROVAL_ACTION.SUBMIT)}
                        disabled={disabled}
                      >
                        {disabled ? '处理中...' : APPROVAL_ACTION_LABEL[APPROVAL_ACTION.SUBMIT]}
                      </button>
                    )}
                    {actions.includes(APPROVAL_ACTION.APPROVE) && (
                      <button
                        className="rm-action-btn rm-action-success"
                        onClick={() => onApprovalAction(release.id, APPROVAL_ACTION.APPROVE)}
                        disabled={disabled}
                      >
                        {disabled ? '处理中...' : APPROVAL_ACTION_LABEL[APPROVAL_ACTION.APPROVE]}
                      </button>
                    )}
                    {actions.includes(APPROVAL_ACTION.REJECT) && (
                      <button
                        className="rm-action-btn rm-action-danger"
                        onClick={() => onApprovalAction(release.id, APPROVAL_ACTION.REJECT)}
                        disabled={disabled}
                      >
                        {disabled ? '处理中...' : APPROVAL_ACTION_LABEL[APPROVAL_ACTION.REJECT]}
                      </button>
                    )}
                    {actions.includes(APPROVAL_ACTION.ROLLBACK) && (
                      <button
                        className="rm-action-btn rm-action-danger"
                        onClick={() => onApprovalAction(release.id, APPROVAL_ACTION.ROLLBACK)}
                        disabled={disabled}
                      >
                        {disabled ? '处理中...' : APPROVAL_ACTION_LABEL[APPROVAL_ACTION.ROLLBACK]}
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
