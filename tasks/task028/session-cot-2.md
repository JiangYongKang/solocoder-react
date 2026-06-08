我来逐一修复这些问题。首先创建任务列表。

        
            
toolName: todo_write
            
status: success
          
Todos updated: 7 items
          
首先读取 examCore.js 来修复问题 #1 和 #4（组卷总分和洗牌算法）：



        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\exam\examCore.js
          
让我也读取其他几个需要修改的文件：




        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\exam\index.jsx
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\exam\QuestionBank.jsx
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\exam\ExamHistory.jsx
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\exam\ExamCreate.jsx
          
让我也读取 ExamTake.jsx 和现有测试文件：





        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\exam\ExamTake.jsx
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\exam\ExamResult.jsx
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\exam\examCore.test.js
          
好的，我现在已经了解了所有需要修改的文件。让我开始逐一修复这些问题。

## 修复 1 & 4：Fisher-Yates 洗牌 + generateExam 精确匹配总分

先修改 `examCore.js`：





        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\exam\examCore.js
          
changes: undefined
          
现在添加查找考试草稿的函数（问题 #2 需要用到）：






        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\exam\examCore.js
          
changes: undefined
          

        
            
toolName: todo_write
            
status: success
          
Todos updated: 7 items
          
## 修复问题 #2：刷新恢复考试草稿

修改 `index.jsx`：








        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\exam\index.jsx
          
changes: undefined
          
## 修复问题 #3：QuestionBank 分页显示页码错误








        
            
toolName: todo_write
            
status: success
          
Todos updated: 7 items
          

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\exam\QuestionBank.jsx
          
changes: undefined
          
## 修复问题 #5：ExamHistory 性能优化









        
            
toolName: todo_write
            
status: success
          
Todos updated: 7 items
          

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\exam\ExamHistory.jsx
          
changes: undefined
          
现在还需要更新 ExamCreate 页面，在预览中清晰区分目标总分和实际总分：










        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\exam\ExamCreate.jsx
          
changes: undefined
          
还需要更新 ExamTake 保存 record 时包含 targetScore 信息：










        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\exam\ExamTake.jsx
          
changes: undefined
          
更新 ExamTake 显示目标总分和实际总分：












        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\exam\ExamTake.jsx
          
changes: undefined
          
更新 ExamResult 显示目标总分：













        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\exam\ExamResult.jsx
          
changes: undefined
          
## 修复问题 #6：补充单元测试
















        
            
toolName: todo_write
            
status: success
          
Todos updated: 7 items
          
现在我需要更新测试文件。首先我需要修改 createMockLocalStorage 让它支持 `.length` 和 `.key(i)`，因为 `findActiveExamDraft` 用到了这些 API：
















        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\exam\examCore.test.js
          
changes: undefined
          
更新 mock localStorage 支持 length 和 key()：


















        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\exam\examCore.test.js
          
changes: undefined
          
现在更新 generateExam 的测试（新的算法不允许超过目标分），并在文件末尾追加新的测试：





















        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\exam\examCore.test.js
          
changes: undefined
          
现在在考试草稿测试部分添加 findActiveExamDraft 测试。先找到 exam draft tests 区块：





















        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\exam\examCore.test.js
          
changes: undefined
          
## 修复问题 #7：运行所有测试确保通过



















        
            
toolName: todo_write
            
status: success
          
Todos updated: 7 items
          

        
            
toolName: run_command
            
status: success
          
command: cd c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react ; npx vitest run src/pages/__tests__/exam/examCore.test.js 2>&1 undefined
          

        
            
toolName: run_command
            
status: success
          
command: cd c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react ; npx eslint src/pages/exam src/pages/__tests__/exam 2>&1 undefined
          
Lint 通过！有一个测试失败，是因为两次保存草稿在同一毫秒，导致 `savedAt` 相同。修复 `findActiveExamDraft` 的比较逻辑，相同时戳取后者：

















        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\exam\examCore.js
          
changes: undefined
          

        
            
toolName: run_command
            
status: success
          
