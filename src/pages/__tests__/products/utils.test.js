import { describe, it, expect, beforeEach, beforeAll, afterAll } from 'vitest'
import {
  generateId,
  validateProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  batchDeleteProducts,
  batchUpdateStatus,
  searchProducts,
  filterByCategory,
  sortProducts,
  paginateProducts,
  getProductList,
  formatPrice,
  formatDate,
  loadProducts,
  saveProducts,
} from '../../products/utils'
import {
  PRODUCT_STATUS,
  SORT_ORDERS,
  STORAGE_KEY,
  MOCK_PRODUCTS,
} from '../../products/constants'

const makeValidProduct = (overrides = {}) => ({
  name: '测试商品',
  price: 99,
  category: '电子产品',
  stock: 100,
  status: PRODUCT_STATUS.ON_SHELF,
  image: '',
  ...overrides,
})

const createMockLocalStorage = () => {
  let store = {}
  return {
    getItem: (key) => (key in store ? store[key] : null),
    setItem: (key, value) => {
      store[key] = String(value)
    },
    removeItem: (key) => {
      delete store[key]
    },
    clear: () => {
      store = {}
    },
  }
}

let originalLocalStorage

beforeAll(() => {
  originalLocalStorage = globalThis.localStorage
  globalThis.localStorage = createMockLocalStorage()
})

afterAll(() => {
  globalThis.localStorage = originalLocalStorage
})

describe('generateId', () => {
  it('生成的ID以 p_ 开头', () => {
    expect(generateId()).toMatch(/^p_/)
  })

  it('生成的ID不重复', () => {
    const ids = new Set()
    for (let i = 0; i < 100; i++) {
      ids.add(generateId())
    }
    expect(ids.size).toBe(100)
  })
})

describe('validateProduct', () => {
  it('验证通过时返回空对象', () => {
    const errors = validateProduct(makeValidProduct())
    expect(Object.keys(errors).length).toBe(0)
  })

  it('名称为空时报错', () => {
    const errors = validateProduct(makeValidProduct({ name: '' }))
    expect(errors.name).toBeTruthy()
  })

  it('名称全空格时报错', () => {
    const errors = validateProduct(makeValidProduct({ name: '   ' }))
    expect(errors.name).toBeTruthy()
  })

  it('名称超过100字符时报错', () => {
    const errors = validateProduct(makeValidProduct({ name: 'a'.repeat(101) }))
    expect(errors.name).toBeTruthy()
  })

  it('价格为空时报错', () => {
    const errors = validateProduct(makeValidProduct({ price: '' }))
    expect(errors.price).toBeTruthy()
  })

  it('价格为负数时报错', () => {
    const errors = validateProduct(makeValidProduct({ price: -1 }))
    expect(errors.price).toBeTruthy()
  })

  it('价格为非数字时报错', () => {
    const errors = validateProduct(makeValidProduct({ price: 'abc' }))
    expect(errors.price).toBeTruthy()
  })

  it('分类为空时报错', () => {
    const errors = validateProduct(makeValidProduct({ category: '' }))
    expect(errors.category).toBeTruthy()
  })

  it('库存为空时报错', () => {
    const errors = validateProduct(makeValidProduct({ stock: '' }))
    expect(errors.stock).toBeTruthy()
  })

  it('库存为负数时报错', () => {
    const errors = validateProduct(makeValidProduct({ stock: -1 }))
    expect(errors.stock).toBeTruthy()
  })

  it('库存为小数时报错', () => {
    const errors = validateProduct(makeValidProduct({ stock: 1.5 }))
    expect(errors.stock).toBeTruthy()
  })

  it('状态为空时报错', () => {
    const errors = validateProduct(makeValidProduct({ status: '' }))
    expect(errors.status).toBeTruthy()
  })
})

describe('createProduct', () => {
  it('数据无效时返回失败', () => {
    const result = createProduct([], { name: '' })
    expect(result.success).toBe(false)
    expect(result.errors).toBeTruthy()
  })

  it('成功创建商品并返回新列表', () => {
    const data = makeValidProduct()
    const result = createProduct([], data)
    expect(result.success).toBe(true)
    expect(result.product.id).toBeTruthy()
    expect(result.product.name).toBe('测试商品')
    expect(result.product.price).toBe(99)
    expect(result.product.createdAt).toBeTruthy()
    expect(result.products.length).toBe(1)
    expect(result.products[0]).toBe(result.product)
  })

  it('新商品放在列表最前面', () => {
    const existing = [{ id: 'old', name: '旧商品' }]
    const result = createProduct(existing, makeValidProduct())
    expect(result.products[0].id).toBe(result.product.id)
    expect(result.products[1].id).toBe('old')
  })
})

