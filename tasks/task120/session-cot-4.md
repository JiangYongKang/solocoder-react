我来修复 ImportDialog 的 JSON 编辑区。首先找到相关代码：





        
            
toolName: todo_write
            
status: success
          
Todos updated: 2 items
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\network-interceptor\index.jsx
          
现在修改 ImportDialog，将 textarea 替换为 JsonEditorWithLineNumbers 并显示错误行号：










        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\network-interceptor\index.jsx
          
changes: undefined
          
现在更新 todo 并运行测试：















        
            
toolName: todo_write
            
status: success
          
Todos updated: 2 items
          

        
            
toolName: run_command
            
status: success
          
command: cd "c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react" ; pnpm test -- src/pages/__tests__/network-interceptor/ ; pnpm eslint src/pages/network-interceptor/ src/pages/__tests__/network-interceptor/ undefined
          
完美！所有 103 个测试通过，lint 检查也通过。让我更新 todo：

















        
            
toolName: todo_write
            
status: success
          
Todos updated: 2 items
          
修复完成！以下是本次修复的内容总结：

---

## 🔧 修复总结

### 问题：ImportDialog 的 JSON 粘贴区未使用 JsonEditorWithLineNumbers

**修改文件**: [index.jsx](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/network-interceptor/index.jsx#L399-L451)

**修改内容**：

1. **将原生 `<textarea>` 替换为 `JsonEditorWithLineNumbers` 组件**
   - 移除原来的 `className="ni-form-textarea"` 和 `style={{ minHeight: 100 }}`
   - 改为使用 `JsonEditorWithLineNumbers` 组件，设置 `minHeight="120px"`

2. **适配 `onChange` 回调签名**
   - 原生 textarea 的 `onChange` 接收 `event` 对象，需要 `e.target.value` 取值
   - `JsonEditorWithLineNumbers` 的 `onChange` 直接传递 `text` 字符串值
   - 修改 `handleJsonChange` 签名：从 `(e) => ...` 改为 `(text) => ...`

3. **添加错误行号显示**
   - 在 label 中使用 `getJsonErrorLine` 获取错误行号
   - JSON 校验失败时显示：`JSON 错误（第 N 行）`

4. **编辑区自动显示红色高亮**
   - 行号栏：错误行背景红色高亮 + 加粗
   - 编辑区：错误行显示红色背景条 + 左侧红色竖条
   - 整个编辑器边框变红

---

### ✅ 所有 JSON 编辑区现已统一

| 区域 | 位置 | 带行号/高亮 |
|------|------|------------|
| Mock 编辑器 - 原始响应 | 左侧 | ✅ |
| Mock 编辑器 - Mock 替换 | 右侧 | ✅ |
| ResponseRuleDialog - Mock 响应体 | 新增规则弹窗 | ✅ |
| sendBody - 请求体 | 发送测试请求 | ✅ |
| ImportDialog - 粘贴 JSON | 导入规则弹窗 | ✅ |

---

### 验证结果 ✅

```
Test Files  1 passed (1)
Tests       103 passed (103)
ESLint      0 errors
```

所有 103 个测试用例全部通过，ESLint 检查 0 错误。