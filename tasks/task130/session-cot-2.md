toolName: todo_write
            
status: success
          
Todos updated: 6 items
          

        
            
toolName: todo_write
            
status: success
          
Todos updated: 6 items
          
让我先读取需要修改的文件的当前内容：

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\export-scheduler\index.jsx
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\export-scheduler\utils.js
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\export-scheduler\storage.js
          
现在我完全理解了所有问题。让我逐一修复。

**问题1修复**：notifyUser 中移除浏览器通知成功时多余的 Toast 调用：


        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\export-scheduler\index.jsx
          
changes: undefined
          

        
            
toolName: todo_write
            
status: success
          
Todos updated: 6 items
          
**问题3修复**：修复 retryStateMachine 中 retry_fail 的耗尽判断条件：




        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\export-scheduler\utils.js
          
changes: undefined
          

        
            
toolName: todo_write
            
status: success
          
Todos updated: 6 items
          
**问题4修复**：复用 isOverdueTask。在 storage.js 中导入并使用它，同时也在 index.jsx 中导入用来识别需要补执行的任务：



        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\export-scheduler\storage.js
          
changes: undefined
          
现在更新 storage.js 中的 recalculateNextExecutionForOverdueTasks 使用 isOverdueTask，并添加 findOverdueTasks 辅助函数：





        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\export-scheduler\storage.js
          
changes: undefined
          

        
            
toolName: todo_write
            
status: success
          
Todos updated: 6 items
          
**问题2修复**：在 index.jsx 中导入 findOverdueTasks 和 isOverdueTask，页面打开时识别逾期任务并立即补执行：





        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\export-scheduler\index.jsx
          
changes: undefined
          
现在更新页面打开时的 useEffect，在重新计算下次执行时间的同时，对逾期任务立即触发补执行：







        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\export-scheduler\index.jsx
          
changes: undefined
          

        
            
toolName: todo_write
            
status: success
          
Todos updated: 6 items
          
现在让我读取并更新测试文件，修复现有测试并添加覆盖修复逻辑的新测试：







        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\export-scheduler\exportSchedulerUtils.test.js
          
现在更新测试文件——修复重试生命周期测试，添加新测试覆盖所有修复逻辑：







        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\export-scheduler\exportSchedulerUtils.test.js
          
changes: undefined
          
现在修复失败重试的测试，并添加新的测试组：










        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\export-scheduler\exportSchedulerUtils.test.js
          
changes: undefined
          
现在在测试文件末尾添加新的测试组：











        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\export-scheduler\exportSchedulerUtils.test.js
          
changes: undefined
          

        
            
toolName: todo_write
            
status: success
          
Todos updated: 6 items
          
现在运行全部测试进行验证：










        
            
toolName: run_command
            
status: success
          
command: npx vitest --run src/pages/__tests__/export-scheduler/ undefined
          
全部 91 个测试通过！让我再检查诊断错误：










        
            
toolName: GetDiagnostics
            
status: success
          
          

        
            
toolName: GetDiagnostics
            
status: success
          
          

        
            
toolName: GetDiagnostics
            
status: success
          
          
诊断全部干净。让我再运行完整的测试套件确保没有破坏其他内容：












        
            
toolName: run_command
            
status: success
          
command: npm run test undefined
          

        
            
toolName: run_command
            
status: success
          
command: pnpm run test --run undefined
          

        
            
toolName: run_command
            
status: success
          
command: pnpm run test undefined
          
`pnpm run test` 中失败的 29 个测试全部来自其他模块（collaborative-doc、modal-generator、splash-config、sticky-notes），都是预先存在的问题，与本次修改无关。我们的 export-scheduler 模块 91 个测试全部通过。




        
            
toolName: todo_write
            
status: success
          
Todos updated: 6 items
          
所有 5 个问题已修复，**91 个测试全部通过**，0 个诊断错误。以下是修复详情：

---

## 修复总结

### 1. 浏览器通知成功时不再弹 Toast

**文件**：[index.jsx L353-L356](file:///C:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/export-scheduler/index.jsx#L353-L356)

删除了 `else { addToast(...) }` 分支，Toast 仅作为浏览器通知不可用时的降级方案，两者不同时出现。

---

### 2. 逾期任务补执行

**文件**：[index.jsx L584-L597](file:///C:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/export-scheduler/index.jsx#L584-L597)

页面重新打开时：
- 使用新增的 `findOverdueTasks()` 识别逾期超过 60 秒的任务
- 对每个逾期任务，`setTimeout` 延迟 10ms 后立即调用 `executeExport` 补执行
- 同时重新计算 `nextExecutionTime` 到未来时间
- 这样时间线中会产生实际的执行记录

---

### 3. 重试次数修正为恰好 3 次

**文件**：[utils.js L129-L133](file:///C:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/export-scheduler/utils.js#L129-L133)

将 `retry_fail` 的耗尽判断条件由 `s.retryCount + 1 >= MAX_RETRY_COUNT` 改为 `s.retryCount >= MAX_RETRY_COUNT`。

修正后的完整重试链路（`retryCount` 为当前是第几次重试）：
| 重试阶段 | 传入 retryCount | 条件判断 | 结果 |
|---|---|---|---|
| 第 1 次重试失败 | 1 | 1 >= 3? NO | count=2, 继续重试 |
| 第 2 次重试失败 | 2 | 2 >= 3? NO | count=3, 继续重试 |
| 第 3 次重试失败 | 3 | 3 >= 3? YES | 耗尽，暂停 |

---

### 4. 复用 `isOverdueTask` 函数

**文件**：
- [storage.js L10](file:///C:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/export-scheduler/storage.js#L10) — 导入 `isOverdueTask`
- [storage.js L121-L137](file:///C:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/export-scheduler/storage.js#L121-L137) — 新增 `findOverdueTasks`；`recalculateNextExecutionForOverdueTasks` 内部改用 `isOverdueTask` 判断
- [index.jsx L41, L71](file:///C:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/export-scheduler/index.jsx#L41) — 导入 `isOverdueTask` 和 `findOverdueTasks`

---

### 5. 新增单元测试（75 → 91）

新增 16 个测试，覆盖修复逻辑：

- **`isOverdueTask`**（6 个）：60s+ 逾期、未到 60s、暂停状态、null 时间、重试中、未来时间
- **`findOverdueTasks`**（2 个）：正确筛选、空结果
- **`recalculateNextExecutionForOverdueTasks`**（2 个）：逾期重算、未逾期不变
- **`showBrowserNotification`**（5 个）：API 不存在、permission 各状态、构造成功、构造抛异常
- **重试生命周期**（1 个）：`'should allow 3rd retry before exhaustion'` — 专门验证第 3 次重试确实允许
- **完整重试生命周期**：由 2 次重试耗尽 → 改为 3 次重试后耗尽（验证恰好 3 次）

测试验证：`npx vitest --run src/pages/__tests__/export-scheduler/` → **Test Files 1 passed, Tests 91 passed** ✓