describe('updateProduct', () => {
  it('数据无效时返回失败', () => {
    const result = updateProduct([{ id: '1' }], '1', { name: '' })
    expect(result.success).toBe(false)
  })

  it('商品不存在时返回失败', () => {
    const result = updateProduct([], 'not-exist', makeValidProduct())
    expect(result.success).toBe(false)
  })

  it('成功更新商品信息', () => {
    const existing = [{ id: '1', name: '旧名称', price: 10, category: '电子产品', stock: 5, status: PRODUCT_STATUS.ON_SHELF }]
    const result = updateProduct(existing, '1', makeValidProduct({ name: '新名称', price: 20 }))
    expect(result.success).toBe(true)
    expect(result.product.name).toBe('新名称')
    expect(result.product.price).toBe(20)
    expect(result.products[0].name).toBe('新名称')
  })

  it('未传入 image 时保留原有图片', () => {
    const existing = [{ id: '1', name: '商品', price: 10, category: '电子产品', stock: 5, status: PRODUCT_STATUS.ON_SHELF, image: 'old-img' }]
    const data = { name: '测试商品', price: 99, category: '电子产品', stock: 100, status: PRODUCT_STATUS.ON_SHELF }
    const result = updateProduct(existing, '1', data)
    expect(result.product.image).toBe('old-img')
  })

  it('传入 image 时更新图片', () => {
    const existing = [{ id: '1', name: '商品', price: 10, category: '电子产品', stock: 5, status: PRODUCT_STATUS.ON_SHELF, image: 'old-img' }]
    const result = updateProduct(existing, '1', makeValidProduct({ image: 'new-img' }))
    expect(result.product.image).toBe('new-img')
  })
})

describe('deleteProduct', () => {
  it('商品不存在时返回失败', () => {
    const result = deleteProduct([], 'not-exist')
    expect(result.success).toBe(false)
    expect(result.products.length).toBe(0)
  })

  it('成功删除商品', () => {
    const existing = [
      { id: '1', name: '商品1' },
      { id: '2', name: '商品2' },
    ]
    const result = deleteProduct(existing, '1')
    expect(result.success).toBe(true)
    expect(result.products.length).toBe(1)
    expect(result.products[0].id).toBe('2')
  })
})

describe('batchDeleteProducts', () => {
  it('批量删除指定ID的商品', () => {
    const existing = [
      { id: '1' },
      { id: '2' },
      { id: '3' },
    ]
    const result = batchDeleteProducts(existing, ['1', '3'])
    expect(result.products.length).toBe(1)
    expect(result.products[0].id).toBe('2')
  })

  it('空ID数组时不删除', () => {
    const existing = [{ id: '1' }]
    const result = batchDeleteProducts(existing, [])
    expect(result.products.length).toBe(1)
  })
})

describe('batchUpdateStatus', () => {
  it('批量更新商品状态', () => {
    const existing = [
      { id: '1', status: PRODUCT_STATUS.OFF_SHELF },
      { id: '2', status: PRODUCT_STATUS.OFF_SHELF },
      { id: '3', status: PRODUCT_STATUS.OFF_SHELF },
    ]
    const result = batchUpdateStatus(existing, ['1', '3'], PRODUCT_STATUS.ON_SHELF)
    expect(result.products[0].status).toBe(PRODUCT_STATUS.ON_SHELF)
    expect(result.products[1].status).toBe(PRODUCT_STATUS.OFF_SHELF)
    expect(result.products[2].status).toBe(PRODUCT_STATUS.ON_SHELF)
  })
})

describe('searchProducts', () => {
  const products = [
    { name: '无线蓝牙耳机' },
    { name: '有线耳机' },
    { name: '蓝牙音箱' },
  ]

  it('空关键词返回全部', () => {
    const result = searchProducts(products, '')
    expect(result.length).toBe(3)
  })

  it('按名称模糊搜索', () => {
    const result = searchProducts(products, '蓝牙')
    expect(result.length).toBe(2)
  })

  it('搜索不区分大小写', () => {
    const result = searchProducts(products, 'BLUETOOTH')
    expect(result.length).toBe(0)
    const cnResult = searchProducts(products, '耳机')
    expect(cnResult.length).toBe(2)
  })
})

describe('filterByCategory', () => {
  const products = [
    { category: '电子产品' },
    { category: '服装鞋帽' },
    { category: '电子产品' },
  ]

  it('all 或空值返回全部', () => {
    expect(filterByCategory(products, 'all').length).toBe(3)
    expect(filterByCategory(products, '').length).toBe(3)
  })

  it('按分类筛选', () => {
    const result = filterByCategory(products, '电子产品')
    expect(result.length).toBe(2)
  })
})

