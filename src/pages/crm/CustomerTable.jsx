import {
  CUSTOMER_STATUS_LABEL,
  CUSTOMER_STATUS_COLOR,
  SORT_ORDERS,
  USERS,
} from './constants.js'
import { formatDate } from './utils.js'

function getOwnerInfo(ownerId) {
  if (!ownerId) {
    return { name: '公海', avatar: '海', isPool: true }
  }
  const user = USERS.find((u) => u.id === ownerId)
  if (user) {
    return { name: user.name, avatar: user.avatar, isPool: false }
  }
  return { name: '未知', avatar: '?', isPool: false }
}

export default function CustomerTable({
  items,
  sortField,
  sortOrder,
  onSort,
  onEdit,
  onDelete,
  onClaim,
  onRelease,
  onTransfer,
  onRowClick,
  viewMode,
}) {
  const handleSort = (field) => {
    if (onSort) onSort(field)
  }

  const renderSortIcon = (field) => {
    if (sortField !== field) {
      return <span className="sort-icon">⇅</span>
    }
    return (
      <span className="sort-icon active">
        {sortOrder === SORT_ORDERS.ASC ? '↑' : '↓'}
      </span>
    )
  }

  const renderTableHead = () => (
    <thead>
      <tr>
        <th className="sortable" onClick={() => handleSort('name')}>
          客户名称 {renderSortIcon('name')}
        </th>
        <th className="sortable" onClick={() => handleSort('company')}>
          公司 {renderSortIcon('company')}
        </th>
        <th>联系电话</th>
        <th>邮箱</th>
        <th className="col-source sortable" onClick={() => handleSort('source')}>
          来源 {renderSortIcon('source')}
        </th>
        <th className="col-status sortable" onClick={() => handleSort('status')}>
          状态 {renderSortIcon('status')}
        </th>
        <th className="col-owner sortable" onClick={() => handleSort('ownerId')}>
          归属人 {renderSortIcon('ownerId')}
        </th>
        <th className="col-date sortable" onClick={() => handleSort('createdAt')}>
          创建时间 {renderSortIcon('createdAt')}
        </th>
        <th className="col-actions">操作</th>
      </tr>
    </thead>
  )

  const renderTableBody = () => (
    <tbody>
      {items.map((customer) => {
        const owner = getOwnerInfo(customer.ownerId)
        return (
          <tr key={customer.id} onClick={() => onRowClick && onRowClick(customer)}>
            <td>
              <div className="customer-name">{customer.name}</div>
            </td>
            <td>
              <div className="customer-company">{customer.company || '-'}</div>
            </td>
            <td>{customer.phone}</td>
            <td>{customer.email || '-'}</td>
            <td>
              <span className="source-tag">{customer.source}</span>
            </td>
            <td>
              <span
                className="status-tag"
                style={{
                  background: `${CUSTOMER_STATUS_COLOR[customer.status]}20`,
                  color: CUSTOMER_STATUS_COLOR[customer.status],
                }}
              >
                {CUSTOMER_STATUS_LABEL[customer.status]}
              </span>
            </td>
            <td>
              <span className="owner-badge">
                <span className={`owner-avatar ${owner.isPool ? 'pool' : ''}`}>
                  {owner.avatar}
                </span>
                {owner.name}
              </span>
            </td>
            <td>{formatDate(customer.createdAt)}</td>
            <td onClick={(e) => e.stopPropagation()}>
              <div className="row-actions">
                <button
                  className="btn-link btn-link-primary"
                  onClick={() => onEdit && onEdit(customer)}
                >
                  编辑
                </button>
                {viewMode === 'pool' ? (
                  <button
                    className="btn-link btn-link-primary"
                    onClick={() => onClaim && onClaim(customer)}
                  >
                    领取
                  </button>
                ) : (
                  <>
                    <button
                      className="btn-link btn-link-primary"
                      onClick={() => onTransfer && onTransfer(customer)}
                    >
                      转移
                    </button>
                    <button
                      className="btn-link"
                      onClick={() => onRelease && onRelease(customer)}
                    >
                      释放
                    </button>
                  </>
                )}
                <button
                  className="btn-link btn-link-danger"
                  onClick={() => onDelete && onDelete(customer)}
                >
                  删除
                </button>
              </div>
            </td>
          </tr>
        )
      })}
    </tbody>
  )

  const isEmpty = !items || items.length === 0

  return (
    <div className="table-wrap">
      <table className="crm-table">
        {renderTableHead()}
        {!isEmpty && renderTableBody()}
      </table>
      {isEmpty && <div className="empty-state">暂无数据</div>}
    </div>
  )
}
