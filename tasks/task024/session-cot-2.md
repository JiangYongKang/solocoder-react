好的，我来逐一修复这些问题。首先让我创建任务清单：




        
            
toolName: todo_write
            
status: success
          
Todos updated: 7 items
          
让我先读取相关文件，了解当前的实现：







        
            
toolName: todo_write
            
status: success
          
Todos updated: 7 items
          
让我读取相关文件：










        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\spreadsheet\spreadsheetUtils.js
          
好的，现在让我逐一修复这些问题。首先处理最核心的问题 1：公式引用在行列操作后的错位问题。

我需要添加一个函数来更新公式中的单元格引用，然后修改 insertRow/deleteRow/insertCol/deleteCol 函数来使用它。








        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\spreadsheet\index.jsx
          
现在让我逐一修复这些问题。首先，在 spreadsheetUtils.js 中添加公式引用更新的函数，然后修改行列操作函数：












        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\spreadsheet\spreadsheetUtils.js
          
changes: undefined
          
现在让我修改 insertRow/deleteRow/insertCol/deleteCol 函数来同步更新公式引用：













        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\spreadsheet\spreadsheetUtils.js
          
changes: undefined
          
问题 1 修复完毕。现在让我继续处理 index.jsx 中的其他问题：内存泄漏、CSV 导入错误提示、localStorage 持久化和快捷键：











        
            
toolName: todo_write
            
status: success
          
Todos updated: 7 items
          
现在让我修改 index.jsx 来修复所有这些问题。我将一次性完成所有修改：


















        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\spreadsheet\index.jsx
          
changes: undefined
          
现在更新组件的状态管理，添加 localStorage、错误提示和监听器清理：


























        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\spreadsheet\index.jsx
          
changes: undefined
          
现在让我修改 handleMouseDown 等函数来追踪全局监听器，并添加组件卸载时的清理逻辑：

























        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\spreadsheet\index.jsx
          
changes: undefined
          
现在修改列宽和行高的拖拽调整函数来追踪监听器：




























        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\spreadsheet\index.jsx
          
changes: undefined
          
现在让我：1) 添加快捷键 Ctrl+B/Ctrl+I，2) 修复 CSV 导入错误提示，3) 添加 localStorage 自动保存和组件卸载时的监听器清理：
































        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\spreadsheet\index.jsx
          
changes: undefined
          
现在我需要更新 handleKeyDown 的依赖数组，然后修复 CSV 导入错误提示，并添加 localStorage 自动保存和监听器清理：

































        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\spreadsheet\index.jsx
          
changes: undefined
          
现在让我修复 CSV 导入错误提示，添加 localStorage 自动保存和组件卸载时的监听器清理：



































        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\spreadsheet\index.jsx
          
changes: undefined
          
现在让我在页面中添加错误消息的显示，并检查样式文件：

































        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\spreadsheet\index.jsx
          
现在让我在页面中添加错误消息的显示：



































        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\spreadsheet\index.jsx
          
changes: undefined
          
现在让我在样式文件中添加错误消息的样式：





































        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\spreadsheet\spreadsheet.css
          
现在让我在样式文件中添加错误消息的样式：






































        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\spreadsheet\spreadsheet.css
          
changes: undefined
          
好的，现在让我更新 todo 列表并添加单元测试：







































        
            
toolName: todo_write
            
status: success
          
Todos updated: 7 items
          
现在让我读取已有的测试文件并添加新的测试用例：








































        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\spreadsheet\spreadsheetUtils.test.js
          
现在让我在测试文件中添加新的测试用例：


















































        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\spreadsheet\spreadsheetUtils.test.js
          
changes: undefined
          
现在让我在测试文件末尾添加新的测试用例：

















































        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\spreadsheet\spreadsheetUtils.test.js
          
changes: undefined
          
现在让我运行测试看看是否通过：




















































        
            
toolName: todo_write
            
status: success
          
Todos updated: 7 items
          

        
            
toolName: run_command
            
status: success
          
command: cd "c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react" ; pnpm test src/pages/__tests__/spreadsheet/spreadsheetUtils.test.js undefined
          
我看到了几个问题。让我修复：

1. `shiftFormulaReferences` 函数生成的公式中有多余空格
2. 测试用例中一些预期值写错了
3. localStorage 在测试环境中需要用不同方式 mock

让我先修复 `shiftFormulaReferences` 函数：








































        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\spreadsheet\spreadsheetUtils.js
          