describe('sortProducts', () => {
  const products = [
    { id: '1', price: 100, stock: 10, createdAt: 1000, name: 'B商品' },
    { id: '2', price: 50, stock: 5, createdAt: 2000, name: 'A商品' },
    { id: '3', price: 200, stock: 20, createdAt: 500, name: 'C商品' },
  ]

  it('空排序字段返回原顺序', () => {
    const result = sortProducts(products, null)
    expect(result.map((p) => p.id)).toEqual(['1', '2', '3'])
  })

  it('按价格升序', () => {
    const result = sortProducts(products, 'price', SORT_ORDERS.ASC)
    expect(result.map((p) => p.price)).toEqual([50, 100, 200])
  })

  it('按价格降序', () => {
    const result = sortProducts(products, 'price', SORT_ORDERS.DESC)
    expect(result.map((p) => p.price)).toEqual([200, 100, 50])
  })

  it('按库存升序', () => {
    const result = sortProducts(products, 'stock', SORT_ORDERS.ASC)
    expect(result.map((p) => p.stock)).toEqual([5, 10, 20])
  })

  it('按创建时间降序（最新在前）', () => {
    const result = sortProducts(products, 'createdAt', SORT_ORDERS.DESC)
    expect(result.map((p) => p.id)).toEqual(['2', '1', '3'])
  })

  it('不修改原数组', () => {
    const original = [...products]
    sortProducts(products, 'price', SORT_ORDERS.ASC)
    expect(products).toEqual(original)
  })
})

describe('paginateProducts', () => {
  const products = Array.from({ length: 25 }, (_, i) => ({ id: String(i + 1) }))

  it('第一页正确', () => {
    const result = paginateProducts(products, 1, 10)
    expect(result.items.length).toBe(10)
    expect(result.items[0].id).toBe('1')
    expect(result.items[9].id).toBe('10')
    expect(result.currentPage).toBe(1)
    expect(result.totalPage).toBe(3)
    expect(result.total).toBe(25)
  })

  it('最后一页正确', () => {
    const result = paginateProducts(products, 3, 10)
    expect(result.items.length).toBe(5)
    expect(result.currentPage).toBe(3)
  })

  it('页码超出范围时修正', () => {
    const result = paginateProducts(products, 100, 10)
    expect(result.currentPage).toBe(3)
  })

  it('页码小于1时修正', () => {
    const result = paginateProducts(products, 0, 10)
    expect(result.currentPage).toBe(1)
  })

  it('空列表返回第一页', () => {
    const result = paginateProducts([], 1, 10)
    expect(result.items.length).toBe(0)
    expect(result.totalPage).toBe(1)
  })
})

describe('getProductList', () => {
  const products = [
    { id: '1', name: '蓝牙耳机', price: 100, category: '电子产品', stock: 10, status: PRODUCT_STATUS.ON_SHELF, createdAt: 100 },
    { id: '2', name: '运动T恤', price: 50, category: '服装鞋帽', stock: 20, status: PRODUCT_STATUS.OFF_SHELF, createdAt: 200 },
    { id: '3', name: '蓝牙音箱', price: 200, category: '电子产品', stock: 5, status: PRODUCT_STATUS.ON_SHELF, createdAt: 300 },
    { id: '4', name: '咖啡豆', price: 80, category: '食品饮料', stock: 15, status: PRODUCT_STATUS.ON_SHELF, createdAt: 400 },
  ]

  it('组合搜索、筛选、排序、分页', () => {
    const result = getProductList(products, {
      keyword: '蓝牙',
      category: '电子产品',
      sortField: 'price',
      sortOrder: SORT_ORDERS.ASC,
      page: 1,
      pageSize: 10,
    })
    expect(result.items.length).toBe(2)
    expect(result.items[0].price).toBe(100)
    expect(result.items[1].price).toBe(200)
  })

  it('无选项时返回全部', () => {
    const result = getProductList(products, {})
    expect(result.items.length).toBe(4)
  })
})

describe('formatPrice', () => {
  it('格式化价格为人民币', () => {
    expect(formatPrice(99)).toBe('¥99.00')
    expect(formatPrice(99.9)).toBe('¥99.90')
    expect(formatPrice(0)).toBe('¥0.00')
  })
})

describe('formatDate', () => {
  it('格式化时间戳为日期字符串', () => {
    const ts = new Date('2024-01-15T10:30:00').getTime()
    const result = formatDate(ts)
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/)
    expect(result).toContain('2024')
    expect(result).toContain('10:30')
  })
})

describe('localStorage operations', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('saveProducts 保存到 localStorage', () => {
    const products = [{ id: '1', name: '商品' }]
    const result = saveProducts(products)
    expect(result).toBe(true)
    expect(localStorage.getItem(STORAGE_KEY)).toBe(JSON.stringify(products))
  })

  it('loadProducts 从 localStorage 读取', () => {
    const products = [{ id: '1', name: '商品' }]
    localStorage.setItem(STORAGE_KEY, JSON.stringify(products))
    const result = loadProducts()
    expect(result).toEqual(products)
  })

  it('loadProducts localStorage 为空时返回 mock 数据', () => {
    const result = loadProducts()
    expect(result.length).toBe(MOCK_PRODUCTS.length)
  })

  it('loadProducts localStorage 数据损坏时返回 mock 数据', () => {
    localStorage.setItem(STORAGE_KEY, 'invalid-json')
    const result = loadProducts()
    expect(result.length).toBe(MOCK_PRODUCTS.length)
  })
})
