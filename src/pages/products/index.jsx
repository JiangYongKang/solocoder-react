import { useState, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import './index.css'
import ProductTable from './ProductTable'
import ProductForm from './ProductForm'
import ProductModal from './ProductModal'
import ConfirmDialog from './ConfirmDialog'
import {
  PRODUCT_STATUS,
  SORT_ORDERS,
  SORT_FIELDS,
  PAGE_SIZE,
} from './constants'
import {
  loadProducts,
  saveProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  batchDeleteProducts,
  batchUpdateStatus,
  getProductList,
} from './utils'

export default function ProductsPage() {
  const navigate = useNavigate()
  const [products, setProducts] = useState(() => loadProducts())
  const [keyword, setKeyword] = useState('')
  const [category, setCategory] = useState('all')
  const [sortField, setSortField] = useState(SORT_FIELDS.CREATED_AT)
  const [sortOrder, setSortOrder] = useState(SORT_ORDERS.DESC)
  const [page, setPage] = useState(1)
  const [selectedIds, setSelectedIds] = useState([])
  const prevKeywordRef = useRef('')
  const prevCategoryRef = useRef('all')

  const [formModalOpen, setFormModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const formKeyRef = useRef(0)

  const [deleteConfirm, setDeleteConfirm] = useState({
    open: false,
    product: null,
    isBatch: false,
  })

  const handleProductsUpdate = (next) => {
    setProducts(next)
    queueMicrotask(() => saveProducts(next))
  }

  const handleKeywordChange = (value) => {
    setKeyword(value)
    if (value !== prevKeywordRef.current) {
      prevKeywordRef.current = value
      setPage(1)
    }
  }

  const handleCategoryChange = (value) => {
    setCategory(value)
    if (value !== prevCategoryRef.current) {
      prevCategoryRef.current = value
      setPage(1)
    }
  }

  const pagination = useMemo(
    () =>
      getProductList(products, {
        keyword,
        category,
        sortField,
        sortOrder,
        page,
        pageSize: PAGE_SIZE,
      }),
    [products, keyword, category, sortField, sortOrder, page]
  )

  const visibleIds = useMemo(() => pagination.items.map((p) => p.id), [pagination])
  const allSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedIds.includes(id))
  const someSelected = visibleIds.some((id) => selectedIds.includes(id))

  function handleSort(field) {
    if (sortField === field) {
      setSortOrder(sortOrder === SORT_ORDERS.ASC ? SORT_ORDERS.DESC : SORT_ORDERS.ASC)
    } else {
      setSortField(field)
      setSortOrder(SORT_ORDERS.ASC)
    }
  }

  function handleSelectAll(checked) {
    if (checked) {
      setSelectedIds(Array.from(new Set([...selectedIds, ...visibleIds])))
    } else {
      setSelectedIds(selectedIds.filter((id) => !visibleIds.includes(id)))
    }
  }

  function handleSelectOne(id, checked) {
    if (checked) {
      setSelectedIds([...selectedIds, id])
    } else {
      setSelectedIds(selectedIds.filter((x) => x !== id))
    }
  }

  function handleOpenCreate() {
    setEditingProduct(null)
    formKeyRef.current += 1
    setFormModalOpen(true)
  }

  function handleOpenEdit(product) {
    setEditingProduct(product)
    formKeyRef.current += 1
    setFormModalOpen(true)
  }

  function handleFormSubmit(data) {
    let result
    if (editingProduct) {
      result = updateProduct(products, editingProduct.id, data)
      if (result.success) {
        handleProductsUpdate(result.products)
        setFormModalOpen(false)
        setEditingProduct(null)
      }
    } else {
      result = createProduct(products, data)
      if (result.success) {
        handleProductsUpdate(result.products)
        setFormModalOpen(false)
      }
    }
    return result
  }

  function handleAskDelete(product) {
    setDeleteConfirm({ open: true, product, isBatch: false })
  }

  function handleConfirmDelete() {
    if (deleteConfirm.isBatch) {
      const { products: updated } = batchDeleteProducts(products, selectedIds)
      handleProductsUpdate(updated)
      setSelectedIds([])
    } else if (deleteConfirm.product) {
      const result = deleteProduct(products, deleteConfirm.product.id)
      if (result.success) {
        handleProductsUpdate(result.products)
        setSelectedIds(selectedIds.filter((id) => id !== deleteConfirm.product.id))
      }
    }
    setDeleteConfirm({ open: false, product: null, isBatch: false })
  }

  function handleAskBatchDelete() {
    if (selectedIds.length === 0) return
    setDeleteConfirm({ open: true, product: null, isBatch: true })
  }

  function handleBatchOnShelf() {
    if (selectedIds.length === 0) return
    const { products: updated } = batchUpdateStatus(
      products,
      selectedIds,
      PRODUCT_STATUS.ON_SHELF
    )
    handleProductsUpdate(updated)
  }

  function handleBatchOffShelf() {
    if (selectedIds.length === 0) return
    const { products: updated } = batchUpdateStatus(
      products,
      selectedIds,
      PRODUCT_STATUS.OFF_SHELF
    )
    handleProductsUpdate(updated)
  }

  function renderPagination() {
    const { total, totalPage, currentPage, pageSize } = pagination
    const pages = []
    const start = Math.max(1, currentPage - 2)
    const end = Math.min(totalPage, start + 4)
    for (let i = start; i <= end; i++) {
      pages.push(i)
    }
    return (
      <div className="pagination">
        <div className="pagination-info">
          共 {total} 条，每页 {pageSize} 条
        </div>
        <div className="pagination-controls">
          <button
            className="page-btn"
            disabled={currentPage === 1}
            onClick={() => setPage(currentPage - 1)}
          >
            上一页
          </button>
          {pages.map((p) => (
            <button
              key={p}
              className={`page-btn ${p === currentPage ? 'active' : ''}`}
              onClick={() => setPage(p)}
            >
              {p}
            </button>
          ))}
          <button
            className="page-btn"
            disabled={currentPage === totalPage}
            onClick={() => setPage(currentPage + 1)}
          >
            下一页
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="products-page">
      <div className="page-header">
        <button className="btn btn-back" onClick={() => navigate('/')}>
          ← 返回首页
        </button>
        <h1 className="page-title">商品管理后台</h1>
      </div>

      <div className="toolbar">
        <div className="toolbar-left">
          <input
            className="form-input search-input"
            type="text"
            placeholder="按商品名称搜索..."
            value={keyword}
            onChange={(e) => handleKeywordChange(e.target.value)}
          />
        </div>
        <div className="toolbar-right">
          <button
            className="btn btn-primary"
            onClick={handleOpenCreate}
          >
            + 新建商品
          </button>
        </div>
      </div>

      {selectedIds.length > 0 && (
        <div className="batch-bar">
          <span>已选择 {selectedIds.length} 项</span>
          <button className="btn btn-sm" onClick={handleBatchOnShelf}>
            批量上架
          </button>
          <button className="btn btn-sm" onClick={handleBatchOffShelf}>
            批量下架
          </button>
          <button className="btn btn-sm btn-danger" onClick={handleAskBatchDelete}>
            批量删除
          </button>
          <button className="btn-link" onClick={() => setSelectedIds([])}>
            取消选择
          </button>
        </div>
      )}

      <ProductTable
        items={pagination.items}
        selectedIds={selectedIds}
        sortField={sortField}
        sortOrder={sortOrder}
        category={category}
        onSelectAll={handleSelectAll}
        onSelectOne={handleSelectOne}
        onSort={handleSort}
        onEdit={handleOpenEdit}
        onDelete={handleAskDelete}
        onCategoryChange={handleCategoryChange}
        allSelected={allSelected}
        someSelected={someSelected}
      />

      {renderPagination()}

      <ProductModal
        title={editingProduct ? '编辑商品' : '新建商品'}
        open={formModalOpen}
        onClose={() => {
          setFormModalOpen(false)
          setEditingProduct(null)
        }}
      >
        <ProductForm
          key={formKeyRef.current}
          initialData={editingProduct}
          onSubmit={handleFormSubmit}
          onCancel={() => {
            setFormModalOpen(false)
            setEditingProduct(null)
          }}
        />
      </ProductModal>

      <ConfirmDialog
        open={deleteConfirm.open}
        title="确认删除"
        message={
          deleteConfirm.isBatch
            ? `确定要批量删除选中的 ${selectedIds.length} 个商品吗？此操作不可恢复。`
            : deleteConfirm.product
            ? `确定要删除商品「${deleteConfirm.product.name}」吗？此操作不可恢复。`
            : ''
        }
        confirmText="删除"
        danger
        onConfirm={handleConfirmDelete}
        onCancel={() =>
          setDeleteConfirm({ open: false, product: null, isBatch: false })
        }
      />
    </div>
  )
}
