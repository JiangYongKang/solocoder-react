toolName: todo_write
            
status: success
          
Todos updated: 2 items
          
先读取当前 index.jsx 的 processAlerts 相关代码：

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\performance-monitor\index.jsx
          
找到问题了。`if` 分支中 `inactiveRuleIds` 就是"之前告警、现在已解除"的规则 ID，但只做了 `delete` 没调用 `resolveAlertRecords`。修复：


        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\performance-monitor\index.jsx
          
changes: undefined
          

        
            
toolName: todo_write
            
status: success
          
Todos updated: 2 items
          
现在运行测试和 lint：

        
            
toolName: run_command
            
status: success
          
command: pnpm vitest run src/pages/__tests__/performance-monitor ; pnpm eslint src/pages/performance-monitor src/pages/__tests__/performance-monitor --no-warn-ignored undefined
          

        
            
toolName: todo_write
            
status: success
          
Todos updated: 2 items
          
修复完成 ✅

---

### 修复说明

**问题**：当多个告警同时触发，但只有部分告警解除时（例如 FPS 还在告警但内存已恢复正常），`if` 分支中虽然通过 `inactiveRuleIds` 正确识别了"已解除告警"的规则 ID，但只做了 `delete` 清理引用，没有调用 `resolveAlertRecords`，导致这些告警的 `duration` 始终为 `null`。

**修复位置**：[index.jsx](file:///C:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/performance-monitor/index.jsx#L88-L98)

在 `if (inactiveRuleIds.length > 0)` 块中，`delete` 清理引用后追加了对 `resolveAlertRecords` 的调用：

```js
setAlertRecords((prevRecords) =>
  resolveAlertRecords(prevRecords, inactiveRuleIds, now)
)
```

这样无论是"**全解除场景**"（`else` 分支，所有告警全部恢复正常）还是"**部分解除场景**"（`if` 分支，还有其他告警在触发），已解除告警的持续时间都会被正确计算并写入记录。

### 验证结果

| 项目 | 结果 |
|------|------|
| 单元测试 | ✅ **82/82 全部通过** |
| ESLint | ✅ **0 error 0 warning** |