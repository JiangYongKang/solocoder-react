让我先创建任务列表，然后逐一修复这些问题。






        
            
toolName: todo_write
            
status: success
          
Todos updated: 8 items
          
让我先读取现有文件了解情况。









        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\survey\surveyCore.js
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\survey\index.jsx
          
现在我了解了所有代码。让我开始逐一修复问题，先从 surveyCore.js 的核心逻辑开始。







        
            
toolName: todo_write
            
status: success
          
Todos updated: 8 items
          
先修复 surveyCore.js 中的矩阵题 falsy 判断，并新增删除问卷辅助函数。

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\survey\surveyCore.js
          
changes: undefined
          
现在在 surveyCore.js 中新增清理问卷相关所有数据的辅助函数。





        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\survey\surveyCore.js
          
changes: undefined
          
现在修改 index.jsx 中的导入和多个问题。首先更新导入并修复拖拽排序、删除、滑块、responsesMap 刷新问题。









        
            
toolName: todo_write
            
status: success
          
Todos updated: 5 items
          
先更新导入部分。









        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\survey\index.jsx
          
changes: undefined
          
现在更新 surveyCore 的导入列表。










        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\survey\index.jsx
          
changes: undefined
          
现在修复评分题滑块范围问题。先找到对应代码位置。









        
            
toolName: search_by_regex
            
status: success
          
query: min="3"|max="10"
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\survey\index.jsx
          

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\survey\index.jsx
          
changes: undefined
          
现在修复拖拽排序绕过 reorderQuestions 的问题。先找到 handleDragEnd。









        
            
toolName: search_by_regex
            
status: success
          
query: handleDragEnd
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\survey\index.jsx
          

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\survey\index.jsx
          
changes: undefined
          
现在修复删除问卷不清理 localStorage 数据，以及 responsesMap 不刷新问题。先找到 SurveyPage 组件。











        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\survey\index.jsx
          
现在修复 responsesMap 刷新问题和删除问卷清理数据问题。我需要添加一个 tick state 来触发刷新，并在删除/提交后触发。










        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\survey\index.jsx
          
changes: undefined
          
现在修复 handleDeleteSurvey 清理数据，并更新两个处理函数触发 responseTick。











        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\survey\index.jsx
          
changes: undefined
          
核心逻辑修复完成！现在补充单元测试。先让我检查现有测试文件，然后追加测试。












        
            
toolName: todo_write
            
status: success
          
Todos updated: 5 items
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\survey\surveyCore.test.js
          
现在追加新的单元测试。










        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\survey\surveyCore.test.js
          
changes: undefined
          
让我确认测试文件已经导入了新增的函数。









        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\survey\surveyCore.test.js
          
需要补充导入 deleteSurveyData。











        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\survey\surveyCore.test.js
          
changes: undefined
          
现在检查移动端 375px 响应式布局。先看 survey.css 的媒体查询部分。

















        
            
toolName: todo_write
            
status: success
          
Todos updated: 5 items
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\survey\survey.css
          
让我针对 375px 增加一些更细致的响应式优化，确保所有布局不崩坏。












        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\survey\survey.css
          
changes: undefined
          
响应式样式优化完成！现在运行所有测试验证。

















        
            
toolName: todo_write
            
status: success
          
Todos updated: 5 items
          

        
            
toolName: run_command
            
status: success
          
command: cd c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react ; npm test -- src/pages/__tests__/survey/surveyCore.test.js undefined
          
所有 **80 个测试全部通过**！现在让我检查诊断信息确保没有 lint 错误。















        
            
toolName: GetDiagnostics
            
status: success
          
          

        
            
toolName: GetDiagnostics
            
status: success
          
          

        
            
toolName: GetDiagnostics
            
status: success
          
          
所有文件零 lint 错误！现在启动 dev 服务器方便你手动验证。


















        
            
toolName: todo_write
            
status: success
          
