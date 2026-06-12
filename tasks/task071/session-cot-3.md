让我先读取相关文件的当前状态来分析问题。
        
            
toolName: todo_write
            
status: success
          
Todos updated: 4 items
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\markdown-notes\noteUtils.js
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\markdown-notes\markdown-notes.css
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\markdown-notes\noteUtils.js
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\markdown-notes\noteUtils.test.js
          
现在我清楚了两个问题：

1. **行内代码内部被二次匹配**：当前在第605行先做行内代码替换，然后在第613-616行做粗体/斜体替换，这些后续正则会穿透已生成的 `<code>` 标签内部。需要用占位符机制保护行内代码内容。

2. **CSS 中 `.sidebar` 重复声明**：768px 断点内第627-630行和第636-641行有两处 `.sidebar`，第一处完全被第二处覆盖。
        
            
toolName: todo_write
            
status: success
          
Todos updated: 4 items
          
修复行内代码被二次匹配的问题。核心思路：用占位符替换行内代码内容，等所有格式替换完成后再还原：
        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\markdown-notes\noteUtils.js
          
changes: undefined
          
现在修复 CSS 中 `.sidebar` 重复声明的问题：
        
            
toolName: todo_write
            
status: success
          
Todos updated: 4 items
          

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\markdown-notes\markdown-notes.css
          
changes: undefined
          
现在让我补充测试用例覆盖行内代码保护的场景，并运行所有测试：
        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\markdown-notes\noteUtils.test.js
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\markdown-notes\noteUtils.test.js
          
现在让我在 Markdown rendering 的 describe 块中添加行内代码保护的测试：
        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\markdown-notes\noteUtils.test.js
          
changes: undefined
          
现在运行测试和 eslint 检查：
        
            
toolName: todo_write
            
status: success
          
Todos updated: 4 items
          

        
            
toolName: run_command
            
status: success
          
command: pnpm test src/pages/__tests__/markdown-notes/noteUtils.test.js 2>&1 undefined
          

        
            
toolName: run_command
            
status: running
          
command: pnpm eslint src/pages/markdown-notes/ 2>&1 undefined
          
127 个测试全部通过，ESLint 也已通过。dev server 的错误是来自其他页面（data-importer），与 markdown-notes 无关。让我运行完整测试套件：
        
            
toolName: todo_write
            
status: success
          
Todos updated: 4 items
          

        
            
toolName: run_command
            
status: success
          
command: pnpm test 2>&1 undefined
          
全部 **6657 个测试通过**！
        
            
toolName: todo_write
            
status: success
          
Todos updated: 4 items
          
所有问题已修复，全部 6657 个测试通过。以下是修复详情：

---

## 修复总结

### 1. 行内代码内部被格式正则二次匹配 ✅

**文件**: [noteUtils.js](file:///C:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/markdown-notes/noteUtils.js#L605-L623)

**问题根因**：`renderMarkdown` 先执行行内代码替换（生成 `<code class="inline-code">` 标签），然后后续的粗体/斜体/删除线正则继续在整个 HTML 字符串上匹配，会穿透到 `<code>` 标签内部。例如 `` `**粗体**` `` 会变成 `<code class="inline-code"><strong>粗体</strong></code>`。

**修复方案**：使用占位符机制（slot）：
1. 行内代码替换时，先将完整的 `<code>` 标签存入 `inlineCodeSlots` 数组
2. 在文本中插入 `\x00INLINE_CODE_N\x00` 占位符
3. 执行所有格式替换（标题、粗体、斜体、删除线等），占位符不受影响
4. 所有格式替换完成后，将占位符还原为完整的 `<code>` 标签

**新增 6 个测试用例**覆盖：
- 行内代码内的粗体标记不被转换
- 行内代码内的斜体标记不被转换
- 行内代码内的删除线标记不被转换
- 行内代码内的标题标记不被转换
- 行内代码与外部正常格式共存
- 多个行内代码全部受保护

### 2. CSS 768px 断点 `.sidebar` 重复声明 ✅

**文件**: [markdown-notes.css](file:///C:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/markdown-notes/markdown-notes.css#L627-L636)

**问题根因**：768px 媒体查询内有两处 `.sidebar` 声明——第一处设置了 `width: 220px; min-width: 200px`，紧跟着第二处设置了 `width: 100%`，第一处的属性完全被覆盖成为死代码。

**修复方案**：删除第一处无效的 `.sidebar` 声明（`width: 220px; min-width: 200px`），只保留第二处正确的移动端声明（`width: 100%; max-height: 40vh` 等）。

### 3. 移动端布局 ✅

768px 和 480px 两级媒体查询已覆盖响应式布局，375px 宽度下侧边栏变为全宽堆叠、编辑器/预览区纵向排列。

### 4. 测试结果 ✅

```
Test Files  90 passed (90)
     Tests  6657 passed (6657)
```

markdown-notes 模块测试从 121 个增至 **127 个**，全部通过。