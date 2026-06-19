我来分析这个问题并修复。首先查看当前 `resetFailedApp` 的实现：
        
            
toolName: todo_write
            
status: success
          
Todos updated: 3 items
          

        
            
toolName: search_by_regex
            
status: success
          
query: resetFailedApp
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\micro-frontend\lifecycle.js
          
现在我理解问题了。`resetFailedApp` 只是修改了 status 和 failedResources，但保留了旧的 lifecycle.stages 中的 loading 记录。当重试时，新的 loading 阶段会被追加，导致出现两个 loading 节点。

修复方案：在 `resetFailedApp` 中同时清除旧的生命周期数据，因为失败的加载周期数据不应该被保留到新的重试流程中：

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\micro-frontend\lifecycle.js
          
changes: undefined
          
现在更新单元测试。首先看一下现有的 resetFailedApp 测试，然后更新并添加重试场景测试：



        
            
toolName: todo_write
            
status: success
          
Todos updated: 3 items
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\micro-frontend\utils.test.js
          
现在更新测试，增强 `resetFailedApp` 的断言，并补充完整的重试场景测试：


        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\micro-frontend\utils.test.js
          
changes: undefined
          
现在运行测试验证：





        
            
toolName: todo_write
            
status: success
          
Todos updated: 3 items
          

        
            
toolName: run_command
            
status: success
          
command: cd c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react ; npm run test -- src/pages/__tests__/micro-frontend/utils.test.js 2>&1 | Select-Object -Last 15 undefined
          
106 个测试全部通过。再运行 ESLint 确认：






        
            
toolName: run_command
            
status: success
          
command: cd c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react ; npx eslint src/pages/micro-frontend src/pages/__tests__/micro-frontend 2>&1 undefined
          

        
            
toolName: todo_write
            
status: success
          
Todos updated: 3 items
          
---

## 修复完成

已解决 LOAD_FAILED 重试后出现两个 loading 阶段节点的问题。以下是改动：

### 1. [lifecycle.js](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/micro-frontend/lifecycle.js) （[resetFailedApp](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/micro-frontend/lifecycle.js#L117-L134)）

**问题根源**：`resetFailedApp` 之前只重置 `status` 和 `failedResources`，保留了旧的 `lifecycle.stages` 中的 loading 记录。重试时新的 loading 阶段会被追加，导致 `stages` 数组出现两个 loading。

**修复**：在 `resetFailedApp` 中同时清空生命周期数据：
```javascript
return {
  app: {
    ...app,
    status: APP_STATUS.STOPPED,
    failedResources: [],
    lifecycle: {
      stages: [],
      currentStage: null,
    },
  },
  error: null,
};
```

**设计原则**：失败的加载周期是一次无效尝试，其数据不应该被保留到新的重试流程中。这与 `resetAppForRestart`（保留成功的 loading 阶段）形成明确区分。

### 2. [utils.test.js](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/__tests__/micro-frontend/utils.test.js) （106 个测试全部通过）

- **更新** `should reset failed app to stopped` → `should reset failed app to stopped and clear old lifecycle data`：断言 lifecycle.stages 被清空
- **新增** `resetFailedApp handles app without lifecycle field gracefully`：边界测试，确保应用对象缺失 lifecycle 字段时也能正确重置
- **新增** `retry after load failure results in only one loading stage`：完整端到端重试场景测试
  - 第一次加载失败 → 记录一个 loading 阶段（300ms）
  - 调用 resetFailedApp → 断言 lifecycle.stages 被清空
  - 第二次重试加载成功 → 断言 stages 数组中**只有 1 个** loading 阶段（600ms），而非 2 个

### 验证结果

```
Test Files  1 passed (1)
     Tests  106 passed (106)
ESLint: 0 problems
```