changes: undefined
          
现在让我修复测试文件中的问题：

1. 修正公式引用测试的预期值（A3 的行是 2，所以 delete-row index=2 时 A3 变成 #REF!）
2. 修正复杂公式测试
3. 修正 localStorage mock 方式










































        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\spreadsheet\spreadsheetUtils.test.js
          
changes: undefined
          
现在让我修复 localStorage 的 mock：










































        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\spreadsheet\spreadsheetUtils.test.js
          
changes: undefined
          
现在让我再次运行测试：












































        
            
toolName: run_command
            
status: success
          
command: cd "c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react" ; pnpm test src/pages/__tests__/spreadsheet/spreadsheetUtils.test.js undefined
          
所有 114 个测试通过了！现在让我运行 lint 检查：














































        
            
toolName: run_command
            
status: success
          
command: cd "c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react" ; npx eslint src/pages/spreadsheet/ src/pages/__tests__/spreadsheet/ undefined
          
我需要调整函数的顺序，把 toggleBold 和 toggleItalic 放到 handleKeyDown 前面。让我重新组织代码顺序：












































        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\spreadsheet\index.jsx
          
我需要把 applyStyle、toggleBold、toggleItalic 这些函数的定义移到 handleKeyDown 之前。让我重新组织代码：











































        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\spreadsheet\index.jsx
          
我需要把样式相关的函数移到 handleKeyDown 之前。让我先读取完整的代码结构，然后重新组织：
















































        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\spreadsheet\index.jsx
          
让我把样式相关的函数移到 handleKeyDown 之前。我会分步骤操作：

















































        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\spreadsheet\index.jsx
          
changes: undefined
          
现在让我删除原来位置的重复函数定义：


















































        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\spreadsheet\index.jsx
          
changes: undefined
          
现在让我再次运行 lint 检查：



















































        
            
toolName: run_command
            
status: success
          
command: cd "c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react" ; npx eslint src/pages/spreadsheet/ src/pages/__tests__/spreadsheet/ undefined
          
lint 通过了！现在让我再次运行所有测试，确保一切正常：



















































        
            
toolName: run_command
            
status: success
          
command: cd "c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react" ; pnpm test src/pages/__tests__/spreadsheet/spreadsheetUtils.test.js undefined
          
所有测试和 lint 都通过了！让我完成最后的任务：






















































        
            
toolName: todo_write
            
status: success
          
Todos updated: 7 items
          
所有 7 个问题已成功修复！以下是修复总结：

## 修复的问题

### 1. 公式引用在行列操作后错位 ✅
- 新增 `shiftFormulaReferences` 函数在 [spreadsheetUtils.js](file:///C:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/spreadsheet/spreadsheetUtils.js#L705-L775)，支持更新公式中的单元格和范围引用
- 修改 `insertRow`/`deleteRow`/`insertCol`/`deleteCol` 在操作前先更新所有公式引用
- 被删除的引用会变成 `#REF!`

### 2. 内存泄漏 ✅
- 在 [index.jsx](file:///C:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/spreadsheet/index.jsx#L53) 添加 `globalListenersRef` 追踪所有全局事件监听器
- [index.jsx](file:///C:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/spreadsheet/index.jsx#L560-L566) 组件卸载时批量清理所有监听器

### 3. CSV 导入失败静默吞错 ✅
- 新增 `errorMessage` 状态，导入失败时显示 "CSV 导入失败，请检查文件格式是否正确"
- 3 秒后自动消失
- 新增 [spreadsheet.css](file:///C:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/spreadsheet/spreadsheet.css#L349-L355) `.ss-error-message` 样式

### 4. localStorage 持久化 ✅
- 新增 `saveToLocalStorage` 和 `loadFromLocalStorage` 函数在 [spreadsheetUtils.js](file:///C:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/spreadsheet/spreadsheetUtils.js#L804-L826)
- 初始化时从 localStorage 加载，状态变化时自动保存

### 5. Ctrl+B 和 Ctrl+I 快捷键 ✅
- 在 [handleKeyDown](file:///C:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/spreadsheet/index.jsx#L278-L288) 中添加快捷键实现

### 6. 单元测试 ✅
新增 19 个测试用例（总共 114 个）：
- 公式引用更新：9 个测试
- 行列操作公式同步：5 个测试
- localStorage 持久化：5 个测试

### 7. 验证 ✅
- **114 个单元测试全部通过**
- **lint 检查全部通过**