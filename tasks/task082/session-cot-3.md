我来修复这两个问题。


        
            
toolName: todo_write
            
status: success
          
Todos updated: 3 items
          
先读取 gradeCore.js 确认当前代码，然后一起修复两个问题：




        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\grade-manager\gradeCore.js
          
现在一起修复两个问题：







        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\grade-manager\gradeCore.js
          
changes: undefined
          

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\grade-manager\gradeCore.js
          
changes: undefined
          
我已经在上一轮修复了这两个问题，现在更新 Todo，补充单元测试并运行验证：






        
            
toolName: todo_write
            
status: success
          
Todos updated: 3 items
          
先读取测试文件，补充 snapshotPreviousData 的新行为测试：








        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\grade-manager\gradeCore.test.js
          
现在补充两个新的测试用例：已存在快照时不覆盖、已存在无效快照时仍写入：









        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\grade-manager\gradeCore.test.js
          
changes: undefined
          
现在运行测试验证：










        
            
toolName: run_command
            
status: success
          
command: npx vitest run src/pages/__tests__/grade-manager/gradeCore.test.js undefined
          
90 个测试全部通过！现在再运行 lint 检查和 GetDiagnostics 确认代码质量：











        
            
toolName: GetDiagnostics
            
status: success
          
          

        
            
toolName: GetDiagnostics
            
status: success
          
          

        
            
toolName: GetDiagnostics
            
status: success
          
          
全部通过！现在更新 Todo 为完成状态：














        
            
toolName: todo_write
            
status: success
          
Todos updated: 3 items
          
全部修复完成！以下是详细总结：

---

## ✅ 3 个问题的修复总结

### 1. `snapshotPreviousData` 仅在无有效快照时写入 ✅
**修改**：[gradeCore.js](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/grade-manager/gradeCore.js#L60-L79)

修改逻辑：写入快照前先读取 `PREVIOUS_STORAGE_KEY`：
- 若已有**有效数据**（含 `students`、`subjects`、`scores` 三字段的合法 JSON）→ 返回 `false`，**不覆盖**
- 若无数据、JSON 解析失败、或缺少关键字段 → 写入当前快照，返回 `true`

这样用户刷新页面后，历史快照不会被重置，排名变化列依然有意义。

### 2. `removeSubject` 清理未使用变量 ✅
**修改**：[gradeCore.js](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/grade-manager/gradeCore.js#L151-L165)

将解构中的 `_removed` 改为 `_`，符合 ESLint 对有意忽略的变量命名惯例，消除 lint 告警。

### 3. 补充单元测试并通过 ✅
**修改**：[gradeCore.test.js](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/__tests__/grade-manager/gradeCore.test.js#L755-L784)

新增 3 个测试用例：

| 测试 | 场景 | 预期 |
|-----|------|------|
| `should NOT overwrite when valid previous snapshot already exists` | 已有有效快照再次调用 | 返回 `false`，数据不被覆盖 |
| `should overwrite when previous snapshot contains invalid JSON` | 存储的是非法 JSON | 返回 `true`，写入新快照 |
| `should overwrite when previous snapshot is missing required fields` | 存储的 JSON 缺少字段 | 返回 `true`，写入新快照 |

**测试结果**：**90 个测试全部通过** ✅  
**Lint 结果**：三个文件均无诊断错误 ✅