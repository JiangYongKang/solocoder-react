import { describe, it, expect, vi } from 'vitest'
import {
  getWeekNumber,
  getWeekKey,
  formatWeekLabel,
  getWeekDateRange,
  createEmptyReport,
  getTemplateContent,
  assembleReportText,
  generateEmailSubject,
  getSummaryPreview,
  createReportRecord,
  upsertReport,
  sortReportsByDate,
  findReportByWeekKey,
  extractReportFields,
  isReportEmpty
} from '../../weekly-report/utils.js'
import { TEMPLATES, FIELD_SUMMARY, FIELD_PLAN, FIELD_PROBLEMS } from '../../weekly-report/constants.js'

describe('周次计算', () => {
  describe('getWeekNumber', () => {
    it('应该正确计算 2024年1月1日（周一）为第1周', () => {
      const date = new Date(2024, 0, 1)
      expect(getWeekNumber(date)).toBe(1)
    })

    it('应该正确计算 2024年1月7日为第1周', () => {
      const date = new Date(2024, 0, 7)
      expect(getWeekNumber(date)).toBe(1)
    })

    it('应该正确计算 2024年1月8日为第2周', () => {
      const date = new Date(2024, 0, 8)
      expect(getWeekNumber(date)).toBe(2)
    })

    it('应该正确计算 2024年12月31日为第1周（下一年）', () => {
      const date = new Date(2024, 11, 31)
      expect(getWeekNumber(date)).toBe(1)
    })
  })

  describe('getWeekKey', () => {
    it('应该生成格式为 YYYY-WXX 的周标识', () => {
      const date = new Date(2024, 0, 15)
      expect(getWeekKey(date)).toBe('2024-W03')
    })

    it('应该对周数不足两位时补零', () => {
      const date = new Date(2024, 0, 3)
      expect(getWeekKey(date)).toBe('2024-W01')
    })
  })

  describe('formatWeekLabel', () => {
    it('应该生成中文周次标签', () => {
      const date = new Date(2024, 0, 15)
      expect(formatWeekLabel(date)).toBe('2024年第3周')
    })
  })

  describe('getWeekDateRange', () => {
    it('应该返回周一到周日的日期范围（周中某一天）', () => {
      const date = new Date(2024, 0, 17)
      const range = getWeekDateRange(date)
      expect(range.start).toBe('2024-01-15')
      expect(range.end).toBe('2024-01-21')
    })

    it('应该正确处理周一当天', () => {
      const date = new Date(2024, 0, 15)
      const range = getWeekDateRange(date)
      expect(range.start).toBe('2024-01-15')
      expect(range.end).toBe('2024-01-21')
    })

    it('应该正确处理周日当天', () => {
      const date = new Date(2024, 0, 21)
      const range = getWeekDateRange(date)
      expect(range.start).toBe('2024-01-15')
      expect(range.end).toBe('2024-01-21')
    })

    it('应该正确处理跨月份的周', () => {
      const date = new Date(2024, 0, 31)
      const range = getWeekDateRange(date)
      expect(range.start).toBe('2024-01-29')
      expect(range.end).toBe('2024-02-04')
    })
  })
})

