toolName: todo_write
            
status: success
          
Todos updated: 3 items
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\bill-splitter\utils.js
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\bill-splitter\SettlementPanel.jsx
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\bill-splitter\bill-splitter.css
          

        
            
toolName: search_by_regex
            
status: success
          
query: settlement-arrow
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\bill-splitter\bill-splitter.css
          
现在开始修复。先修复 `validateAllExpenses` 传递字段级错误信息：

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\bill-splitter\utils.js
          
changes: undefined
          

        
            
toolName: todo_write
            
status: success
          
Todos updated: 3 items
          
现在修复 CSS 类名，将 `settlement-arrow` 改为语义匹配的 `settlement-action`：



        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\bill-splitter\SettlementPanel.jsx
          
changes: undefined
          

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\bill-splitter\bill-splitter.css
          
changes: undefined
          

        
            
toolName: todo_write
            
status: success
          
Todos updated: 3 items
          
现在读取并更新测试文件中的 `validateAllExpenses` 相关测试：




        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\bill-splitter\utils.test.js
          

        
            
toolName: search_by_regex
            
status: success
          
query: validateAllExpenses
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\bill-splitter\utils.test.js
          
现在更新 `validateAllExpenses` 的测试，覆盖新的字段级错误信息返回结构：





        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\bill-splitter\utils.test.js
          
changes: undefined
          
现在运行 Lint 和测试验证所有修复：





        
            
toolName: run_command
            
status: success
          
command: cd c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react ; npx eslint src/pages/bill-splitter/ src/pages/__tests__/bill-splitter/ --no-error-on-unmatched-pattern 2>&1 undefined
          
Lint 检查通过。运行单元测试：







        
            
toolName: run_command
            
status: success
          
command: cd c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react ; npx vitest run src/pages/__tests__/bill-splitter/ 2>&1 undefined
          

        
            
toolName: todo_write
            
status: success
          
Todos updated: 3 items
          
全部 3 个问题已修复完成，**63 个测试全部通过**，Lint 零错误。

---

## 修复总结

### 1. validateAllExpenses 传递字段级详细错误信息
[utils.js#L288-L305](file:///C:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/bill-splitter/utils.js#L288-L305)

**修改前**：统一返回 `费用 #X 信息不完整，请检查后重试` 这种泛化消息，丢弃了 `validateExpense` 产出的字段级详细错误。

**修改后**：返回结构包含 4 个字段：
- `valid` — 是否全部通过
- `message` — 人类可读的汇总消息，格式为 `费用 #N：具体错误`（如 `费用 #1：请输入费用描述`）
- `errors` — 透传 `validateExpense` 的字段级错误对象（如 `{ description: '请输入费用描述', amount: '金额必须大于0' }`）
- `expenseIndex` — 出错的费用索引（0 开始），方便上层定位

### 2. SettlementPanel CSS 类名语义化
- [SettlementPanel.jsx#L81](file:///C:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/bill-splitter/SettlementPanel.jsx#L81) — 类名从 `settlement-arrow` 改为 `settlement-action`
- [bill-splitter.css#L500](file:///C:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/bill-splitter/bill-splitter.css#L500) — 同步更新 CSS 选择器

文字内容是"需支付"而非箭头，类名改为 `settlement-action` 更贴合语义。

### 3. 单元测试补充
[utils.test.js#L570-L715](file:///C:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/__tests__/bill-splitter/utils.test.js#L570-L715)

`validateAllExpenses` 测试从 7 个扩充到 10 个，新增覆盖：
- 描述为空时 `errors.description` 存在且消息包含「请输入费用描述」
- 金额为 0 时 `errors.amount` 存在且消息包含「金额必须大于0」
- 未选支付人时 `errors.payerId` 存在且消息包含「请选择支付人」
- 分摊人为空时 `errors.sharedWith` 存在
- 自定义比例不合法时 `errors.ratios` 存在且消息包含「分摊比例之和必须为100%」
- 多条费用第二条出错时 `expenseIndex === 1` 且序号正确