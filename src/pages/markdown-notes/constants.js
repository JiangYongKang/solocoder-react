export const STORAGE_KEY = 'markdown-notes-data'
export const UI_STORAGE_KEY = 'markdown-notes-ui'
export const DEFAULT_PANEL_RATIO = 0.5
export const AUTOSAVE_DELAY = 500

export const NODE_TYPES = {
  NOTEBOOK: 'notebook',
  FOLDER: 'folder',
  NOTE: 'note',
}

export const DEFAULT_NOTE_CONTENT = `# 欢迎使用 Markdown 笔记

这是一个功能完整的 Markdown 笔记应用。

## 主要功能

- **多笔记本树形目录**：创建多本笔记本，以树形结构组织笔记
- **Markdown 实时预览**：左侧编辑，右侧预览
- **标签分类**：为笔记添加标签，方便筛选
- **全文搜索**：快速搜索所有笔记内容
- **笔记间链接**：使用 \`[[笔记标题]]\` 创建内部链接
- **导入导出**：支持 .md 文件的导入导出

## Markdown 语法示例

### 文本格式

**加粗文本**，*斜体文本*，~~删除线~~

### 列表

有序列表：
1. 第一项
2. 第二项
3. 第三项

无序列表：
- 项目 A
- 项目 B
- 项目 C

### 代码块

\`\`\`javascript
function hello() {
  console.log('Hello, World!');
}
\`\`\`

### 表格

| 姓名 | 年龄 | 职业 |
|------|------|------|
| 张三 | 25   | 工程师 |
| 李四 | 30   | 设计师 |

### 链接和图片

[外部链接](https://example.com)

### 内部链接

[[另一篇笔记]]
`