describe('周报数据结构', () => {
  describe('createEmptyReport', () => {
    it('应该创建包含三个空字段的周报对象', () => {
      const report = createEmptyReport()
      expect(report).toEqual({
        [FIELD_SUMMARY]: '',
        [FIELD_PLAN]: '',
        [FIELD_PROBLEMS]: ''
      })
    })
  })

  describe('getTemplateContent', () => {
    it('应该返回简洁模板的内容', () => {
      const content = getTemplateContent('concise')
      expect(content[FIELD_SUMMARY]).toBe(TEMPLATES.concise[FIELD_SUMMARY])
      expect(content[FIELD_PLAN]).toBe(TEMPLATES.concise[FIELD_PLAN])
      expect(content[FIELD_PROBLEMS]).toBe(TEMPLATES.concise[FIELD_PROBLEMS])
    })

    it('应该返回详细模板的内容', () => {
      const content = getTemplateContent('detailed')
      expect(content[FIELD_SUMMARY]).toBe(TEMPLATES.detailed[FIELD_SUMMARY])
    })

    it('应该返回项目进度模板的内容', () => {
      const content = getTemplateContent('project')
      expect(content[FIELD_SUMMARY]).toBe(TEMPLATES.project[FIELD_SUMMARY])
    })

    it('对不存在的模板应该返回空内容', () => {
      const content = getTemplateContent('not-exist')
      expect(content).toEqual(createEmptyReport())
    })
  })

  describe('extractReportFields', () => {
    it('应该只提取三个核心字段', () => {
      const fullReport = {
        id: 'report-1',
        weekKey: '2024-W01',
        weekLabel: '2024年第1周',
        [FIELD_SUMMARY]: '总结',
        [FIELD_PLAN]: '计划',
        [FIELD_PROBLEMS]: '问题',
        extra: '多余字段'
      }
      const extracted = extractReportFields(fullReport)
      expect(extracted).toEqual({
        [FIELD_SUMMARY]: '总结',
        [FIELD_PLAN]: '计划',
        [FIELD_PROBLEMS]: '问题'
      })
      expect(extracted).not.toHaveProperty('id')
      expect(extracted).not.toHaveProperty('weekKey')
    })

    it('对缺失的字段应该填充空字符串', () => {
      const partial = { [FIELD_SUMMARY]: '总结' }
      const extracted = extractReportFields(partial)
      expect(extracted[FIELD_PLAN]).toBe('')
      expect(extracted[FIELD_PROBLEMS]).toBe('')
    })
  })

  describe('isReportEmpty', () => {
    it('空报告应该返回 true', () => {
      expect(isReportEmpty(createEmptyReport())).toBe(true)
    })

    it('只含空白字符的报告应该返回 true', () => {
      expect(isReportEmpty({
        [FIELD_SUMMARY]: '   ',
        [FIELD_PLAN]: '\n\t',
        [FIELD_PROBLEMS]: '  '
      })).toBe(true)
    })

    it('有内容的总结应该返回 false', () => {
      expect(isReportEmpty({
        [FIELD_SUMMARY]: '有内容',
        [FIELD_PLAN]: '',
        [FIELD_PROBLEMS]: ''
      })).toBe(false)
    })

    it('有内容的计划应该返回 false', () => {
      expect(isReportEmpty({
        [FIELD_SUMMARY]: '',
        [FIELD_PLAN]: '有内容',
        [FIELD_PROBLEMS]: ''
      })).toBe(false)
    })

    it('有内容的问题应该返回 false', () => {
      expect(isReportEmpty({
        [FIELD_SUMMARY]: '',
        [FIELD_PLAN]: '',
        [FIELD_PROBLEMS]: '有内容'
      })).toBe(false)
    })
  })
})

describe('周报文本组装', () => {
  describe('assembleReportText', () => {
    it('应该按正确顺序组装三部分内容', () => {
      const report = {
        [FIELD_SUMMARY]: '完成了A任务',
        [FIELD_PLAN]: '计划做B任务',
        [FIELD_PROBLEMS]: '遇到了C问题'
      }
      const text = assembleReportText(report)
      expect(text).toContain('## 本周工作总结')
      expect(text).toContain('完成了A任务')
      expect(text).toContain('## 下周工作计划')
      expect(text).toContain('计划做B任务')
      expect(text).toContain('## 遇到的问题')
      expect(text).toContain('遇到了C问题')
    })

    it('应该用分隔线分隔各部分', () => {
      const report = {
        [FIELD_SUMMARY]: 'a',
        [FIELD_PLAN]: 'b',
        [FIELD_PROBLEMS]: 'c'
      }
      const text = assembleReportText(report)
      expect(text).toContain('---')
    })

    it('空字段应该显示占位符', () => {
      const report = createEmptyReport()
      const text = assembleReportText(report)
      expect((text.match(/（未填写）/g) || []).length).toBe(3)
    })
  })

  describe('generateEmailSubject', () => {
    it('应该生成包含周次的邮件标题', () => {
      const date = new Date(2024, 0, 15)
      expect(generateEmailSubject(date)).toBe('周报 - 第3周')
    })
  })

  describe('getSummaryPreview', () => {
    it('空内容应该返回占位符', () => {
      expect(getSummaryPreview('')).toBe('（未填写）')
    })

    it('null 应该返回占位符', () => {
      expect(getSummaryPreview(null)).toBe('（未填写）')
    })

    it('短内容应该完整返回', () => {
      expect(getSummaryPreview('短文本')).toBe('短文本')
    })

    it('超过默认长度应该截断并加省略号', () => {
      const long = '这是一段非常长的总结内容，包含很多很多很多很多很多很多很多很多很多字'
      const preview = getSummaryPreview(long)
      expect(preview.endsWith('...')).toBe(true)
      expect(preview.length).toBeLessThanOrEqual(33)
    })

    it('应该支持自定义长度', () => {
      const text = '1234567890abcdef'
      expect(getSummaryPreview(text, 5)).toBe('12345...')
    })

    it('应该过滤 Markdown 格式符号', () => {
      const md = '### **标题** - 列表项'
      expect(getSummaryPreview(md)).not.toContain('#')
      expect(getSummaryPreview(md)).not.toContain('*')
      expect(getSummaryPreview(md)).not.toContain('-')
    })

    it('应该将换行符替换为空格', () => {
      const multiLine = '第一行\n第二行'
      expect(getSummaryPreview(multiLine)).not.toContain('\n')
    })
  })
})

