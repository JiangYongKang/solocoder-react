import {
  STORAGE_KEY,
  MOCK_PRODUCTS,
  SORT_ORDERS,
  PAGE_SIZE,
} from './constants'

export function generateId() {
  return 'p_' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36)
}

export function loadProducts() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      return JSON.parse(raw)
    }
  } catch (_e) {}
  return [...MOCK_PRODUCTS]
}

export function saveProducts(products) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(products))
    return true
  } catch (_e) {
    return false
  }
}

export function validateProduct(data) {
  const errors = {}
  if (!data.name || data.name.trim().length === 0) {
    errors.name = '商品名称不能为空'
  } else if (data.name.trim().length > 100) {
    errors.name = '商品名称不能超过100个字符'
  }
  if (data.price === undefined || data.price === null || data.price === '') {
    errors.price = '商品价格不能为空'
  } else if (isNaN(Number(data.price)) || Number(data.price) < 0) {
    errors.price = '商品价格必须是非负数字'
  }
  if (!data.category) {
    errors.category = '请选择商品分类'
  }
  if (data.stock === undefined || data.stock === null || data.stock === '') {
    errors.stock = '库存数量不能为空'
  } else if (!Number.isInteger(Number(data.stock)) || Number(data.stock) < 0) {
    errors.stock = '库存数量必须是非负整数'
  }
  if (!data.status) {
    errors.status = '请选择上下架状态'
  }
  return errors
}

export function createProduct(products, data) {
  const errors = validateProduct(data)
  if (Object.keys(errors).length > 0) {
    return { success: false, errors }
  }
  const newProduct = {
    id: generateId(),
    name: data.name.trim(),
    price: Number(data.price),
    category: data.category,
    stock: Number(data.stock),
    status: data.status,
    image: data.image || '',
    createdAt: Date.now(),
  }
  const updated = [newProduct, ...products]
  return { success: true, product: newProduct, products: updated }
}

export function updateProduct(products, id, data) {
  const errors = validateProduct(data)
  if (Object.keys(errors).length > 0) {
    return { success: false, errors }
  }
  const index = products.findIndex((p) => p.id === id)
  if (index === -1) {
    return { success: false, errors: { id: '商品不存在' } }
  }
  const updated = [...products]
  updated[index] = {
    ...updated[index],
    name: data.name.trim(),
    price: Number(data.price),
    category: data.category,
    stock: Number(data.stock),
    status: data.status,
    image: data.image !== undefined ? data.image : updated[index].image,
  }
  return { success: true, product: updated[index], products: updated }
}

export function deleteProduct(products, id) {
  const exists = products.some((p) => p.id === id)
  if (!exists) {
    return { success: false, products }
  }
  return { success: true, products: products.filter((p) => p.id !== id) }
}

export function batchDeleteProducts(products, ids) {
  const idSet = new Set(ids)
  return { products: products.filter((p) => !idSet.has(p.id)) }
}

export function batchUpdateStatus(products, ids, status) {
  const idSet = new Set(ids)
  const updated = products.map((p) =>
    idSet.has(p.id) ? { ...p, status } : p
  )
  return { products: updated }
}

export function searchProducts(products, keyword) {
  if (!keyword || keyword.trim().length === 0) {
    return products
  }
  const kw = keyword.trim().toLowerCase()
  return products.filter((p) => p.name.toLowerCase().includes(kw))
}

export function filterByCategory(products, category) {
  if (!category || category === 'all') {
    return products
  }
  return products.filter((p) => p.category === category)
}

export function sortProducts(products, sortField, sortOrder) {
  if (!sortField) return products
  const order = sortOrder === SORT_ORDERS.DESC ? -1 : 1
  return [...products].sort((a, b) => {
    let va = a[sortField]
    let vb = b[sortField]
    if (typeof va === 'string' && typeof vb === 'string') {
      return va.localeCompare(vb) * order
    }
    return (va - vb) * order
  })
}

export function paginateProducts(products, page, pageSize = PAGE_SIZE) {
  const totalPage = Math.max(1, Math.ceil(products.length / pageSize))
  const currentPage = Math.min(Math.max(1, page), totalPage)
  const start = (currentPage - 1) * pageSize
  const end = start + pageSize
  return {
    items: products.slice(start, end),
    total: products.length,
    totalPage,
    currentPage,
    pageSize,
  }
}

export function getProductList(products, options = {}) {
  let result = [...products]
  result = searchProducts(result, options.keyword)
  result = filterByCategory(result, options.category)
  result = sortProducts(result, options.sortField, options.sortOrder)
  const pagination = paginateProducts(result, options.page || 1, options.pageSize)
  return pagination
}

export function fileToDataURL(file) {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error('No file provided'))
      return
    }
    if (!file.type.startsWith('image/')) {
      reject(new Error('File must be an image'))
      return
    }
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsDataURL(file)
  })
}

export function formatPrice(price) {
  return '¥' + Number(price).toFixed(2)
}

export function formatDate(timestamp) {
  const d = new Date(timestamp)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const h = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  return `${y}-${m}-${day} ${h}:${min}`
}
