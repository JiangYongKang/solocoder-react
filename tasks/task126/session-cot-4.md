toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\bill-splitter\utils.js
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\bill-splitter\index.jsx
          

        
            
toolName: todo_write
            
status: success
          
Todos updated: 2 items
          
两处需要修改：`utils.js` 中让 `message` 包含所有字段错误；`index.jsx` 中消费 `errors` 和 `expenseIndex` 逐字段渲染。

先修改 `validateAllExpenses`，将所有字段错误拼接进 message：
        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\bill-splitter\utils.js
          
changes: undefined
          
现在修改 `index.jsx`，让调用方消费 `errors` 和 `expenseIndex` 逐字段渲染每项校验失败提示：
        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\bill-splitter\index.jsx
          
changes: undefined
          

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\bill-splitter\index.jsx
          
changes: undefined
          

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\bill-splitter\index.jsx
          
changes: undefined
          
现在修改渲染部分，将单一错误文本改为逐字段渲染：
        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\bill-splitter\index.jsx
          
changes: undefined
          

        
            
toolName: todo_write
            
status: success
          
Todos updated: 2 items
          
现在更新测试文件，修正 `validateAllExpenses` 的测试以覆盖多字段同时错误的场景：
        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\bill-splitter\utils.test.js
          

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\bill-splitter\utils.test.js
          
changes: undefined
          
运行 Lint 检查和测试：
        
            
toolName: run_command
            
status: success
          
command: cd c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react ; npx eslint src/pages/bill-splitter/ src/pages/__tests__/bill-splitter/ --no-error-on-unmatched-pattern 2>&1 undefined
          

        
            
toolName: run_command
            
status: success
          
command: cd c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react ; npx vitest run src/pages/__tests__/bill-splitter/ 2>&1 undefined
          

        
            
toolName: todo_write
            
status: success
          
Todos updated: 2 items
          
**65 个测试全部通过**，Lint 零错误。修复总结：

---

## 修复内容

### 1. validateAllExpenses 多字段错误一次性展示

**问题**：`message` 只取 `errors` 第一个键的错误信息（`Object.keys(errors)[0]`），多字段同时不完整时用户需多次提交才能逐个发现。`errors` 和 `expenseIndex` 在调用方 `openSaveModal` 中未被消费，属于死代码。

**修复**：

[utils.js#L288-L305](file:///C:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/bill-splitter/utils.js#L288-L305) — `message` 改为用 `Object.values(errors).join('；')` 拼接所有字段错误，如 `费用 #1：请输入费用描述；金额必须大于0；请选择支付人`；`expenseIndex` 对合法/空列表场景统一返回 `-1`。

[index.jsx#L41-L51](file:///C:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/bill-splitter/index.jsx#L41-L51) — `saveError`（字符串）改为 `saveErrors`（对象），存储 `{ message, errors, expenseIndex }`，调用方完整消费返回值。

[index.jsx#L113-L124](file:///C:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/bill-splitter/index.jsx#L113-L124) — 渲染改为：先展示汇总 `message`（加粗），再逐字段渲染 `errors` 中每项校验失败提示（缩进 + 项目符号），消除死代码。

### 2. 新增测试

[utils.test.js#L718-L759](file:///C:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/__tests__/bill-splitter/utils.test.js#L718-L759) — 新增 2 个测试用例：
- **四字段同时不完整**（描述空、金额0、无支付人、无分摊人）— 验证 `errors` 包含全部 4 个字段，`message` 同时包含所有错误文本
- **两字段不完整**（描述空+金额0）— 验证 `errors` 恰好 2 个键，`message` 用 `；` 连接两条错误