describe('周报记录管理', () => {
  describe('createReportRecord', () => {
    it('应该创建完整的周报记录', () => {
      vi.useFakeTimers().setSystemTime(new Date(2024, 0, 15, 10, 0, 0))
      const report = {
        [FIELD_SUMMARY]: '总结',
        [FIELD_PLAN]: '计划',
        [FIELD_PROBLEMS]: '问题'
      }
      const record = createReportRecord(report)
      expect(record.id).toBe('report-2024-W03')
      expect(record.weekKey).toBe('2024-W03')
      expect(record.weekLabel).toBe('2024年第3周')
      expect(record.dateRange.start).toBe('2024-01-15')
      expect(record.dateRange.end).toBe('2024-01-21')
      expect(record[FIELD_SUMMARY]).toBe('总结')
      expect(record[FIELD_PLAN]).toBe('计划')
      expect(record[FIELD_PROBLEMS]).toBe('问题')
      expect(record.createdAt).toBe(record.updatedAt)
      vi.useRealTimers()
    })

    it('应该支持传入自定义日期', () => {
      const date = new Date(2024, 5, 1)
      const record = createReportRecord(createEmptyReport(), date)
      expect(record.weekKey).toBe(getWeekKey(date))
    })
  })

  describe('upsertReport', () => {
    it('新增周报应该添加到列表开头', () => {
      const existing = [
        { id: 'old-1', weekKey: '2024-W01', updatedAt: 1000 }
      ]
      const newReport = { id: 'new-1', weekKey: '2024-W02', updatedAt: 2000 }
      const result = upsertReport(existing, newReport)
      expect(result).toHaveLength(2)
      expect(result[0].id).toBe('new-1')
    })

    it('同一周的周报应该被更新而非新增', () => {
      const existing = [
        { id: 'report-2024-W01', weekKey: '2024-W01', [FIELD_SUMMARY]: '旧总结', updatedAt: 1000 }
      ]
      const update = { id: 'report-2024-W01', weekKey: '2024-W01', [FIELD_SUMMARY]: '新总结', updatedAt: 2000 }
      const result = upsertReport(existing, update)
      expect(result).toHaveLength(1)
      expect(result[0][FIELD_SUMMARY]).toBe('新总结')
      expect(result[0].updatedAt).toBeGreaterThan(1000)
    })

    it('更新周报应该保留原创建时间', () => {
      const existing = [
        { id: 'report-2024-W01', weekKey: '2024-W01', createdAt: 1000, updatedAt: 1000 }
      ]
      const update = { id: 'report-2024-W01', weekKey: '2024-W01' }
      const result = upsertReport(existing, update)
      expect(result[0].createdAt).toBe(1000)
    })

    it('不应该修改原始数组', () => {
      const original = [{ id: '1', weekKey: '2024-W01' }]
      const newReport = { id: '2', weekKey: '2024-W02' }
      upsertReport(original, newReport)
      expect(original).toHaveLength(1)
    })
  })

  describe('sortReportsByDate', () => {
    it('应该按更新时间倒序排列', () => {
      const reports = [
        { id: '1', updatedAt: 1000 },
        { id: '3', updatedAt: 3000 },
        { id: '2', updatedAt: 2000 }
      ]
      const sorted = sortReportsByDate(reports)
      expect(sorted[0].id).toBe('3')
      expect(sorted[1].id).toBe('2')
      expect(sorted[2].id).toBe('1')
    })

    it('不应该修改原始数组', () => {
      const original = [
        { id: '1', updatedAt: 1000 },
        { id: '2', updatedAt: 2000 }
      ]
      sortReportsByDate(original)
      expect(original[0].id).toBe('1')
    })
  })

  describe('findReportByWeekKey', () => {
    it('应该找到匹配的周报', () => {
      const reports = [
        { id: '1', weekKey: '2024-W01' },
        { id: '2', weekKey: '2024-W02' }
      ]
      expect(findReportByWeekKey(reports, '2024-W01')?.id).toBe('1')
    })

    it('找不到应该返回 null', () => {
      const reports = [{ id: '1', weekKey: '2024-W01' }]
      expect(findReportByWeekKey(reports, '2024-W99')).toBe(null)
    })

    it('空列表应该返回 null', () => {
      expect(findReportByWeekKey([], '2024-W01')).toBe(null)
    })
  })
})
