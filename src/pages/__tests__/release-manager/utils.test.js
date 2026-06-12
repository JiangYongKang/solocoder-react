import { describe, it, expect, beforeEach, beforeAll, afterAll } from 'vitest'
import {
  generateId,
  loadReleases,
  saveReleases,
  isValidSemanticVersion,
  parseSemanticVersion,
  formatSemanticVersion,
  compareSemanticVersions,
  sortReleasesByVersion,
  validateReleaseForm,
  normalizeVersion,
  createRelease,
  updateRelease,
  isReleaseEditable,
  getStatusActions,
  getNextStatus,
  actionRequiresRemark,
  performApprovalAction,
  filterReleasesByStatus,
  paginateReleases,
  getReleaseList,
  getReleaseStats,
  getApprovalTimeline,
  splitLines,
  computeLCSMatrix,
  computeLineDiff,
  mergeModifiedLines,
  buildReleaseDiff,
  getDiffStats,
  isDiffTooLarge,
  truncateTextForDiff,
  MAX_DIFF_LINES,
  formatDate,
  formatDateOnly,
  getTimelineColor,
  simpleMarkdownToHtml,
  DIFF_TYPE_INTERNAL,
} from '../../release-manager/utils.js'
import {
  RELEASE_STATUS,
  APPROVAL_ACTION,
  STORAGE_KEY,
  PAGE_SIZE,
  CURRENT_USER,
} from '../../release-manager/constants.js'

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

beforeEach(() => {
  globalThis.localStorage.clear()
})

const makeValidFormData = (overrides = {}) => ({
  version: 'v1.0.0',
  title: '测试版本',
  changelog: '- 初始版本',
  releaseDate: '2024-01-01',
  ...overrides,
})

const makeRelease = (overrides = {}) => {
  const now = Date.now()
  return {
    id: generateId('rel'),
    version: 'v1.0.0',
    title: '测试版本',
    changelog: '',
    releaseDate: '2024-01-01',
    publisher: CURRENT_USER.name,
    status: RELEASE_STATUS.DRAFT,
    createdAt: now,
    updatedAt: now,
    approvalRecords: [],
    ...overrides,
  }
}

describe('generateId', () => {
  it('生成不同前缀的唯一 ID', () => {
    const id1 = generateId('rel')
    const id2 = generateId('ar')
    expect(id1).toContain('rel_')
    expect(id2).toContain('ar_')
    expect(id1).not.toBe(id2)
  })

  it('每次调用生成不同的 ID', () => {
    const ids = new Set()
    for (let i = 0; i < 100; i++) {
      ids.add(generateId())
    }
    expect(ids.size).toBe(100)
  })
})

describe('loadReleases / saveReleases', () => {
  it('空 storage 返回 mock 数据', () => {
    const releases = loadReleases()
    expect(Array.isArray(releases)).toBe(true)
    expect(releases.length).toBeGreaterThan(0)
  })

  it('saveReleases 后 loadReleases 返回正确数据', () => {
    const mock = [{ id: 'test_1', version: 'v1.0.0' }]
    const saved = saveReleases(mock)
    expect(saved).toBe(true)
    const loaded = loadReleases()
    expect(loaded).toEqual(mock)
  })

  it('saveReleases 处理异常', () => {
    const originalSetItem = globalThis.localStorage.setItem
    globalThis.localStorage.setItem = () => {
      throw new Error('test')
    }
    const saved = saveReleases([])
    expect(saved).toBe(false)
    globalThis.localStorage.setItem = originalSetItem
  })

  it('loadReleases 处理无效 JSON', () => {
    globalThis.localStorage.setItem(STORAGE_KEY, '{invalid json')
    const releases = loadReleases()
    expect(Array.isArray(releases)).toBe(true)
  })

  it('loadReleases 处理非数组数据', () => {
    globalThis.localStorage.setItem(STORAGE_KEY, JSON.stringify({ not: 'array' }))
    const releases = loadReleases()
    expect(Array.isArray(releases)).toBe(true)
  })
})

describe('isValidSemanticVersion', () => {
  it('正确校验有效版本号', () => {
    expect(isValidSemanticVersion('v1.2.3')).toBe(true)
    expect(isValidSemanticVersion('1.2.3')).toBe(true)
    expect(isValidSemanticVersion('0.0.1')).toBe(true)
    expect(isValidSemanticVersion('10.20.30')).toBe(true)
    expect(isValidSemanticVersion('  v1.0.0  ')).toBe(true)
  })

  it('正确拒绝无效版本号', () => {
    expect(isValidSemanticVersion('')).toBe(false)
    expect(isValidSemanticVersion('v1')).toBe(false)
    expect(isValidSemanticVersion('v1.2')).toBe(false)
    expect(isValidSemanticVersion('1.2')).toBe(false)
    expect(isValidSemanticVersion('v1.2.3.4')).toBe(false)
    expect(isValidSemanticVersion('v.a.b')).toBe(false)
    expect(isValidSemanticVersion('abc')).toBe(false)
    expect(isValidSemanticVersion(null)).toBe(false)
    expect(isValidSemanticVersion(undefined)).toBe(false)
    expect(isValidSemanticVersion(123)).toBe(false)
    expect(isValidSemanticVersion('v1.2.3-beta')).toBe(false)
    expect(isValidSemanticVersion('-1.2.3')).toBe(false)
  })
})