Todos updated: 5 items
          

        
            
toolName: run_command
            
status: running
          
command: cd c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react ; npm run dev undefined
          

        
            
toolName: open_preview
            
status: success
          
预览
          
全部问题已修复完成！开发服务器已在 http://localhost:5175/ 启动。

## 修复明细

### 1. 作答数不刷新 ✓
**问题**：`responsesMap` 的 useMemo 只依赖 `surveys`，提交答卷不改 surveys，所以列表页作答数不更新。

**修复**：在 [index.jsx](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/survey/index.jsx) 增加 `responseTick` state，提交答卷完成和删除问卷时都 +1，作为 useMemo 的额外依赖，强制刷新作答数统计。

### 2. 拖拽排序绕过 reorderQuestions ✓
**问题**：UI 层 `handleDragEnd` 直接用 `arrayMove` 改数组，surveyCore 中的 `reorderQuestions` 里的越界和同位置保护逻辑被绕过。

**修复**：[index.jsx](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/survey/index.jsx#L388-L397) 中移除未使用的 `arrayMove` 导入，改为在 `handleDragEnd` 中调用 `reorderQuestions(prev, oldIndex, newIndex)`，统一通过 surveyCore 处理。

### 3. 删除问卷残留 localStorage 数据 ✓
**问题**：confirm 弹窗声称会清理作答数据，但实际只移除了问卷数组项，草稿和答卷永远残留。

**修复**：在 [surveyCore.js](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/survey/surveyCore.js#L417-L422) 新增 `deleteSurveyData(surveyId)` 纯函数，同时清理草稿和答卷。[index.jsx](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/survey/index.jsx#L972-L978) 的 `handleDeleteSurvey` 中先调用 `deleteSurveyData(id)` 再 `removeSurvey`。

### 4. 评分题滑块范围 3-10 改成 1-5 ✓
**问题**：需求明确是 1-5 星，但滑块 `min=3 max=10`，可以拖到 10 星且选不了 1-2 星。

**修复**：[index.jsx](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/survey/index.jsx#L171-L172) 改为 `min="1" max="5"`。

### 5. 矩阵量表题 falsy 判断误判 ✓
**问题**：`!answer[row.value]` 使得数字 `0`、字符串 `'0'`、`false` 被误判为未填写。

**修复**：[surveyCore.js](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/survey/surveyCore.js#L447-L451) 改为显式判断 `val === undefined || val === null || val === ''`。

### 6. 补充单元测试 ✓
在 [surveyCore.test.js](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/__tests__/survey/surveyCore.test.js) 新增 4 个 describe，共 **15 个新用例**：
- `validateAnswer matrix edge cases`（4 个用例）：验证数字 0、字符串 "0"、布尔 false 被视为有效；undefined/null/'' 仍拦截
- `deleteSurveyData`（3 个用例）：验证同时清理草稿和答卷、不影响其他问卷、无 localStorage 时优雅降级
- `reorderQuestions edge cases`（7 个用例）：越界、同位置、null survey、非数组 questions 保护、以及正确排序更新时间戳
- `createQuestion rating default maxRating`（1 个用例）：默认值为 5

### 7. 375px 移动端响应式优化 ✓
在 [survey.css](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/survey/survey.css) 新增 `@media (max-width: 420px)` 断点，针对极窄屏细化：
- 按钮等宽换行、作答页导航按钮 `flex:1` 均分宽度
- 题目卡片操作按钮整行右对齐避免与 badges 挤压
- 矩阵表格字体缩到 12px、行列 padding 减小
- 所有内边距、字号整体下调保证不拥挤

### 8. 测试全通过 ✓
```
Test Files  1 passed (1)
Tests      80 passed (80)
```
原 65 + 新增 15 = 80 个测试全部通过，所有 survey 相关文件 VSCode 诊断零错误。

可以打开 http://localhost:5175/，在首页点击「问卷调查系统」卡片手动验证全流程。