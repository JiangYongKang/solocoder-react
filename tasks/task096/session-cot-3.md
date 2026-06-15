好的，我来修复这两个残留问题。


        
            
toolName: todo_write
            
status: success
          
Todos updated: 3 items
          
先查看相关代码确认问题：




        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\link-game\index.jsx
          
确认了问题。让我同时查看 renderBoard 部分：






        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\link-game\index.jsx
          

        
            
toolName: search_by_regex
            
status: success
          
query: calculateScore
          
现在修复这两处问题：







        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\link-game\index.jsx
          
changes: undefined
          

        
            
toolName: todo_write
            
status: success
          
Todos updated: 3 items
          
现在修复第二处 - 通关覆盖层中残留的 difficulty 参数：









        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\link-game\index.jsx
          

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\link-game\index.jsx
          
changes: undefined
          

        
            
toolName: todo_write
            
status: success
          
Todos updated: 3 items
          
现在运行测试验证所有修改：









        
            
toolName: run_command
            
status: success
          
command: pnpm test src/pages/__tests__/link-game/linkGameCore.test.js undefined
          
所有 51 个测试全部通过。再用诊断工具检查一下：











        
            
toolName: GetDiagnostics
            
status: success
          
          

        
            
toolName: GetDiagnostics
            
status: success
          
          

        
            
toolName: todo_write
            
status: success
          
Todos updated: 3 items
          
所有残留问题已修复完成，验证全部通过。

---

## 🔧 修复内容总结

### 1. 步数双重计数问题
- [index.jsx #L190-L203](file:///C:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/link-game/index.jsx#L190-L203)

**问题：** `handleCellClick` 中消除成功的 `setTimeout` 回调里，调用 `calculateScore` 和写入 entry 时使用了 `currentState.steps + 1`，但 `setSteps((s) => s + 1)` 在点击时就已触发，500ms 延迟后 `stateRef.current.steps` 已经是递增后的值，额外 `+1` 导致多算一步惩罚。

**修复：** 移除 `+ 1`，直接使用 `currentState.steps`

### 2. 残留 difficulty 参数
- [index.jsx #L490-L495](file:///C:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/link-game/index.jsx#L490-L495)

**问题：** 通关覆盖层中 `calculateScore` 调用仍传入 `difficulty` 参数，与 `linkGameCore.js` 中已移除 `difficulty` 参数的函数签名不一致。

**修复：** 移除 `difficulty` 传参

---

## ✅ 验证结果

- **单元测试**：51/51 全部通过
- **Lint 诊断**：所有文件 0 错误 0 警告