describe('parseSemanticVersion', () => {
  it('正确解析有效版本号', () => {
    expect(parseSemanticVersion('v1.2.3')).toEqual({
      major: 1, minor: 2, patch: 3, raw: 'v1.2.3',
    })
    expect(parseSemanticVersion('2.3.4')).toEqual({
      major: 2, minor: 3, patch: 4, raw: '2.3.4',
    })
  })

  it('无效版本返回 null', () => {
    expect(parseSemanticVersion('invalid')).toBe(null)
    expect(parseSemanticVersion('')).toBe(null)
  })
})

describe('formatSemanticVersion', () => {
  it('正确格式化版本号', () => {
    expect(formatSemanticVersion(1, 2, 3)).toBe('v1.2.3')
    expect(formatSemanticVersion(0, 0, 0)).toBe('v0.0.0')
    expect(formatSemanticVersion(10, 20, 30)).toBe('v10.20.30')
  })

  it('无效参数返回 null', () => {
    expect(formatSemanticVersion(-1, 0, 0)).toBe(null)
    expect(formatSemanticVersion(1, -1, 0)).toBe(null)
    expect(formatSemanticVersion(1, 0, -1)).toBe(null)
    expect(formatSemanticVersion(1.5, 0, 0)).toBe(null)
    expect(formatSemanticVersion('1', 0, 0)).toBe(null)
  })
})

describe('compareSemanticVersions', () => {
  it('正确比较语义化版本', () => {
    expect(compareSemanticVersions('v1.0.0', 'v1.0.0')).toBe(0)
    expect(compareSemanticVersions('v2.0.0', 'v1.0.0')).toBeGreaterThan(0)
    expect(compareSemanticVersions('v1.0.0', 'v2.0.0')).toBeLessThan(0)
    expect(compareSemanticVersions('v1.1.0', 'v1.0.0')).toBeGreaterThan(0)
    expect(compareSemanticVersions('v1.0.1', 'v1.0.0')).toBeGreaterThan(0)
    expect(compareSemanticVersions('v10.0.0', 'v2.0.0')).toBeGreaterThan(0)
    expect(compareSemanticVersions('v1.0.10', 'v1.0.2')).toBeGreaterThan(0)
  })

  it('无效版本比较', () => {
    expect(compareSemanticVersions('invalid', 'invalid')).toBe(0)
    expect(compareSemanticVersions('invalid', 'v1.0.0')).toBe(-1)
    expect(compareSemanticVersions('v1.0.0', 'invalid')).toBe(1)
  })
})

describe('sortReleasesByVersion', () => {
  it('按版本号降序排序', () => {
    const releases = [
      makeRelease({ version: 'v1.0.0', createdAt: 1 }),
      makeRelease({ version: 'v2.0.0', createdAt: 2 }),
      makeRelease({ version: 'v1.5.0', createdAt: 3 }),
    ]
    const sorted = sortReleasesByVersion(releases, true)
    expect(sorted[0].version).toBe('v2.0.0')
    expect(sorted[1].version).toBe('v1.5.0')
    expect(sorted[2].version).toBe('v1.0.0')
  })

  it('相同版本按 createdAt 排序', () => {
    const releases = [
      makeRelease({ version: 'v1.0.0', createdAt: 100 }),
      makeRelease({ version: 'v1.0.0', createdAt: 200 }),
    ]
    const sorted = sortReleasesByVersion(releases, true)
    expect(sorted[0].createdAt).toBe(200)
  })

  it('处理无效输入', () => {
    expect(sortReleasesByVersion(null)).toEqual([])
    expect(sortReleasesByVersion(undefined)).toEqual([])
    expect(sortReleasesByVersion('not array')).toEqual([])
  })
})

describe('normalizeVersion', () => {
  it('添加 v 前缀', () => {
    expect(normalizeVersion('1.0.0')).toBe('v1.0.0')
    expect(normalizeVersion('v1.0.0')).toBe('v1.0.0')
    expect(normalizeVersion('  1.0.0  ')).toBe('v1.0.0')
  })

  it('处理空值', () => {
    expect(normalizeVersion('')).toBe('')
    expect(normalizeVersion(null)).toBe('')
    expect(normalizeVersion(undefined)).toBe('')
  })
})