command: cd c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react ; npx vitest run src/pages/__tests__/exam/examCore.test.js 2>&1 undefined
          
全部 89 个测试通过！让我也运行诊断确认没有其他问题：



















        
            
toolName: GetDiagnostics
            
status: success
          
          

        
            
toolName: run_command
            
status: success
          
command: cd c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react ; pnpm run test 2>&1 undefined
          

        
            
toolName: todo_write
            
status: success
          
Todos updated: 7 items
          
所有 7 个问题均已修复完成！测试从 73 个增加到 89 个，全部通过，ESLint 和诊断均无错误。

## 📋 修复总结

### 1. 组卷总分显示不准确 ✓
**修改文件**：[examCore.js](file:///C:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/exam/examCore.js#L179-L221)、[ExamCreate.jsx](file:///C:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/exam/ExamCreate.jsx#L115-L138)、[ExamTake.jsx](file:///C:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/exam/ExamTake.jsx#L174-L184)、[ExamResult.jsx](file:///C:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/exam/ExamResult.jsx#L24-L44)

- `generateExam` 不再允许超过目标分，最多尝试 100 次 Fisher-Yates 洗牌 + 贪心选取来精确匹配目标总分
- 新增 `targetScore`（用户设定值）、`totalScore`（实际累计值）、`isExactScore`（是否精确匹配）三个字段
- 预览、作答、结果页面均清晰区分显示目标总分与实际总分，不精确匹配时用橙色标注并说明原因

### 2. 刷新页面恢复考试草稿 ✓
**修改文件**：[examCore.js](file:///C:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/exam/examCore.js#L257-L285)、[index.jsx](file:///C:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/exam/index.jsx#L27-L56)

- 新增 `findActiveExamDraft()` 函数：扫描 localStorage 中所有 `exam_draft_*` 条目，自动跳过已超时的草稿，返回最近保存的有效草稿
- 主入口 `useMemo` 初始化时，优先检查 URL 参数（成绩详情）→ 检查有效草稿（恢复作答）→ 默认进入题库管理

### 3. 分页组件页码显示错误 ✓
**修改文件**：[QuestionBank.jsx](file:///C:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/exam/QuestionBank.jsx#L448-L468)

- 分页信息文本、上一页/下一页按钮的 disabled 状态，全部改用 `safePage` 而非原始 `page` state
- `setPage` 回调也做 clamp 保护

### 4. Fisher-Yates 洗牌算法 ✓
**修改文件**：[examCore.js](file:///C:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/exam/examCore.js#L152-L162)

- 新增 `shuffleArray()` 导出函数，实现标准 Fisher-Yates 算法（从后往前遍历，随机交换位置）
- 保证 O(n) 时间复杂度和均匀概率分布，移除了原 `Array.sort(() => Math.random() - 0.5)` 的有偏实现

### 5. ExamHistory 性能优化 ✓
**修改文件**：[ExamHistory.jsx](file:///C:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/exam/ExamHistory.jsx#L24-L71)

- 新增 `gradedMap`（`useMemo` 缓存的 `Map<recordId, gradedResult>`），所有历史记录只判分一次
- 统计数据、趋势图、表格行均从缓存中读取，不再每行重复调用 `gradeExam`
- 同时内联了 `getScoreClass`，避免闭包函数反复创建

### 6. 补充单元测试 ✓
**修改文件**：[examCore.test.js](file:///C:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/__tests__/exam/examCore.test.js)

- `shuffleArray`：5 个用例（空值、空数组、元素完整性、不修改原数组、概率性验证不同排列）
- `generateExam`：7 个用例（精确匹配、不超过目标、`isExactScore` 标记、`targetScore` 保留等）
- `findActiveExamDraft`：8 个用例（无草稿、正常恢复、取最新、自动清除过期、忽略非草稿 key、容错坏数据、容错无 exam、window 未定义）
- `createMockLocalStorage` 升级：支持 `.length` 和 `.key(i)` API

### 7. 验证 ✓
- ✅ `pnpm run test` 全部通过（89 tests）
- ✅ ESLint 0 errors
- ✅ VS Code Diagnostics 0 errors