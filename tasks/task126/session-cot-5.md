toolName: todo_write
            
status: success
          
Todos updated: 2 items
          
先确认当前代码状态：

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\bill-splitter\utils.js
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\bill-splitter\index.jsx
          
修复方案：`message` 只做标题（费用序号 + 概括性提示），具体错误由下方 `errors` 逐字段展示，避免重复。




        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\bill-splitter\utils.js
          
changes: undefined
          
现在更新测试文件中对应的断言：







        
            
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
          
**66 个测试全部通过**，Lint 零错误。

---

## 修复总结

### 问题：错误信息重复展示

同一费用有多个字段校验不通过时，汇总行（`message`）和子弹列表（`errors`）两边都展示了相同的错误文本，导致重复。

### 修复方案

**[utils.js#L288-L304](file:///C:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/bill-splitter/utils.js#L288-L304)**  
`message` 从拼接所有错误的汇总字符串改为**仅标题行**：`费用 #N 信息不完整：`。具体错误文本只放在 `errors` 字段中，由调用方逐字段渲染，保证每条错误只出现一次。

**[index.jsx#L113-L124](file:///C:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/bill-splitter/index.jsx#L113-L124)**  
渲染结构保持两层（标题 + 列表），但内容上：
- 第一行（加粗）：`费用 #1 信息不完整：` — 只定位到哪条费用有问题
- 下面子弹列表：逐字段列出「请输入费用描述」「金额必须大于0」等具体错误

两层职责分离，信息不重复。

### 测试更新

**[utils.test.js#L570-L768](file:///C:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/__tests__/bill-splitter/utils.test.js#L570-L768)**  
`validateAllExpenses` 测试从 12 个调整为 13 个，核心验证点：
- `message` 只包含费用序号，**不包含**任何具体错误文本（`not.toContain` 断言）
- `errors` 对象包含对应字段的具体错误文本
- 多字段同时出错时，`errors` 中每个字段都有独立的错误消息，且内容互不相同
- `expenseIndex` 在合法时返回 `-1`、出错时返回对应索引