describe('validateReleaseForm', () => {
  it('空版本号报错', () => {
    const errors = validateReleaseForm({ ...makeValidFormData(), version: '' })
    expect(errors.version).toBeDefined()
  })

  it('无效版本格式报错', () => {
    const errors = validateReleaseForm({ ...makeValidFormData(), version: 'invalid' })
    expect(errors.version).toContain('格式')
  })

  it('空标题报错', () => {
    const errors = validateReleaseForm({ ...makeValidFormData(), title: '' })
    expect(errors.title).toBeDefined()
  })

  it('标题超过 100 字符报错', () => {
    const errors = validateReleaseForm({
      ...makeValidFormData(),
      title: 'a'.repeat(101),
    })
    expect(errors.title).toContain('100')
  })

  it('重复版本号报错', () => {
    const existing = [makeRelease({ id: 'r1', version: 'v1.0.0' })]
    const errors = validateReleaseForm(makeValidFormData(), existing)
    expect(errors.version).toContain('已存在')
  })

  it('重复版本号但 excludeId 相同不报错', () => {
    const existing = [makeRelease({ id: 'r1', version: 'v1.0.0' })]
    const errors = validateReleaseForm(makeValidFormData(), existing, 'r1')
    expect(errors.version).toBeUndefined()
  })

  it('无效日期报错', () => {
    const errors = validateReleaseForm({
      ...makeValidFormData(),
      releaseDate: 'not-a-date',
    })
    expect(errors.releaseDate).toBeDefined()
  })

  it('有效表单无错误', () => {
    const errors = validateReleaseForm(makeValidFormData(), [])
    expect(Object.keys(errors).length).toBe(0)
  })

  it('空日期允许', () => {
    const errors = validateReleaseForm({
      ...makeValidFormData(),
      releaseDate: '',
    })
    expect(errors.releaseDate).toBeUndefined()
  })

  it('表单非对象返回错误', () => {
    const errors = validateReleaseForm(null)
    expect(Object.keys(errors).length).toBeGreaterThan(0)
  })
})

describe('createRelease', () => {
  it('有效数据创建成功', () => {
    const result = createRelease([], makeValidFormData())
    expect(result.success).toBe(true)
    expect(result.release.status).toBe(RELEASE_STATUS.DRAFT)
    expect(result.release.id).toBeDefined()
    expect(result.release.approvalRecords).toEqual([])
    expect(result.releases.length).toBe(1)
  })

  it('无效数据返回错误', () => {
    const result = createRelease([], { version: '', title: '' })
    expect(result.success).toBe(false)
    expect(result.errors).toBeDefined()
  })

  it('创建版本号带 v 前缀', () => {
    const result = createRelease([], makeValidFormData({ version: '2.0.0' }))
    expect(result.release.version).toBe('v2.0.0')
  })
})

describe('updateRelease', () => {
  it('草稿状态可更新', () => {
    const release = makeRelease({ id: 'r1', status: RELEASE_STATUS.DRAFT })
    const releases = [release]
    const result = updateRelease(releases, 'r1', makeValidFormData({ title: '新标题' }))
    expect(result.success).toBe(true)
    expect(result.release.title).toBe('新标题')
  })

  it('非草稿状态不可更新', () => {
    const release = makeRelease({ id: 'r1', status: RELEASE_STATUS.PENDING })
    const releases = [release]
    const result = updateRelease(releases, 'r1', makeValidFormData())
    expect(result.success).toBe(false)
    expect(result.errors.status).toBeDefined()
  })

  it('版本不存在报错', () => {
    const result = updateRelease([], 'not_exist', makeValidFormData())
    expect(result.success).toBe(false)
    expect(result.errors.id).toBeDefined()
  })

  it('表单验证失败返回错误', () => {
    const release = makeRelease({ id: 'r1' })
    const releases = [release]
    const result = updateRelease(releases, 'r1', { version: '', title: '' })
    expect(result.success).toBe(false)
  })
})

describe('isReleaseEditable', () => {
  it('草稿状态可编辑', () => {
    expect(isReleaseEditable(makeRelease({ status: RELEASE_STATUS.DRAFT }))).toBe(true)
  })

  it('其他状态不可编辑', () => {
    expect(isReleaseEditable(makeRelease({ status: RELEASE_STATUS.PENDING }))).toBe(false)
    expect(isReleaseEditable(makeRelease({ status: RELEASE_STATUS.PUBLISHED }))).toBe(false)
    expect(isReleaseEditable(makeRelease({ status: RELEASE_STATUS.ROLLED_BACK }))).toBe(false)
    expect(isReleaseEditable(null)).toBe(false)
    expect(isReleaseEditable(undefined)).toBe(false)
  })
})

