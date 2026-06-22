export const STORAGE_KEY_WEEKLY_REPORTS = 'weekly_reports'
export const STORAGE_KEY_CURRENT_DRAFT = 'weekly_report_current_draft'
export const STORAGE_KEY_SELECTED_TEMPLATE = 'weekly_report_selected_template'

export const FIELD_SUMMARY = 'summary'
export const FIELD_PLAN = 'plan'
export const FIELD_PROBLEMS = 'problems'

export const TEMPLATES = {
  concise: {
    id: 'concise',
    name: '简洁模板',
    description: '极简风格，重点突出',
    [FIELD_SUMMARY]: `- 完成事项1
- 完成事项2
- 完成事项3`,
    [FIELD_PLAN]: `- 计划事项1
- 计划事项2
- 计划事项3`,
    [FIELD_PROBLEMS]: `- 暂无`
  },
  detailed: {
    id: 'detailed',
    name: '详细模板',
    description: '适合需要详细汇报的场景',
    [FIELD_SUMMARY]: `### 重点工作
- **项目A**: 完成xxx模块，进度80%
- **项目B**: 修复了3个关键bug

### 日常工作
- 参加了2次团队会议
- 完成代码review 5次

### 其他
- 协助新同事熟悉项目`,
    [FIELD_PLAN]: `### 下周重点
- **项目A**: 完成剩余20%并上线
- **项目B**: 开始新功能开发

### 日常安排
- 周一: 需求评审
- 周三: 技术分享
- 周五: 周报整理`,
    [FIELD_PROBLEMS]: `### 当前遇到的问题
1. 问题1：xxx
   - 影响范围：xxx
   - 预计解决时间：xxx

2. 问题2：xxx
   - 需要协助：xxx`
  },
  project: {
    id: 'project',
    name: '项目进度模板',
    description: '按项目维度汇报进度',
    [FIELD_SUMMARY]: `#### 项目一：[项目名称]
- 本周进度：xx%
- 主要工作：
  - 完成了xxx
  - 解决了xxx
- 里程碑：已完成/进行中/待开始

#### 项目二：[项目名称]
- 本周进度：xx%
- 主要工作：
  - xxx
- 里程碑：已完成/进行中/待开始`,
    [FIELD_PLAN]: `#### 项目一：[项目名称]
- 下周目标：
  - 完成xxx
  - 推进xxx
- 预计交付：日期

#### 项目二：[项目名称]
- 下周目标：
  - xxx
- 预计交付：日期`,
    [FIELD_PROBLEMS]: `#### 风险与问题
| 项目 | 问题描述 | 影响程度 | 解决方案 | 责任人 |
|------|----------|----------|----------|--------|
| 项目一 | xxx | 高/中/低 | xxx | xxx |

#### 需要支持
- xxx资源
- xxx协调`
  }
}

export const TEMPLATE_OPTIONS = Object.values(TEMPLATES).map(t => ({
  id: t.id,
  name: t.name,
  description: t.description
}))
