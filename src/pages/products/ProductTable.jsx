import {
  CATEGORIES,
  SORT_FIELDS,
  SORT_ORDERS,
  PRODUCT_STATUS_LABEL,
} from './constants'
import { formatPrice, formatDate } from './utils'

const COLUMN_COUNT = 9

export default function ProductTable({
  items,
  selectedIds,
  sortField,
  sortOrder,
  category,
  onSelectAll,
  onSelectOne,
  onSort,
  onEdit,
  onDelete,
  onCategoryChange,
  allSelected,
  someSelected,
}) {
  function renderSortIcon(field) {
    if (sortField !== field) return <span className="sort-icon">↕</span>
    return (
      <span className="sort-icon active">
        {sortOrder === SORT_ORDERS.ASC ? '↑' : '↓'}
      </span>
    )
  }

  return (
    <div className="table-wrap">
      <table className="product-table">
      <thead>
        <tr>
          <th className="col-check">
            <input
              type="checkbox"
              checked={allSelected}
              ref={(el) => {
                if (el) el.indeterminate = someSelected && !allSelected
              }}
              onChange={(e) => onSelectAll(e.target.checked)}
            />
          </th>
          <th className="col-image">图片</th>
          <th>商品名称</th>
          <th
            className="sortable"
            onClick={() => onSort(SORT_FIELDS.PRICE)}
          >
            价格 {renderSortIcon(SORT_FIELDS.PRICE)}
          </th>
          <th className="col-category">
            <div className="category-filter">
              <span>分类</span>
              <select
                className="inline-select"
                value={category}
                onChange={(e) => onCategoryChange(e.target.value)}
              >
                <option value="all">全部</option>
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </th>
          <th
            className="sortable col-stock"
            onClick={() => onSort(SORT_FIELDS.STOCK)}
          >
            库存 {renderSortIcon(SORT_FIELDS.STOCK)}
          </th>
          <th>状态</th>
          <th
            className="sortable col-date"
            onClick={() => onSort(SORT_FIELDS.CREATED_AT)}
          >
            创建时间 {renderSortIcon(SORT_FIELDS.CREATED_AT)}
          </th>
          <th className="col-actions">操作</th>
        </tr>
      </thead>
      <tbody>
        {items.length === 0 ? (
          <tr>
            <td colSpan={COLUMN_COUNT} className="empty-row">
            <div className="empty-state">暂无商品数据</div>
            </td>
          </tr>
        ) : (
          items.map((product) => (
            <tr key={product.id} className="product-row">
              <td className="col-check">
                <input
                  type="checkbox"
                  checked={selectedIds.includes(product.id)}
                  onChange={(e) => onSelectOne(product.id, e.target.checked)}
                />
              </td>
              <td className="col-image">
                {product.image ? (
                  <img
                    className="product-thumb"
                    src={product.image}
                    alt={product.name}
                  />
                ) : (
                  <div className="product-thumb placeholder">
                  无图
                </div>
                )}
              </td>
              <td className="product-name">{product.name}</td>
              <td>{formatPrice(product.price)}</td>
              <td>{product.category}</td>
              <td>{product.stock}</td>
              <td>
                <span
                  className={`status-tag ${
                    product.status === 'on_shelf'
                      ? 'status-on'
                      : 'status-off'
                  }`}
                >
                  {PRODUCT_STATUS_LABEL[product.status]}
                </span>
              </td>
              <td>{formatDate(product.createdAt)}</td>
              <td className="col-actions">
                <button
                  className="btn-link btn-link-primary"
                  onClick={() => onEdit(product)}
                >
                  编辑
                </button>
                <button
                  className="btn-link btn-link-danger"
                  onClick={() => onDelete(product)}
                >
                  删除
                </button>
              </td>
            </tr>
          ))
        )}
      </tbody>
      </table>
    </div>
  )
}