describe('getStatusActions', () => {
  it('草稿状态可提交审核', () => {
    const actions = getStatusActions(makeRelease({ status: RELEASE_STATUS.DRAFT }))
    expect(actions).toContain(APPROVAL_ACTION.SUBMIT)
    expect(actions.length).toBe(1)
  })

  it('待审核状态可审核通过或驳回', () => {
    const actions = getStatusActions(makeRelease({ status: RELEASE_STATUS.PENDING }))
    expect(actions).toContain(APPROVAL_ACTION.APPROVE)
    expect(actions).toContain(APPROVAL_ACTION.REJECT)
    expect(actions.length).toBe(2)
  })

  it('已发布状态可回滚', () => {
    const actions = getStatusActions(makeRelease({ status: RELEASE_STATUS.PUBLISHED }))
    expect(actions).toContain(APPROVAL_ACTION.ROLLBACK)
    expect(actions.length).toBe(1)
  })

  it('已回滚状态无操作', () => {
    const actions = getStatusActions(makeRelease({ status: RELEASE_STATUS.ROLLED_BACK }))
    expect(actions).toEqual([])
  })

  it('无效输入返回空数组', () => {
    expect(getStatusActions(null)).toEqual([])
    expect(getStatusActions(undefined)).toEqual([])
  })
})

describe('getNextStatus', () => {
  it('返回正确的下一个状态', () => {
    expect(getNextStatus(APPROVAL_ACTION.SUBMIT)).toBe(RELEASE_STATUS.PENDING)
    expect(getNextStatus(APPROVAL_ACTION.APPROVE)).toBe(RELEASE_STATUS.PUBLISHED)
    expect(getNextStatus(APPROVAL_ACTION.REJECT)).toBe(RELEASE_STATUS.DRAFT)
    expect(getNextStatus(APPROVAL_ACTION.ROLLBACK)).toBe(RELEASE_STATUS.ROLLED_BACK)
    expect(getNextStatus('invalid')).toBe(null)
  })
})

describe('actionRequiresRemark', () => {
  it('驳回和回滚需要备注', () => {
    expect(actionRequiresRemark(APPROVAL_ACTION.REJECT)).toBe(true)
    expect(actionRequiresRemark(APPROVAL_ACTION.ROLLBACK)).toBe(true)
    expect(actionRequiresRemark(APPROVAL_ACTION.SUBMIT)).toBe(false)
    expect(actionRequiresRemark(APPROVAL_ACTION.APPROVE)).toBe(false)
  })
})

