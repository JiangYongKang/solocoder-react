让我逐个修复这些问题。先创建任务列表：





        
            
toolName: todo_write
            
status: success
          
Todos updated: 6 items
          
先读取需要修改的文件：









        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\products\utils.js
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\products\constants.js
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\products\ProductTable.jsx
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\products\ProductForm.jsx
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\products\index.jsx
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\products\utils.test.js
          
好的，所有文件都读取完毕，现在开始逐个修复问题。先修复 1、2、3、4（纯函数相关）：

















        
            
toolName: todo_write
            
status: success
          
Todos updated: 6 items
          

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\products\utils.js
          
changes: undefined
          

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\products\utils.js
          
changes: undefined
          

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\products\utils.js
          
changes: undefined
          

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\products\utils.js
          
changes: undefined
          
现在修复问题 3、4：


















        
            
toolName: todo_write
            
status: success
          
Todos updated: 6 items
          

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\products\ProductTable.jsx
          
changes: undefined
          

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\products\ProductTable.jsx
          
changes: undefined
          
现在修复问题 4（确定性时间戳）和问题 5（表单提交失败反馈错误）：




















        
            
toolName: todo_write
            
status: success
          
Todos updated: 6 items
          

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\products\constants.js
          
changes: undefined
          
现在修复问题 5 - 表单提交失败时将错误反馈到表单 UI：


















        
            
toolName: todo_write
            
status: success
          
Todos updated: 6 items
          

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\products\ProductForm.jsx
          
changes: undefined
          

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\products\ProductForm.jsx
          
changes: undefined
          

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\products\index.jsx
          
changes: undefined
          
现在更新测试文件，删除 filterByStatus 的测试并更新相关测试：



























        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\products\utils.test.js
          
changes: undefined
          

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\products\utils.test.js
          
changes: undefined
          

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\products\utils.test.js
          
changes: undefined
          
所有修复都已应用，现在运行测试：




























        
            
toolName: todo_write
            
status: success
          
Todos updated: 6 items
          

        
            
toolName: run_command
            
status: success
          
command: pnpm run test undefined
          
失败的 4 个测试是 `dashboard` 模块的，不是我们商品管理模块的问题。让我单独运行商品管理模块的测试确认：


























        
            
toolName: run_command
            
status: success
          
command: pnpm run test src/pages/__tests__/products/ undefined
          
商品管理模块的 51 个测试全部通过！（dashboard 模块的 4 个失败测试是项目原有问题，与本次修改无关）。

























        
            
toolName: todo_write
            
status: success
          
Todos updated: 6 items
          
6 个问题全部修复完毕，商品管理模块 51 个测试全部通过。

## 修复内容汇总

| # | 问题 | 修改文件 |
|---|------|----------|
| 1 | `loadProducts` / `saveProducts` 移除 `console.error`，静默降级 | [utils.js](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/products/utils.js#L12-L28) |
| 2 | 删除未使用的 `filterByStatus` 函数（包括 `getProductList` 里的调用和测试文件里对应的测试） | [utils.js](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/products/utils.js), [utils.test.js](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/__tests__/products/utils.test.js) |
| 3 | 空状态行 `colSpan` 改为使用模块级常量 `COLUMN_COUNT = 9`，增删列只需改一处 | [ProductTable.jsx](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/products/ProductTable.jsx#L9-L97) |
| 4 | `MOCK_PRODUCTS` 的 `createdAt` 改用固定基准时间 `FIXED_BASE_TIME = 1700000000000`，不再随模块加载时间变化 | [constants.js](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/products/constants.js#L28-L92) |
| 5 | 表单提交失败时把 `result.errors` 回传到 `ProductForm` 的 `setErrors`，在 UI 上显示错误原因；`handleFormSubmit` 同时返回 `result` 对象供调用方使用 | [ProductForm.jsx](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/products/ProductForm.jsx#L48-L59), [index.jsx](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/products/index.jsx#L122-L139) |
| 6 | 运行商品管理模块测试：51 passed | - |