好的，我来修复这些问题。先让我查看需要修改的相关文件。

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\link-game\linkGameCore.js
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\link-game\index.jsx
          
现在让我创建任务清单并逐一修复：



        
            
toolName: todo_write
            
status: success
          
Todos updated: 4 items
          
先修复 calculateScore 函数。根据用户反馈，提示按钮无使用次数限制，所以"未使用提示"应该指 hintsUsed === 0，而不是硬编码 maxHints=1。同时移除无用的 config 变量。




        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\link-game\linkGameCore.js
          
changes: undefined
          
现在移除不再使用的 DIFFICULTY_CONFIG import：







        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\link-game\linkGameCore.js
          
changes: undefined
          

        
            
toolName: todo_write
            
status: success
          
Todos updated: 4 items
          
现在修复 index.jsx。让我先读取完整的相关代码段：





        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\link-game\index.jsx
          
现在修复 index.jsx。我需要重构处理逻辑：自动重排需要检查 shufflesRemaining，并且移除 calculateScore 的多余参数。我将使用 useEffect 来处理死局检测，这样能访问到最新的 state：








        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\link-game\index.jsx
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\link-game\index.jsx
          
现在我需要重构 handleCellClick。问题在于自动重排逻辑在嵌套的 setGrid 回调中，无法访问最新的 shufflesRemaining 状态并更新。我需要用 state ref 来跟踪并重构：










        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\link-game\index.jsx
          
changes: undefined
          
现在重写 handleCellClick，修复自动重排逻辑和 calculateScore 调用：











        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\link-game\index.jsx
          
changes: undefined
          

        
            
toolName: todo_write
            
status: success
          
Todos updated: 4 items
          
现在读取现有测试文件并补充新的测试用例：













        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\link-game\linkGameCore.test.js
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\link-game\linkGameCore.test.js
          
现在我需要补充单元测试。让我修改并添加新的测试用例，覆盖修复后的 calculateScore 逻辑：







        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\link-game\linkGameCore.test.js
          
changes: undefined
          

        
            
toolName: todo_write
            
status: success
          
Todos updated: 4 items
          
现在运行测试验证所有修改：











        
            
toolName: run_command
            
status: success
          
command: pnpm test src/pages/__tests__/link-game/linkGameCore.test.js undefined
          
所有 51 个测试都通过了！让我再用 GetDiagnostics 检查代码质量：











        
            
toolName: GetDiagnostics
            
status: success
          
          

        
            
toolName: GetDiagnostics
            
status: success
          
          

        
            
toolName: GetDiagnostics
            
status: success
          
          

        
            
toolName: todo_write
            
status: success
          
Todos updated: 4 items
          
所有问题已修复完成，所有测试通过。以下是修复内容总结：

---

## 🔧 修复内容总结

### 1. calculateScore 函数修复
- [linkGameCore.js](file:///C:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/link-game/linkGameCore.js#L233-L252)

**问题：
- ✅ 移除了未使用的 `config = DIFFICULTY_CONFIG[difficulty]` 无用赋值
- ✅ 从 import 中移除 `DIFFICULTY_CONFIG`
- ✅ 从参数解构中移除了 `difficulty`
- ✅ 修正提示奖励逻辑：
  - 旧逻辑：硬编码 `maxHints = 1` 配合 `Math.max(0, maxHints - hintsUsed)`
  - 新逻辑：`hintsUsed === 0 ? BONUS_UNUSED_HINT : 0`
  - 语义：提示按钮无使用次数限制，完全不使用才给200分，使用过（不管多少次）都不给提示奖励

### 2. 自动重排逻辑修复
- [index.jsx](file:///C:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/link-game/index.jsx#L178-L219)

**问题：**
- ✅ 新增 `stateRef` 机制，在 setTimeout 回调中访问最新状态
- ✅ 重构消除后检测逻辑，从嵌套 `setGrid` 回调改为使用 `stateRef.current`
- ✅ 自动重排前添加检查：`if (currentState.shufflesRemaining > 0)`
- ✅ 自动重排后同步更新状态：
  - `setShufflesRemaining((s) => s - 1)`
  - `setShufflesUsed((s) => s + 1)`
- ✅ 调用 `calculateScore` 移除了多余的 `difficulty` 参数

### 3. 补充单元测试
- [linkGameCore.test.js](file:///C:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/__tests__/link-game/linkGameCore.test.js#L466-L631)

新增测试用例：
- ✅ `should give full hint bonus when hintsUsed is exactly 0`
- ✅ `should give no hint bonus when hintsUsed is 1 or more`
- ✅ `should give no shuffle bonus when shufflesUsed >= MAX_SHUFFLES`
- ✅ `should give partial shuffle bonus when some shuffles used`
- ✅ `should work without difficulty parameter`

---

## ✅ 验证结果

- **单元测试**：51/51 全部通过
- **Lint 诊断**：所有相关文件 0 错误 0 警告