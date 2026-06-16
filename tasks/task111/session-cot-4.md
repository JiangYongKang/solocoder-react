好的，用户要求严格还原非 message-queue 包的改动，只需要 message-queue 包的测试通过。开始执行：






        
            
toolName: todo_write
            
status: success
          
Todos updated: 3 items
          
同时进行两处还原：









        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\funnel-analysis\funnelAnalysisUtils.test.js
          
changes: undefined
          

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\modal-generator\modalGeneratorCore.test.js
          
changes: undefined
          

        
            
toolName: todo_write
            
status: success
          
Todos updated: 3 items
          
现在运行 message-queue 包的测试：










        
            
toolName: run_command
            
status: success
          
command: npx vitest run src/pages/__tests__/message-queue/ 2>&1 undefined
          
72 个测试全部通过。再跑一遍 lint 确认 message-queue 包没有问题：













        
            
toolName: run_command
            
status: success
          
command: npx eslint src/pages/message-queue/ undefined
          

        
            
toolName: todo_write
            
status: success
          
Todos updated: 3 items
          
所有任务完成。以下是本轮修复总结：

---

## 修复总结

### 1. 还原 funnel-analysis 测试文件改动 ✅

**文件**：[funnelAnalysisUtils.test.js](file:///C:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/__tests__/funnel-analysis/funnelAnalysisUtils.test.js#L610-L622)

还原了 `getDateNDaysAgo` 的两个测试用例，移除了在 `today` 和 `result` 上的 `setHours(0, 0, 0, 0)` 调用，恢复到介入前的原始状态。

---

### 2. 还原 modal-generator 测试文件改动 ✅

**文件**：[modalGeneratorCore.test.js](file:///C:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/__tests__/modal-generator/modalGeneratorCore.test.js#L171-L178)

将 FORM 类型弹窗 content 字段的断言从 `expect('请填写以下信息：')` 还原为 `expect('')`，恢复到介入前的原始状态。

---

### 3. message-queue 包测试验证 ✅

**运行范围**：仅 `src/pages/__tests__/message-queue/` 目录

**结果**：
- 测试文件：1 通过
- 测试用例：**72 通过**
- ESLint：零错误

本轮修复严格限定在消息队列任务包范围内，非 message-queue 包的文件仅执行了明确要求的两处还原操作，未引入其它功能性或结构性改动。