describe('performApprovalAction', () => {
  it('提交审核成功', () => {
    const release = makeRelease({ id: 'r1', status: RELEASE_STATUS.DRAFT })
    const result = performApprovalAction([release], 'r1', APPROVAL_ACTION.SUBMIT, '')
    expect(result.success).toBe(true)
    expect(result.release.status).toBe(RELEASE_STATUS.PENDING)
    expect(result.release.approvalRecords.length).toBe(1)
    expect(result.record.fromStatus).toBe(RELEASE_STATUS.DRAFT)
    expect(result.record.toStatus).toBe(RELEASE_STATUS.PENDING)
  })

  it('审核通过成功', () => {
    const release = makeRelease({ id: 'r1', status: RELEASE_STATUS.PENDING })
    const result = performApprovalAction([release], 'r1', APPROVAL_ACTION.APPROVE, '')
    expect(result.success).toBe(true)
    expect(result.release.status).toBe(RELEASE_STATUS.PUBLISHED)
  })

  it('审核驳回需要原因', () => {
    const release = makeRelease({ id: 'r1', status: RELEASE_STATUS.PENDING })
    const result = performApprovalAction([release], 'r1', APPROVAL_ACTION.REJECT, '')
    expect(result.success).toBe(false)
    expect(result.error).toContain('驳回原因')

    const result2 = performApprovalAction([release], 'r1', APPROVAL_ACTION.REJECT, '功能不完整')
    expect(result2.success).toBe(true)
    expect(result2.release.status).toBe(RELEASE_STATUS.DRAFT)
    expect(result2.record.remark).toBe('功能不完整')
  })

  it('回滚需要原因', () => {
    const release = makeRelease({ id: 'r1', status: RELEASE_STATUS.PUBLISHED })
    const result = performApprovalAction([release], 'r1', APPROVAL_ACTION.ROLLBACK, '')
    expect(result.success).toBe(false)
    expect(result.error).toContain('回滚原因')

    const result2 = performApprovalAction([release], 'r1', APPROVAL_ACTION.ROLLBACK, '线上 bug')
    expect(result2.success).toBe(true)
    expect(result2.release.status).toBe(RELEASE_STATUS.ROLLED_BACK)
  })

  it('版本不存在报错', () => {
    const result = performApprovalAction([], 'not_exist', APPROVAL_ACTION.SUBMIT)
    expect(result.success).toBe(false)
    expect(result.error).toContain('不存在')
  })

  it('非法状态转换报错', () => {
    const release = makeRelease({ id: 'r1', status: RELEASE_STATUS.DRAFT })
    const result = performApprovalAction([release], 'r1', APPROVAL_ACTION.APPROVE, '')
    expect(result.success).toBe(false)
    expect(result.error).toContain('不允许')
  })

  it('乐观锁校验：expectedUpdatedAt 不匹配返回错误', () => {
    const release = makeRelease({ id: 'r1', status: RELEASE_STATUS.DRAFT, updatedAt: 1000 })
    const result = performApprovalAction(
      [release],
      'r1',
      APPROVAL_ACTION.SUBMIT,
      '',
      CURRENT_USER,
      999
    )
    expect(result.success).toBe(false)
    expect(result.error).toContain('已被修改')
  })

  it('乐观锁校验：expectedUpdatedAt 匹配时操作成功', () => {
    const release = makeRelease({ id: 'r1', status: RELEASE_STATUS.DRAFT, updatedAt: 1000 })
    const result = performApprovalAction(
      [release],
      'r1',
      APPROVAL_ACTION.SUBMIT,
      '',
      CURRENT_USER,
      1000
    )
    expect(result.success).toBe(true)
    expect(result.release.status).toBe(RELEASE_STATUS.PENDING)
  })

  it('乐观锁校验：expectedUpdatedAt 为 undefined 时跳过校验', () => {
    const release = makeRelease({ id: 'r1', status: RELEASE_STATUS.DRAFT, updatedAt: 1000 })
    const result = performApprovalAction(
      [release],
      'r1',
      APPROVAL_ACTION.SUBMIT,
      '',
      CURRENT_USER,
      undefined
    )
    expect(result.success).toBe(true)
  })

  it('操作人信息正确记录到审批记录中', () => {
    const operator = { id: 'u_test', name: '测试用户' }
    const release = makeRelease({ id: 'r1', status: RELEASE_STATUS.DRAFT })
    const result = performApprovalAction(
      [release],
      'r1',
      APPROVAL_ACTION.SUBMIT,
      '测试备注',
      operator
    )
    expect(result.success).toBe(true)
    expect(result.record.operatorId).toBe('u_test')
    expect(result.record.operator).toBe('测试用户')
    expect(result.record.remark).toBe('测试备注')
  })

  it('默认操作人为 CURRENT_USER', () => {
    const release = makeRelease({ id: 'r1', status: RELEASE_STATUS.DRAFT })
    const result = performApprovalAction([release], 'r1', APPROVAL_ACTION.SUBMIT)
    expect(result.record.operatorId).toBe(CURRENT_USER.id)
    expect(result.record.operator).toBe(CURRENT_USER.name)
  })

  it('操作成功后 updatedAt 更新', () => {
    const oldTime = Date.now() - 10000
    const release = makeRelease({ id: 'r1', status: RELEASE_STATUS.DRAFT, updatedAt: oldTime })
    const result = performApprovalAction([release], 'r1', APPROVAL_ACTION.SUBMIT)
    expect(result.release.updatedAt).toBeGreaterThan(oldTime)
  })

  it('已回滚状态不能再操作', () => {
    const release = makeRelease({ id: 'r1', status: RELEASE_STATUS.ROLLED_BACK })
    const result = performApprovalAction([release], 'r1', APPROVAL_ACTION.ROLLBACK, '原因')
    expect(result.success).toBe(false)
  })

  it('审批记录追加到已有记录之后', () => {
    const existingRecord = { id: 'ar_old', action: APPROVAL_ACTION.SUBMIT, fromStatus: RELEASE_STATUS.DRAFT, toStatus: RELEASE_STATUS.PENDING, operator: 'old', operatorId: 'old_id', timestamp: 1000, remark: '' }
    const release = makeRelease({
      id: 'r1',
      status: RELEASE_STATUS.PENDING,
      approvalRecords: [existingRecord],
    })
    const result = performApprovalAction([release], 'r1', APPROVAL_ACTION.APPROVE, '')
    expect(result.release.approvalRecords.length).toBe(2)
    expect(result.release.approvalRecords[0].id).toBe('ar_old')
    expect(result.release.approvalRecords[1].id).toBe(result.record.id)
  })

  it('驳回操作记录驳回原因', () => {
    const release = makeRelease({ id: 'r1', status: RELEASE_STATUS.PENDING })
    const result = performApprovalAction([release], 'r1', APPROVAL_ACTION.REJECT, '测试驳回原因详细说明')
    expect(result.success).toBe(true)
    expect(result.record.remark).toBe('测试驳回原因详细说明')
    expect(result.record.fromStatus).toBe(RELEASE_STATUS.PENDING)
    expect(result.record.toStatus).toBe(RELEASE_STATUS.DRAFT)
  })

  it('回滚操作记录回滚原因', () => {
    const release = makeRelease({ id: 'r1', status: RELEASE_STATUS.PUBLISHED })
    const result = performApprovalAction([release], 'r1', APPROVAL_ACTION.ROLLBACK, '测试回滚原因')
    expect(result.success).toBe(true)
    expect(result.record.remark).toBe('测试回滚原因')
    expect(result.record.fromStatus).toBe(RELEASE_STATUS.PUBLISHED)
    expect(result.record.toStatus).toBe(RELEASE_STATUS.ROLLED_BACK)
  })

  it('提交审核备注为可选', () => {
    const release = makeRelease({ id: 'r1', status: RELEASE_STATUS.DRAFT })
    const result = performApprovalAction([release], 'r1', APPROVAL_ACTION.SUBMIT, '')
    expect(result.success).toBe(true)
    expect(result.record.remark).toBe('')
  })
})

