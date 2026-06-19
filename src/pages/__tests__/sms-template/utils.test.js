import { describe, it, expect, beforeEach } from 'vitest'
import {
  isChineseChar,
  getVariableInfo,
  getVariableSampleLength,
  getVariableSampleValue,
  extractVariables,
  validateVariableFormat,
  calculateCharCount,
  getSmsLengthWarning,
  canSaveTemplate,
  replaceVariables,
  getContentSummary,
  canTransitionStatus,
  getStatusCapabilities,
  transitionStatus,
  searchItems,
  filterTemplatesByGroup,
  sortTemplates,
  hasTemplatesInGroup,
  isGroupNameDuplicate,
  createGroup,
  renameGroup,
  deleteGroup,
  validateTemplateTitle,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  createRevision,
  ensureGroupExists,
  validateImportTemplate,
  importTemplates,
  exportTemplatesToJSON,
  parseImportJSON,
  buildPreviewContent,
  generateId,
  formatDateTime,
} from '../../sms-template/utils.js'
import {
  TEMPLATE_STATUS,
  PRESET_VARIABLES,
  MAX_SMS_LENGTH,
  SINGLE_SMS_THRESHOLD,
  MAX_REJECT_REASON_LENGTH,
  SUMMARY_MAX_LENGTH,
  PRESET_GROUPS,
  DEFAULT_SIGNATURE,
} from '../../sms-template/constants.js'

describe('基础工具函数', () => {
  describe('generateId', () => {
    it('应该生成带前缀的唯一ID', () => {
      const id1 = generateId('tpl')
      const id2 = generateId('group')
      expect(id1.startsWith('tpl-')).toBe(true)
      expect(id2.startsWith('group-')).toBe(true)
      expect(id1).not.toBe(id2)
    })

    it('不传前缀时应使用默认前缀', () => {
      const id = generateId()
      expect(id.startsWith('id-')).toBe(true)
    })

    it('连续调用应生成不同ID', () => {
      const ids = new Set()
      for (let i = 0; i < 100; i++) {
        ids.add(generateId())
      }
      expect(ids.size).toBe(100)
    })
  })

  describe('formatDateTime', () => {
    it('应该正确格式化时间戳', () => {
      const result = formatDateTime(1704067200000)
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/)
    })

    it('空时间戳应返回空字符串', () => {
      expect(formatDateTime(null)).toBe('')
      expect(formatDateTime(undefined)).toBe('')
    })
  })

  describe('isChineseChar', () => {
    it('应该正确识别中文字符', () => {
      expect(isChineseChar('你')).toBe(true)
      expect(isChineseChar('好')).toBe(true)
    })

    it('应该正确识别非中文字符', () => {
      expect(isChineseChar('A')).toBe(false)
      expect(isChineseChar('1')).toBe(false)
      expect(isChineseChar(',')).toBe(false)
      expect(isChineseChar(' ')).toBe(false)
    })
  })
})

