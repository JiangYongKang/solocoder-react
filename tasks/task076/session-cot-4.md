让我逐一修复这些问题。首先读取相关代码：




        
            
toolName: todo_write
            
status: success
          
Todos updated: 4 items
          

        
            
toolName: search_by_regex
            
status: success
          
query: \.rm-diff-container
          

        
            
toolName: search_by_regex
            
status: success
          
query: buildReleaseDiff
          

        
            
toolName: todo_write
            
status: success
          
Todos updated: 4 items
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\release-manager\release-manager.css
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\release-manager\utils.test.js
          
让我先看看 `buildReleaseDiff` 的实现和 truncateTextForDiff 测试：







        
            
toolName: search_by_regex
            
status: success
          
query: export function buildReleaseDiff
          

        
            
toolName: search_by_regex
            
status: success
          
query: toBeLessThan\(MAX_DIFF_LINES
          
开始修复问题1 - Diff 面板移动端 grid 布局：




        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\release-manager\release-manager.css
          
changes: undefined
          
问题1修复。现在修复问题3 - truncateTextForDiff精确行数断言，先看一下truncate的输出逻辑：







        
            
toolName: todo_write
            
status: success
          
Todos updated: 4 items
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\release-manager\utils.js
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\release-manager\utils.test.js
          
现在修复 buildReleaseDiff 精确断言和 truncateTextForDiff 精确行数：






        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\release-manager\utils.test.js
          
changes: undefined
          
现在修复问题3 - truncateTextForDiff 精确行数断言：







        
            
toolName: todo_write
            
status: success
          
Todos updated: 4 items
          

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\release-manager\utils.test.js
          
changes: undefined
          
现在运行测试验证：








        
            
toolName: todo_write
            
status: success
          
Todos updated: 4 items
          

        
            
toolName: run_command
            
status: success
          
command: pnpm run test -- src/pages/__tests__/release-manager/utils.test.js 2>&1 undefined
          
release-manager 模块测试全部通过 ✅（106 个）。现在运行完整测试套件：








        
            
toolName: run_command
            
status: success
          
command: pnpm run test 2>&1 undefined
          
全部通过 ✅！更新任务状态：










        
            
toolName: todo_write
            
status: success
          
Todos updated: 4 items
          
## ✅ 全部修复完成

### 1. Diff 面板移动端 Grid 布局修复

**问题**：基础样式使用 `display: grid`，媒体查询里却设置了 `flex-direction: column`，对 grid 容器无效。

**修复** - [release-manager.css](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/release-manager/release-manager.css#L1225-L1228)：
```css
.rm-diff-container {
  grid-template-columns: 1fr;  /* 从 1fr 1fr 改为单列 */
  gap: 12px;
}
```

### 2. `buildReleaseDiff` 精确内容断言

新增 6 个深度测试用例，全部精确断言 diff 输出：

| 测试场景 | 验证内容 |
|---------|---------|
| 相等+修改行 | `lineDiff` 类型/内容、`leftRows`/`rightRows` 的 `lineNum`、`type`、`content` 全字段精确对象比对 |
| 新增行 | 右侧有连续行号+内容，左侧为 `{ lineNum: null, empty: true }` 占位 |
| 删除行 | 左侧有连续行号+内容，右侧为 `{ lineNum: null, empty: true }` 占位 |
| 完全相同文本 | 全部 `EQUAL`，行号从 1 开始连续递增 |
| 纯新增文本 | 左侧全部 `empty: true`，右侧行号 1、2、3... |
| 纯删除文本 | 左侧行号 1、2、3...，右侧全部 `empty: true` |

### 3. `truncateTextForDiff` 精确行数断言

将模糊断言 `toBeLessThan(MAX_DIFF_LINES + 5)` 替换为精确断言：

- 输入 510 行 → 前 500 行 + 空行 + 截断提示行 = **502 行** → `toBe(MAX_DIFF_LINES + 2)`
- 自定义 `maxLines=3`，输入 5 行 → 前 3 行 + 空行 + 截断提示行 = **5 行** → `toBe(5)`

### 4. 测试结果

```
Test Files  90 passed (90)
     Tests  6669 passed (6669)
  Duration  3.27s
```

release-manager 模块：**106 个测试用例全部通过 ✅**（比上次增加 6 个 buildReleaseDiff 新用例）