我来修复这个问题，补充类型校验并添加对应测试。




        
            
toolName: todo_write
            
status: success
          
Todos updated: 2 items
          

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\grade-manager\gradeCore.js
          
changes: undefined
          
现在补充单元测试并运行全部测试：








        
            
toolName: todo_write
            
status: success
          
Todos updated: 2 items
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\grade-manager\gradeCore.test.js
          
让我查看剩余的测试内容并补充新的类型校验测试：










        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\grade-manager\gradeCore.test.js
          
现在补充针对类型校验的测试用例：









        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\grade-manager\gradeCore.test.js
          
changes: undefined
          
运行测试验证：












        
            
toolName: run_command
            
status: success
          
command: npx vitest run src/pages/__tests__/grade-manager/gradeCore.test.js undefined
          
94 个测试全部通过！再检查一下 lint：










        
            
toolName: GetDiagnostics
            
status: success
          
          

        
            
toolName: todo_write
            
status: success
          
Todos updated: 2 items
          
全部修复完成！以下是详细总结：

---

## ✅ 修复总结

### 1. `snapshotPreviousData` 增强类型校验 ✅
**修改**：[gradeCore.js](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/grade-manager/gradeCore.js#L60-L85)

原逻辑仅检查字段 key 是否存在（`existing.students && existing.subjects && existing.scores`），无法识别字段值为 `null`、字符串或非数组对象等损坏数据。

修复后校验条件：
```javascript
if (
  existing &&
  Array.isArray(existing.students) &&   // 必须是真正的数组
  Array.isArray(existing.subjects) &&   // 必须是真正的数组
  existing.scores &&
  typeof existing.scores === 'object'   // 必须是对象
) {
  return false  // 有效快照，不覆写
}
```

当快照存在但类型不合法时，会判定为无效并覆写为当前有效数据，避免刷新后加载损坏数据导致页面崩溃。

### 2. `removeSubject` 清理未使用变量 ✅
**修改**：[gradeCore.js](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/grade-manager/gradeCore.js#L151-L165)

将 `_removed` 改为 `_`（ESLint 约定的忽略前缀），避免 lint 告警。

### 3. 补充单元测试 ✅
**修改**：[gradeCore.test.js](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/__tests__/grade-manager/gradeCore.test.js)

新增 5 个测试用例覆盖类型校验场景：

| 测试用例 | 模拟损坏场景 |
|---------|------------|
| `students` 字段为 `null` | `{ students: null, subjects: [], scores: {} }` |
| `subjects` 字段为字符串 | `{ students: [], subjects: 'not array', scores: {} }` |
| `scores` 字段为 `null` | `{ students: [], subjects: [], scores: null }` |
| `students` 为对象而非数组 | `{ students: { 0: '张三' }, subjects: [], scores: {} }` |
| 缺失必需字段 | `{ foo: 'bar' }` |

### 最终结果
- **测试**：94 个全部通过 ✅
- **Lint**：无诊断错误 ✅