describe('变量解析相关函数', () => {
  describe('getVariableInfo', () => {
    it('应该正确获取预设变量信息', () => {
      const info = getVariableInfo('验证码')
      expect(info).not.toBeUndefined()
      expect(info.name).toBe('验证码')
      expect(info.placeholder).toBe('{验证码}')
      expect(info.sampleValue).toBe('123456')
    })

    it('不存在的变量应返回undefined', () => {
      expect(getVariableInfo('不存在的变量')).toBeUndefined()
    })
  })

  describe('getVariableSampleLength', () => {
    it('预设变量应返回预定义长度', () => {
      expect(getVariableSampleLength('验证码')).toBe(6)
      expect(getVariableSampleLength('用户名')).toBe(2)
    })

    it('非预设变量应返回变量名长度', () => {
      expect(getVariableSampleLength('自定义变量')).toBe(5)
    })
  })

  describe('getVariableSampleValue', () => {
    it('预设变量应返回默认示例值', () => {
      expect(getVariableSampleValue('验证码')).toBe('123456')
      expect(getVariableSampleValue('用户名')).toBe('张三')
    })

    it('应优先使用自定义示例值', () => {
      const custom = { 验证码: '654321', 用户名: '李四' }
      expect(getVariableSampleValue('验证码', custom)).toBe('654321')
      expect(getVariableSampleValue('用户名', custom)).toBe('李四')
    })

    it('不存在的变量应返回空字符串', () => {
      expect(getVariableSampleValue('xyz')).toBe('')
    })
  })

  describe('extractVariables', () => {
    it('应该正确提取所有变量名', () => {
      const content = '尊敬的{用户名}，您的验证码为{验证码}，有效期{有效期}。'
      const vars = extractVariables(content)
      expect(vars).toEqual(['用户名', '验证码', '有效期'])
    })

    it('应忽略重复变量', () => {
      const content = '{用户名}你好，{用户名}欢迎回来'
      const vars = extractVariables(content)
      expect(vars).toEqual(['用户名'])
    })

    it('无变量时应返回空数组', () => {
      expect(extractVariables('普通文本')).toEqual([])
      expect(extractVariables('')).toEqual([])
      expect(extractVariables(null)).toEqual([])
      expect(extractVariables(undefined)).toEqual([])
    })

    it('应自动trim变量名空白', () => {
      const content = '{ 用户名 }您好'
      const vars = extractVariables(content)
      expect(vars).toEqual(['用户名'])
    })
  })

  describe('validateVariableFormat', () => {
    it('正确的变量格式应通过验证', () => {
      const result = validateVariableFormat('{用户名}您好')
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('空内容应通过验证', () => {
      const result = validateVariableFormat('')
      expect(result.valid).toBe(true)
    })

    it('括号不匹配应报错', () => {
      const result1 = validateVariableFormat('{用户名您好')
      expect(result1.valid).toBe(false)
      expect(result1.errors.length).toBeGreaterThan(0)

      const result2 = validateVariableFormat('用户名}您好')
      expect(result2.valid).toBe(false)
    })

    it('空变量名应报错', () => {
      const result = validateVariableFormat('{}您好')
      expect(result.valid).toBe(false)
      expect(result.errors.some((e) => e.includes('空变量'))).toBe(true)
    })
  })
})

describe('字数统计与计费相关函数', () => {
  describe('calculateCharCount', () => {
    it('普通中文文本应正确计数', () => {
      const result = calculateCharCount('您好世界')
      expect(result.totalChars).toBe(4)
      expect(result.billingChars).toBe(4)
      expect(result.variableCount).toBe(0)
    })

    it('包含变量时应按示例长度计费', () => {
      const result = calculateCharCount('{验证码}')
      expect(result.totalChars).toBe(5)
      expect(result.billingChars).toBe(6)
      expect(result.variableCount).toBe(1)
    })

    it('混合内容应正确统计', () => {
      const content = '尊敬的{用户名}，您的验证码为{验证码}。'
      const result = calculateCharCount(content)
      expect(result.totalChars).toBe(content.length)
      expect(result.billingChars).toBe(3 + 2 + 1 + 6 + 6 + 1)
      expect(result.variableCount).toBe(2)
    })

    it('括号不计入计费字数', () => {
      const content = '{a}{b}'
      const result = calculateCharCount(content)
      expect(result.billingChars).toBe(2)
    })

    it('空内容应全为0', () => {
      const result = calculateCharCount('')
      expect(result.totalChars).toBe(0)
      expect(result.billingChars).toBe(0)
      expect(result.variableCount).toBe(0)
    })
  })

  describe('getSmsLengthWarning', () => {
    it('70字内应为success级别', () => {
      const result = getSmsLengthWarning(50)
      expect(result.level).toBe('success')
    })

    it('超过70字应为warning级别', () => {
      const result = getSmsLengthWarning(100)
      expect(result.level).toBe('warning')
      expect(result.message).toContain('多条计费')
    })

    it('超过500字应为error级别', () => {
      const result = getSmsLengthWarning(501)
      expect(result.level).toBe('error')
      expect(result.message).toContain('无法保存')
    })
  })

  describe('canSaveTemplate', () => {
    it('500字以内应可以保存', () => {
      expect(canSaveTemplate(500)).toBe(true)
      expect(canSaveTemplate(0)).toBe(true)
    })

    it('超过500字不可保存', () => {
      expect(canSaveTemplate(501)).toBe(false)
    })
  })
})

describe('变量替换与预览相关函数', () => {
  describe('replaceVariables', () => {
    it('应正确替换所有变量', () => {
      const content = '尊敬的{用户名}，验证码{验证码}'
      const result = replaceVariables(content, { 用户名: '李四', 验证码: '8888' })
      expect(result).toBe('尊敬的李四，验证码8888')
    })

    it('无自定义值时应使用默认值', () => {
      const content = '{用户名},{验证码}'
      const result = replaceVariables(content)
      expect(result).toBe('张三,123456')
    })

    it('空内容应返回空字符串', () => {
      expect(replaceVariables('')).toBe('')
      expect(replaceVariables(null)).toBe('')
    })
  })

  describe('getContentSummary', () => {
    it('短内容应原样返回', () => {
      const summary = getContentSummary('您好', 30)
      expect(summary).toBe('您好')
    })

    it('超过长度应截断并加省略号', () => {
      const long = 'a'.repeat(100)
      const summary = getContentSummary(long, 30)
      expect(summary.length).toBe(33)
      expect(summary.endsWith('...')).toBe(true)
    })

    it('变量占位符应先替换再截断', () => {
      const content = '尊敬的{用户名}您好'
      const summary = getContentSummary(content, 10)
      expect(summary).not.toContain('{')
      expect(summary).toContain('张三')
    })

    it('默认长度应为SUMMARY_MAX_LENGTH', () => {
      const summary = getContentSummary('a'.repeat(SUMMARY_MAX_LENGTH + 10))
      expect(summary.endsWith('...')).toBe(true)
    })
  })

  describe('buildPreviewContent', () => {
    it('应包含签名和替换后的内容', () => {
      const template = {
        signature: '【测试】',
        content: '尊敬的{用户名}',
      }
      const preview = buildPreviewContent(template)
      expect(preview.startsWith('【测试】')).toBe(true)
      expect(preview).toContain('张三')
      expect(preview).not.toContain('{用户名}')
    })

    it('无签名时应使用默认签名', () => {
      const template = { content: '测试内容' }
      const preview = buildPreviewContent(template)
      expect(preview.startsWith(DEFAULT_SIGNATURE)).toBe(true)
    })
  })
})

describe('审核状态流转', () => {
  describe('canTransitionStatus', () => {
    it('草稿应可以提交审核', () => {
      expect(canTransitionStatus(TEMPLATE_STATUS.DRAFT, 'canSubmit')).toBe(true)
    })

    it('草稿不可审核通过', () => {
      expect(canTransitionStatus(TEMPLATE_STATUS.DRAFT, 'canApprove')).toBe(false)
    })

    it('待审核应可以通过/驳回', () => {
      expect(canTransitionStatus(TEMPLATE_STATUS.PENDING, 'canApprove')).toBe(true)
      expect(canTransitionStatus(TEMPLATE_STATUS.PENDING, 'canReject')).toBe(true)
    })

    it('已通过应不可直接编辑', () => {
      expect(canTransitionStatus(TEMPLATE_STATUS.APPROVED, 'canSubmit')).toBe(false)
    })

    it('已通过应可以创建修订版', () => {
      expect(canTransitionStatus(TEMPLATE_STATUS.APPROVED, 'canCreateRevision')).toBe(true)
    })

    it('已驳回应可以重新提交', () => {
      expect(canTransitionStatus(TEMPLATE_STATUS.REJECTED, 'canSubmit')).toBe(true)
    })
  })

  describe('getStatusCapabilities', () => {
    it('应返回完整的能力对象', () => {
      const caps = getStatusCapabilities(TEMPLATE_STATUS.DRAFT)
      expect(caps).toHaveProperty('canSubmit')
      expect(caps).toHaveProperty('canEdit')
      expect(caps).toHaveProperty('canDelete')
    })

    it('无效状态应返回全部false的默认对象', () => {
      const caps = getStatusCapabilities('invalid')
      expect(caps.canSubmit).toBe(false)
      expect(caps.canEdit).toBe(false)
    })
  })

  describe('transitionStatus', () => {
    it('草稿提交审核应变为待审核', () => {
      const tpl = { status: TEMPLATE_STATUS.DRAFT, updatedAt: 0 }
      const result = transitionStatus(tpl, 'canSubmit')
      expect(result.status).toBe(TEMPLATE_STATUS.PENDING)
      expect(result.updatedAt).toBeGreaterThan(0)
    })

    it('待审核通过应变为已通过', () => {
      const tpl = { status: TEMPLATE_STATUS.PENDING, updatedAt: 0 }
      const result = transitionStatus(tpl, 'canApprove')
      expect(result.status).toBe(TEMPLATE_STATUS.APPROVED)
    })

    it('待审核驳回需要原因', () => {
      const tpl = { status: TEMPLATE_STATUS.PENDING, updatedAt: 0 }
      const noReason = transitionStatus(tpl, 'canReject')
      expect(noReason.status).toBe(TEMPLATE_STATUS.PENDING)

      const withReason = transitionStatus(tpl, 'canReject', { rejectReason: '内容不规范' })
      expect(withReason.status).toBe(TEMPLATE_STATUS.REJECTED)
      expect(withReason.rejectReason).toBe('内容不规范')
    })

    it('驳回原因超过长度应不通过', () => {
      const tpl = { status: TEMPLATE_STATUS.PENDING }
      const longReason = 'x'.repeat(MAX_REJECT_REASON_LENGTH + 1)
      const result = transitionStatus(tpl, 'canReject', { rejectReason: longReason })
      expect(result.status).toBe(TEMPLATE_STATUS.PENDING)
    })

    it('不允许的操作应保持原状态', () => {
      const tpl = { status: TEMPLATE_STATUS.APPROVED }
      const result = transitionStatus(tpl, 'canSubmit')
      expect(result.status).toBe(TEMPLATE_STATUS.APPROVED)
    })
  })
})

describe('搜索与过滤函数', () => {
  describe('searchItems', () => {
    const items = [
      { id: 1, name: '验证码类', title: '模板一' },
      { id: 2, name: '通知类', title: '订单通知' },
      { id: 3, name: '营销类', title: '促销通知' },
    ]

    it('应根据指定字段搜索', () => {
      const result = searchItems(items, '验证码', ['name'])
      expect(result.length).toBe(1)
      expect(result[0].id).toBe(1)
    })

    it('空关键词应返回全部', () => {
      const result = searchItems(items, '', ['name'])
      expect(result.length).toBe(3)
    })

    it('应支持多字段搜索', () => {
      const result = searchItems(items, '通知', ['name', 'title'])
      expect(result.length).toBe(2)
    })

    it('搜索应不区分大小写', () => {
      const result = searchItems([{ title: 'Hello' }], 'hello', ['title'])
      expect(result.length).toBe(1)
    })

    it('非数组输入应返回空数组', () => {
      expect(searchItems(null, 'x')).toEqual([])
    })
  })

  describe('filterTemplatesByGroup', () => {
    const templates = [
      { id: 1, groupId: 'g1' },
      { id: 2, groupId: 'g2' },
      { id: 3, groupId: 'g1' },
    ]

    it('应正确按组过滤', () => {
      const result = filterTemplatesByGroup(templates, 'g1')
      expect(result.length).toBe(2)
      result.forEach((t) => expect(t.groupId).toBe('g1'))
    })

    it('无groupId应返回全部', () => {
      expect(filterTemplatesByGroup(templates, null).length).toBe(3)
    })
  })

  describe('sortTemplates', () => {
    const templates = [
      { id: 1, updatedAt: 100, createdAt: 50 },
      { id: 2, updatedAt: 300, createdAt: 200 },
      { id: 3, updatedAt: 200, createdAt: 300 },
    ]

    it('应按updatedAt降序排列', () => {
      const result = sortTemplates(templates, 'updatedAt')
      expect(result[0].id).toBe(2)
      expect(result[1].id).toBe(3)
      expect(result[2].id).toBe(1)
    })

    it('应返回新数组不修改原数组', () => {
      const copy = [...templates]
      sortTemplates(templates)
      expect(templates).toEqual(copy)
    })
  })
})

describe('分组管理函数', () => {
  const baseGroups = [
    { id: 'g1', name: '验证码类', isPreset: true },
    { id: 'g2', name: '通知类', isPreset: false },
  ]

  describe('hasTemplatesInGroup', () => {
    it('有模板时应返回true', () => {
      const templates = [{ groupId: 'g1' }]
      expect(hasTemplatesInGroup(templates, 'g1')).toBe(true)
    })

    it('无模板时应返回false', () => {
      expect(hasTemplatesInGroup([{ groupId: 'g2' }], 'g1')).toBe(false)
    })
  })

  describe('isGroupNameDuplicate', () => {
    it('重复名称应返回true', () => {
      expect(isGroupNameDuplicate(baseGroups, '验证码类')).toBe(true)
    })

    it('不重复名称应返回false', () => {
      expect(isGroupNameDuplicate(baseGroups, '新分组')).toBe(false)
    })

    it('应忽略空白字符', () => {
      expect(isGroupNameDuplicate(baseGroups, '  验证码类  ')).toBe(true)
    })

    it('excludeId应排除指定分组', () => {
      expect(isGroupNameDuplicate(baseGroups, '验证码类', 'g1')).toBe(false)
    })
  })

  describe('createGroup', () => {
    it('应成功创建新分组', () => {
      const result = createGroup(baseGroups, '新分组')
      expect(result.success).toBe(true)
      expect(result.groups.length).toBe(baseGroups.length + 1)
      expect(result.group.name).toBe('新分组')
      expect(result.group.isPreset).toBe(false)
    })

    it('空名称应失败', () => {
      const result = createGroup(baseGroups, '')
      expect(result.success).toBe(false)
    })

    it('重名应失败', () => {
      const result = createGroup(baseGroups, '验证码类')
      expect(result.success).toBe(false)
      expect(result.error).toContain('已存在')
    })
  })

  describe('renameGroup', () => {
    it('应成功重命名非预设分组', () => {
      const result = renameGroup(baseGroups, 'g2', '通知类改名')
      expect(result.success).toBe(true)
      expect(result.groups.find((g) => g.id === 'g2').name).toBe('通知类改名')
    })

    it('预设分组不可重命名', () => {
      const result = renameGroup(baseGroups, 'g1', '验证码2')
      expect(result.success).toBe(false)
      expect(result.error).toContain('预设')
    })

    it('不存在的分组应失败', () => {
      const result = renameGroup(baseGroups, 'not-exist', 'name')
      expect(result.success).toBe(false)
    })
  })

  describe('deleteGroup', () => {
    it('应成功删除空的非预设分组', () => {
      const result = deleteGroup(baseGroups, [], 'g2')
      expect(result.success).toBe(true)
      expect(result.groups.length).toBe(baseGroups.length - 1)
    })

    it('预设分组不可删除', () => {
      const result = deleteGroup(baseGroups, [], 'g1')
      expect(result.success).toBe(false)
    })

    it('有模板的分组不可删除', () => {
      const templates = [{ groupId: 'g2' }]
      const result = deleteGroup(baseGroups, templates, 'g2')
      expect(result.success).toBe(false)
      expect(result.error).toContain('模板')
    })
  })
})

describe('模板CRUD函数', () => {
  describe('validateTemplateTitle', () => {
    it('空标题应不通过', () => {
      const result = validateTemplateTitle([], '')
      expect(result.valid).toBe(false)
    })

    it('重复标题应不通过', () => {
      const templates = [{ title: '测试' }]
      const result = validateTemplateTitle(templates, '测试')
      expect(result.valid).toBe(false)
      expect(result.error).toContain('已存在')
    })

    it('excludeId时应允许相同标题', () => {
      const templates = [{ id: 't1', title: '测试' }]
      const result = validateTemplateTitle(templates, '测试', 't1')
      expect(result.valid).toBe(true)
    })
  })

  describe('createTemplate', () => {
    it('应成功创建模板', () => {
      const data = {
        title: '新模板',
        content: '测试内容{验证码}',
        groupId: 'g1',
      }
      const result = createTemplate([], data)
      expect(result.success).toBe(true)
      expect(result.template.title).toBe('新模板')
      expect(result.template.status).toBe(TEMPLATE_STATUS.DRAFT)
      expect(result.template.variables).toEqual(['验证码'])
    })

    it('超字数应拒绝创建', () => {
      const data = {
        title: '超长模板',
        content: 'a'.repeat(MAX_SMS_LENGTH + 1),
        groupId: 'g1',
      }
      const result = createTemplate([], data)
      expect(result.success).toBe(false)
    })
  })

  describe('updateTemplate', () => {
    it('草稿状态应可以更新', () => {
      const templates = [
        { id: 't1', status: TEMPLATE_STATUS.DRAFT, title: '原标题', content: '原内容', variables: [], updatedAt: 0 },
      ]
      const result = updateTemplate(templates, 't1', { title: '新标题', content: '新内容{验证码}' })
      expect(result.success).toBe(true)
      expect(result.template.title).toBe('新标题')
      expect(result.template.variables).toEqual(['验证码'])
    })

    it('已通过状态不可直接编辑', () => {
      const templates = [
        { id: 't1', status: TEMPLATE_STATUS.APPROVED, title: '原标题', content: '原内容', variables: [] },
      ]
      const result = updateTemplate(templates, 't1', { title: '新标题' })
      expect(result.success).toBe(false)
      expect(result.error).toContain('不允许编辑')
    })
  })

  describe('deleteTemplate', () => {
    it('应可以删除草稿模板', () => {
      const templates = [{ id: 't1', status: TEMPLATE_STATUS.DRAFT }]
      const result = deleteTemplate(templates, 't1')
      expect(result.success).toBe(true)
      expect(result.templates.length).toBe(0)
    })

    it('应可以删除已通过模板', () => {
      const templates = [{ id: 't1', status: TEMPLATE_STATUS.APPROVED }]
      const result = deleteTemplate(templates, 't1')
      expect(result.success).toBe(true)
    })
  })

  describe('createRevision', () => {
    it('已通过模板应可创建修订版', () => {
      const original = {
        id: 't1',
        title: '原模板',
        content: '内容',
        status: TEMPLATE_STATUS.APPROVED,
        version: 1,
      }
      const result = createRevision([original], 't1')
      expect(result.success).toBe(true)
      expect(result.templates.length).toBe(2)
      expect(result.template.status).toBe(TEMPLATE_STATUS.DRAFT)
      expect(result.template.revisionOf).toBe('t1')
      expect(result.template.version).toBe(2)
    })

    it('草稿不可创建修订版', () => {
      const original = { id: 't1', status: TEMPLATE_STATUS.DRAFT }
      const result = createRevision([original], 't1')
      expect(result.success).toBe(false)
    })
  })
})

describe('导入导出相关函数', () => {
  describe('ensureGroupExists', () => {
    it('已存在的分组应返回原ID', () => {
      const groups = [{ id: 'g1', name: '验证码类' }]
      const result = ensureGroupExists(groups, '验证码类')
      expect(result.groupId).toBe('g1')
      expect(result.groups.length).toBe(1)
    })

    it('不存在的分组应自动创建', () => {
      const result = ensureGroupExists([], '新分组')
      expect(result.groupId).not.toBeNull()
      expect(result.groups.length).toBe(1)
      expect(result.groups[0].name).toBe('新分组')
    })

    it('空名称应返回null', () => {
      const result = ensureGroupExists([], '')
      expect(result.groupId).toBeNull()
    })
  })

  describe('validateImportTemplate', () => {
    it('完整数据应通过校验', () => {
      const tpl = {
        title: '导入模板',
        content: '内容{验证码}',
        status: TEMPLATE_STATUS.DRAFT,
      }
      const result = validateImportTemplate(tpl, [])
      expect(result.valid).toBe(true)
    })

    it('空标题应不通过', () => {
      const result = validateImportTemplate({ title: '' }, [])
      expect(result.valid).toBe(false)
    })

    it('重复标题应不通过', () => {
      const existing = [{ title: '已存在' }]
      const result = validateImportTemplate({ title: '已存在', content: '' }, existing)
      expect(result.valid).toBe(false)
    })

    it('无效状态应不通过', () => {
      const result = validateImportTemplate({ title: 't', content: '', status: 'invalid' }, [])
      expect(result.valid).toBe(false)
    })
  })

  describe('importTemplates', () => {
    it('应成功导入合法模板', () => {
      const importData = [
        { title: '导入1', content: '内容1', group: '验证码类' },
        { title: '导入2', content: '内容2', group: '新分组' },
      ]
      const result = importTemplates([], [], importData)
      expect(result.success.length).toBe(2)
      expect(result.skipped.length).toBe(0)
      expect(result.groups.length).toBeGreaterThanOrEqual(2)
    })

    it('应跳过重复或非法模板', () => {
      const existing = [{ title: '已存在', content: '' }]
      const importData = [
        { title: '已存在', content: '' },
        { title: '', content: '' },
        { title: '合法模板', content: '内容' },
      ]
      const result = importTemplates([], existing, importData)
      expect(result.success.length).toBe(1)
      expect(result.skipped.length).toBe(2)
    })
  })

  describe('exportTemplatesToJSON', () => {
    const groups = [{ id: 'g1', name: '测试组' }]
    const templates = [
      { id: 't1', title: 'T1', content: 'C1', groupId: 'g1', variables: ['a'], status: TEMPLATE_STATUS.DRAFT },
    ]

    it('应导出正确的JSON字符串', () => {
      const json = exportTemplatesToJSON(templates, groups)
      const parsed = JSON.parse(json)
      expect(parsed.templates.length).toBe(1)
      expect(parsed.templates[0].title).toBe('T1')
      expect(parsed.groups.length).toBe(1)
    })

    it('应支持按分组导出', () => {
      const json = exportTemplatesToJSON(templates, groups, { groupId: 'g1' })
      const parsed = JSON.parse(json)
      expect(parsed.templates.length).toBe(1)
    })

    it('应支持按指定ID导出', () => {
      const json = exportTemplatesToJSON(templates, groups, { selectedIds: ['t1'] })
      const parsed = JSON.parse(json)
      expect(parsed.templates.length).toBe(1)
    })
  })

  describe('parseImportJSON', () => {
    it('应正确解析数组格式', () => {
      const arr = [{ title: 't1' }, { title: 't2' }]
      const result = parseImportJSON(JSON.stringify(arr))
      expect(result.success).toBe(true)
      expect(result.data.length).toBe(2)
    })

    it('应正确解析带templates字段的对象', () => {
      const obj = { templates: [{ title: 't1' }] }
      const result = parseImportJSON(JSON.stringify(obj))
 expect(result.success).toBe(true)
      expect(result.data.length).toBe(1)
    })

    it('应正确解析单个模板对象', () => {
      const obj = { title: 't1', content: 'c1' }
      const result = parseImportJSON(JSON.stringify(obj))
      expect(result.success).toBe(true)
      expect(result.data.length).toBe(1)
    })

    it('非法JSON应返回错误', () => {
      const result = parseImportJSON('not valid json')
      expect(result.success).toBe(false)
    })

    it('无法识别的结构应返回错误', () => {
      const result = parseImportJSON(JSON.stringify({ foo: 'bar' }))
      expect(result.success).toBe(false)
    })
  })
})