describe('filterReleasesByStatus', () => {
  it('正确按状态筛选', () => {
    const releases = [
      makeRelease({ status: RELEASE_STATUS.DRAFT }),
      makeRelease({ status: RELEASE_STATUS.PUBLISHED }),
      makeRelease({ status: RELEASE_STATUS.PENDING }),
    ]
    const draft = filterReleasesByStatus(releases, RELEASE_STATUS.DRAFT)
    expect(draft.length).toBe(1)
    const all = filterReleasesByStatus(releases, 'all')
    expect(all.length).toBe(3)
    const empty = filterReleasesByStatus(releases, RELEASE_STATUS.ROLLED_BACK)
    expect(empty.length).toBe(0)
  })

  it('处理无效输入', () => {
    expect(filterReleasesByStatus(null, 'all')).toEqual([])
  })
})

describe('paginateReleases', () => {
  it('分页逻辑正确', () => {
    const items = Array.from({ length: 25 }, (_, i) => ({ id: i }))
    const page1 = paginateReleases(items, 1, 10)
    expect(page1.items.length).toBe(10)
    expect(page1.total).toBe(25)
    expect(page1.totalPage).toBe(3)
    expect(page1.currentPage).toBe(1)
    expect(page1.items[0].id).toBe(0)

    const page3 = paginateReleases(items, 3, 10)
    expect(page3.items.length).toBe(5)
    expect(page3.items[0].id).toBe(20)
  })

  it('边界处理', () => {
    const result = paginateReleases([], 1)
    expect(result.totalPage).toBe(1)
    expect(result.currentPage).toBe(1)

    const items = [{ id: 1 }]
    const invalidPage = paginateReleases(items, 99, 10)
    expect(invalidPage.currentPage).toBe(1)

    expect(paginateReleases(null, 1).items).toEqual([])
  })
})

describe('getReleaseList', () => {
  it('筛选 + 排序 + 分页组合', () => {
    const releases = [
      makeRelease({ version: 'v1.0.0', status: RELEASE_STATUS.PUBLISHED }),
      makeRelease({ version: 'v2.0.0', status: RELEASE_STATUS.DRAFT }),
      makeRelease({ version: 'v1.5.0', status: RELEASE_STATUS.PUBLISHED }),
    ]
    const result = getReleaseList(releases, { status: RELEASE_STATUS.PUBLISHED, page: 1, pageSize: 10 })
    expect(result.total).toBe(2)
    expect(result.items[0].version).toBe('v1.5.0')
    expect(result.items[1].version).toBe('v1.0.0')
  })
})

describe('getReleaseStats', () => {
  it('统计各状态数量', () => {
    const releases = [
      makeRelease({ status: RELEASE_STATUS.DRAFT }),
      makeRelease({ status: RELEASE_STATUS.DRAFT }),
      makeRelease({ status: RELEASE_STATUS.PENDING }),
      makeRelease({ status: RELEASE_STATUS.PUBLISHED }),
      makeRelease({ status: RELEASE_STATUS.ROLLED_BACK }),
    ]
    const stats = getReleaseStats(releases)
    expect(stats.total).toBe(5)
    expect(stats.draft).toBe(2)
    expect(stats.pending).toBe(1)
    expect(stats.published).toBe(1)
    expect(stats.rolled_back).toBe(1)
  })

  it('处理无效输入', () => {
    const stats = getReleaseStats(null)
    expect(stats.total).toBe(0)
  })
})

describe('getApprovalTimeline', () => {
  it('按时间倒序排列', () => {
    const release = makeRelease({
      approvalRecords: [
        { id: 'a1', timestamp: 100 },
        { id: 'a2', timestamp: 300 },
        { id: 'a3', timestamp: 200 },
      ],
    })
    const timeline = getApprovalTimeline(release)
    expect(timeline[0].timestamp).toBe(300)
    expect(timeline[1].timestamp).toBe(200)
    expect(timeline[2].timestamp).toBe(100)
  })

  it('无效输入返回空数组', () => {
    expect(getApprovalTimeline(null)).toEqual([])
  })
})

