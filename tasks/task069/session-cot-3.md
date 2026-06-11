我来修复这两个问题。首先读取相关代码，然后制定修复计划：


        
            
toolName: todo_write
            
status: success
          
Todos updated: 3 items
          

        
            
toolName: todo_write
            
status: success
          
Todos updated: 3 items
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\websocket-debugger\wsDebuggerUtils.js
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\websocket-debugger\index.jsx
          
现在我来修复这两个问题。首先修复 `highlightKeyword` 的递归问题：





        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\websocket-debugger\wsDebuggerUtils.js
          
changes: undefined
          

        
            
toolName: todo_write
            
status: success
          
Todos updated: 3 items
          
现在修复第二个问题。首先在 `wsDebuggerUtils.js` 中添加 `formatCloseError` 函数：





        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\websocket-debugger\wsDebuggerUtils.js
          
changes: undefined
          
现在更新 `index.jsx`，导入并使用 `formatCloseError`：







        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\websocket-debugger\index.jsx
          
changes: undefined
          
现在更新 `ws.onclose` 中的错误信息格式化：










        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\websocket-debugger\index.jsx
          
changes: undefined
          

        
            
toolName: todo_write
            
status: success
          
Todos updated: 3 items
          
现在更新测试文件，添加 `formatCloseError` 的测试用例：









        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\websocket-debugger\wsDebuggerUtils.test.js
          

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\websocket-debugger\wsDebuggerUtils.test.js
          
changes: undefined
          
现在添加 `formatCloseError` 的测试用例：












        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\websocket-debugger\wsDebuggerUtils.test.js
          

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\websocket-debugger\wsDebuggerUtils.test.js
          
changes: undefined
          
现在运行测试验证所有修复：













        
            
toolName: run_command
            
status: success
          
command: cd c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react ; pnpm run test 2>&1 | Select-Object -Last 10 undefined
          
全部 5549 个测试通过。让我再检查 lint 和构建：















        
            
toolName: run_command
            
status: success
          
command: cd c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react ; npx eslint src/pages/websocket-debugger/ 2>&1 undefined
          

        
            
toolName: todo_write
            
status: success
          
Todos updated: 3 items
          
所有问题已修复完毕。以下是修复总结：

## 修复内容

### 1. `highlightKeyword` 递归改为迭代实现
**修改文件**：[wsDebuggerUtils.js](file:///C:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/websocket-debugger/wsDebuggerUtils.js#L55-L87)

**原问题**：递归调用 `highlightKeyword(after, keyword)`，匹配次数越多递归深度越深，长文本有栈溢出风险。

**修复方案**：改用循环迭代实现——先用 `while` 循环收集所有匹配位置的索引，再遍历索引数组构建结果字符串，无递归调用，任意长度文本都安全。

---

### 2. `ws.onclose` 错误提示包含 code 和 reason 字段
**新增函数**：[formatCloseError(code, reason)](file:///C:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/websocket-debugger/wsDebuggerUtils.js#L73-L81)

- 内置 16 种标准 WebSocket 关闭码描述（1000 正常关闭、1002 协议错误、1006 连接异常中断、1015 TLS 握手失败等）
- 输出格式：`[code] 描述: reason`，如 `[1006] 连接异常中断` 或 `[1008] 违反政策: token expired`
- code 为 null/undefined 时显示 `[N/A]`
- reason 为空/空白时不显示冒号和 reason

**修改逻辑**：[index.jsx](file:///C:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/websocket-debugger/index.jsx#L434-L450) 中 `ws.onclose` 使用 `formatCloseError(event.code, event.reason)` 生成错误信息。

---

## 验证结果
- ✅ 全部测试通过：5549/5549
- ✅ ESLint 检查通过
- ✅ WebSocket 调试工具新增 9 个测试用例（`formatCloseError` 功能覆盖）