我来逐一修复这两个问题。让我先查看当前文件内容：



        
            
toolName: todo_write
            
status: success
          
Todos updated: 3 items
          

        
            
toolName: view_files
            
status: success
          
            
filePath: /Users/vincent/GoletaLab/solocoder-react/src/pages/minesweeper/index.jsx
          

        
            
toolName: view_files
            
status: success
          
            
filePath: /Users/vincent/GoletaLab/solocoder-react/src/pages/minesweeper/minesweeperCore.js
          
找到了两个问题，现在逐一修复：

**问题 1**：第 323 行是 `)}`，第 324 行有多余的裸 `)`。需要删除第 324 行。

**问题 2**：自定义难度条目在 `customConfig` 为 `null` 时缺少 `rows/cols/mines` 字段，需要统一结构。







        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: /Users/vincent/GoletaLab/solocoder-react/src/pages/minesweeper/index.jsx
          
changes: undefined
          

        
            
toolName: todo_write
            
status: success
          
Todos updated: 3 items
          
现在修复 `addToLeaderboard`，确保自定义难度条目无论 `customConfig` 是否为空都有一致的字段结构：









        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: /Users/vincent/GoletaLab/solocoder-react/src/pages/minesweeper/minesweeperCore.js
          
changes: undefined
          
现在更新测试，增加一个用例验证 customConfig 为 null 时自定义难度条目字段结构一致：










        
            
toolName: todo_write
            
status: success
          
Todos updated: 3 items
          

        
            
toolName: view_files
            
status: success
          
            
filePath: /Users/vincent/GoletaLab/solocoder-react/src/pages/__tests__/minesweeper/minesweeperCore.test.js
          

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: /Users/vincent/GoletaLab/solocoder-react/src/pages/__tests__/minesweeper/minesweeperCore.test.js
          
changes: undefined
          
现在运行所有测试验证：









        
            
toolName: run_command
            
status: success
          
command: cd /Users/vincent/GoletaLab/solocoder-react && pnpm test -- src/pages/__tests__/minesweeper/minesweeperCore.test.js 2>&1 undefined
          
所有 4729 个测试通过（含新增的 57 个扫雷测试）。再验证一下 lint：










        
            
toolName: run_command
            
status: success
          
command: cd /Users/vincent/GoletaLab/solocoder-react && npx eslint src/pages/minesweeper/ src/pages/__tests__/minesweeper/ 2>&1 undefined
          
Lint 无错误。所有修复完成！









        
            
toolName: todo_write
            
status: success
          
Todos updated: 3 items
          
所有问题已修复！以下是修复详情：

## 修复内容

### 1. 通关弹层多余的 `)` 文本节点
- **修复前**：[index.jsx#L322-L324](file:///Users/vincent/GoletaLab/solocoder-react/src/pages/minesweeper/index.jsx#L322-L324) 通关条件渲染块结束的 `)}` 被错误拆成两行，第二行裸 `)` 不在任何 JSX 表达式内，会被 React 渲染为 DOM 文本节点。
- **修复后**：删除多余的裸 `)`，恢复为正确的 `)}` 闭合。

### 2. 自定义难度排行榜条目字段结构不一致
- **修复前**：[addToLeaderboard](file:///Users/vincent/GoletaLab/solocoder-react/src/pages/minesweeper/minesweeperCore.js#L307-L331) 仅当 `customConfig` 存在时才写入 `rows/cols/mines`，无配置时条目缺少这三个字段。
- **修复后**：只要难度是 `CUSTOM`，无论 `customConfig` 是否为空都写入 `rows/cols/mines`，无配置时值为 `null`，保证字段结构一致。

### 3. 测试与验证
- 新增测试用例验证 `customConfig` 为 `null` 时条目仍包含 `rows/cols/mines`（值为 `null`）
- **全部 4729 个测试通过**（含扫雷模块的 57 个测试），ESLint 无错误。