describe('splitLines', () => {
  it('按换行分割', () => {
    expect(splitLines('a\nb\nc')).toEqual(['a', 'b', 'c'])
    expect(splitLines('')).toEqual([])
    expect(splitLines(null)).toEqual([])
    expect(splitLines(123)).toEqual([])
    expect(splitLines('single')).toEqual(['single'])
  })
})

describe('computeLCSMatrix', () => {
  it('计算正确的 LCS 矩阵', () => {
    const arr1 = ['a', 'b', 'c']
    const arr2 = ['a', 'c']
    const dp = computeLCSMatrix(arr1, arr2)
    expect(dp[3][2]).toBe(2)
    expect(dp[0][0]).toBe(0)
  })
})

describe('computeLineDiff / mergeModifiedLines', () => {
  it('计算正确的行差异', () => {
    const oldText = 'line1\nline2\nline3'
    const newText = 'line1\nmodified\nline3\nnewline'
    const diff = computeLineDiff(oldText, newText)
    expect(diff.length).toBeGreaterThan(0)
    const types = diff.map((d) => d.type)
    expect(types).toContain(DIFF_TYPE_INTERNAL.EQUAL)
    expect(types).toContain(DIFF_TYPE_INTERNAL.REMOVED)
    expect(types).toContain(DIFF_TYPE_INTERNAL.ADDED)
  })

  it('合并修改行', () => {
    const lineDiff = [
      { type: DIFF_TYPE_INTERNAL.REMOVED, oldLine: 'a' },
      { type: DIFF_TYPE_INTERNAL.ADDED, newLine: 'b' },
    ]
    const merged = mergeModifiedLines(lineDiff)
    expect(merged.length).toBe(1)
    expect(merged[0].type).toBe(DIFF_TYPE_INTERNAL.MODIFIED)
    expect(merged[0].oldLine).toBe('a')
    expect(merged[0].newLine).toBe('b')
  })

  it('不合并非相邻的删除添加', () => {
    const lineDiff = [
      { type: DIFF_TYPE_INTERNAL.REMOVED, oldLine: 'a' },
      { type: DIFF_TYPE_INTERNAL.EQUAL, oldLine: 'b' },
      { type: DIFF_TYPE_INTERNAL.ADDED, newLine: 'c' },
    ]
    const merged = mergeModifiedLines(lineDiff)
    expect(merged.length).toBe(3)
  })
})

describe('buildReleaseDiff', () => {
  it('构建左右分栏 diff', () => {
    const diff = buildReleaseDiff('a\nb', 'a\nc')
    expect(diff.leftRows.length).toBeGreaterThan(0)
    expect(diff.rightRows.length).toBeGreaterThan(0)
    expect(diff.lineDiff.length).toBeGreaterThan(0)
  })

  it('处理空文本', () => {
    const diff = buildReleaseDiff('', '')
    expect(diff.leftRows.length).toBe(0)
    expect(diff.rightRows.length).toBe(0)
    expect(diff.lineDiff.length).toBe(0)
  })
})

describe('getDiffStats', () => {
  it('统计正确的差异类型', () => {
    const lineDiff = [
      { type: DIFF_TYPE_INTERNAL.EQUAL },
      { type: DIFF_TYPE_INTERNAL.ADDED },
      { type: DIFF_TYPE_INTERNAL.ADDED },
      { type: DIFF_TYPE_INTERNAL.REMOVED },
      { type: DIFF_TYPE_INTERNAL.MODIFIED },
    ]
    const stats = getDiffStats(lineDiff)
    expect(stats.equal).toBe(1)
    expect(stats.added).toBe(2)
    expect(stats.removed).toBe(1)
    expect(stats.modified).toBe(1)
  })

  it('处理无效输入', () => {
    const stats = getDiffStats(null)
    expect(stats).toEqual({ added: 0, removed: 0, modified: 0, equal: 0 })
  })
})

describe('isDiffTooLarge', () => {
  it('短文本不超限', () => {
    const text = 'line1\nline2\nline3'
    expect(isDiffTooLarge(text, text)).toBe(false)
  })

  it('空文本不超限', () => {
    expect(isDiffTooLarge('', '')).toBe(false)
    expect(isDiffTooLarge(null, undefined)).toBe(false)
  })

  it('超过默认最大行数返回 true', () => {
    const lines = Array.from({ length: MAX_DIFF_LINES + 10 }, (_, i) => `line ${i + 1}`)
    const longText = lines.join('\n')
    expect(isDiffTooLarge(longText, '')).toBe(true)
    expect(isDiffTooLarge('', longText)).toBe(true)
  })

  it('两个都超限时返回 true', () => {
    const lines = Array.from({ length: MAX_DIFF_LINES + 50 }, (_, i) => `line ${i + 1}`)
    const longText = lines.join('\n')
    expect(isDiffTooLarge(longText, longText)).toBe(true)
  })

  it('支持自定义 maxLines 参数', () => {
    const text = 'a\nb\nc\nd\ne'
    expect(isDiffTooLarge(text, text, 3)).toBe(true)
    expect(isDiffTooLarge(text, text, 10)).toBe(false)
  })

  it('单行刚好在限值内返回 false', () => {
    const lines = Array.from({ length: MAX_DIFF_LINES }, (_, i) => `line ${i + 1}`)
    const text = lines.join('\n')
    expect(isDiffTooLarge(text, text)).toBe(false)
  })
})

describe('truncateTextForDiff', () => {
  it('短文本不截断', () => {
    const text = 'line1\nline2'
    expect(truncateTextForDiff(text)).toBe(text)
  })

  it('空字符串返回空', () => {
    expect(truncateTextForDiff('')).toBe('')
  })

  it('非字符串返回空字符串', () => {
    expect(truncateTextForDiff(null)).toBe('')
    expect(truncateTextForDiff(undefined)).toBe('')
    expect(truncateTextForDiff(123)).toBe('')
  })

  it('超长文本截断并添加提示', () => {
    const lines = Array.from({ length: MAX_DIFF_LINES + 10 }, (_, i) => `line ${i + 1}`)
    const longText = lines.join('\n')
    const result = truncateTextForDiff(longText)
    expect(result).toContain('... (已截断')
    expect(result).toContain(`原文共 ${MAX_DIFF_LINES + 10} 行`)
    expect(result).toContain(`仅显示前 ${MAX_DIFF_LINES} 行`)
    expect(result.split('\n').length).toBeLessThan(MAX_DIFF_LINES + 5)
  })

  it('支持自定义 maxLines', () => {
    const text = 'a\nb\nc\nd\ne'
    const result = truncateTextForDiff(text, 3)
    expect(result).toContain('原文共 5 行')
    expect(result).toContain('仅显示前 3 行')
    expect(result.split('\n')[0]).toBe('a')
    expect(result.split('\n')[2]).toBe('c')
  })

  it('刚好在限值内不截断', () => {
    const lines = Array.from({ length: MAX_DIFF_LINES }, (_, i) => `line ${i + 1}`)
    const text = lines.join('\n')
    expect(truncateTextForDiff(text)).toBe(text)
  })
})

describe('formatDate / formatDateOnly', () => {
  it('正确格式化时间戳', () => {
    const ts = new Date('2024-06-15T14:30:00').getTime()
    expect(formatDate(ts)).toContain('2024-06-15')
    expect(formatDate(ts)).toContain('14:30')
    expect(formatDateOnly(ts)).toBe('2024-06-15')
  })

  it('处理无效输入', () => {
    expect(formatDate(null)).toBe('')
    expect(formatDate(undefined)).toBe('')
    expect(formatDate('')).toBe('')
    expect(formatDateOnly(null)).toBe('')
    expect(formatDateOnly('invalid')).toBe('')
  })
})

describe('getTimelineColor', () => {
  it('返回正确颜色', () => {
    expect(getTimelineColor(RELEASE_STATUS.PUBLISHED, APPROVAL_ACTION.APPROVE)).toBe('#10b981')
    expect(getTimelineColor(RELEASE_STATUS.ROLLED_BACK, APPROVAL_ACTION.ROLLBACK)).toBe('#f97316')
    expect(getTimelineColor(RELEASE_STATUS.DRAFT, APPROVAL_ACTION.REJECT)).toBe('#ef4444')
    expect(typeof getTimelineColor(RELEASE_STATUS.PENDING, APPROVAL_ACTION.SUBMIT)).toBe('string')
  })
})

describe('simpleMarkdownToHtml', () => {
  it('转换标题', () => {
    const html = simpleMarkdownToHtml('# 一级标题\n## 二级标题')
    expect(html).toContain('<h1>一级标题</h1>')
    expect(html).toContain('<h2>二级标题</h2>')
  })

  it('转换强调', () => {
    const html = simpleMarkdownToHtml('**粗体** *斜体* `code`')
    expect(html).toContain('<strong>粗体</strong>')
    expect(html).toContain('<em>斜体</em>')
    expect(html).toContain('<code>code</code>')
  })

  it('处理空字符串', () => {
    expect(simpleMarkdownToHtml('')).toBe('')
    expect(simpleMarkdownToHtml(null)).toBe('')
    expect(simpleMarkdownToHtml(undefined)).toBe('')
  })

  it('转义 HTML 特殊字符', () => {
    const html = simpleMarkdownToHtml('<script>alert(1)</script>')
    expect(html).not.toContain('<script>')
    expect(html).toContain('&lt;script&gt;')
  })
})
