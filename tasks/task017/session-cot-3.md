让我分析这些问题并逐个修复。先读取相关文件：







        
            
toolName: todo_write
            
status: success
          
Todos updated: 4 items
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\workflow\workflowCore.js
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\workflow\index.jsx
          
让我先修复 **问题 1**（恢复循环检测）和 **问题 2**（移除 edge.source/target 的 truthiness 校验）。先看 workflowCore.js：

---

**问题分析：**

1. **循环检测**：BFS 中用 `visited.has(currentNodeId) { continue }` 静默跳过重复节点，不再发出 loop 事件。需要恢复：当 dequeue 到已访问且非 END 类型节点时，标记为循环。
2. **importFromJson**：`!edge.source ||` 和 `!edge.target ||` 是额外加的 truthiness 检查，需要去掉，只保留 `nodeIds.has()` 引用存在性校验。
3. **index.jsx**：loop 事件分支是有用的，恢复循环检测后它自然会被执行到。


        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\workflow\workflowCore.js
          
changes: undefined
          
现在修复 simulateExecution，恢复循环检测。BFS 中 END 节点的重复是并行分支正常收敛，静默跳过；其他已访问节点重复则标记为循环：











        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\workflow\workflowCore.js
          
changes: undefined
          
现在更新测试文件。需要：
1. 将 loop 测试改回检测 `{ type: 'loop', nodeId: '...' }` 事件
2. 新增测试：并行网关多分支收敛到 END 节点不触发误报 loop
3. 新增测试：edge 使用 falsy 字符串 id（如 `'0'`）能通过校验













        
            
toolName: todo_write
            
status: success
          
Todos updated: 5 items
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\workflow\workflowCore.test.js
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\workflow\workflowCore.test.js
          
现在更新 loop 测试，恢复检测 `{ type: 'loop' }` 事件，并新增并行收敛和 falsy id 测试：












        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\workflow\workflowCore.test.js
          
changes: undefined
          
现在运行 workflow 测试确保所有测试通过：














        
            
toolName: run_command
            
status: success
          
command: pnpm test -- src/pages/__tests__/workflow/workflowCore.test.js undefined
          
发现问题：BFS 入队时我们有 `if (!visited.has(edge.target))` 这个守卫，所以已访问节点永远不会被入队，dequeue 时的 visited 检查自然永远不会触发。需要把循环检测移到**入队时**进行：














        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\workflow\workflowCore.js
          
changes: undefined
          
等等，我发现一个问题：入队时两个并行分支可能都会入队同一个 END 节点（因为入队时它还没被处理），导致 dequeue 时重复。需要在 dequeue 时加个简单的 visited 跳过（不触发 loop），保证效率和正确性：

Wait, let me re-examine the logic more carefully. The `tryEnqueue` only checks visited at enqueue time, but two parallel branches could both enqueue the same END node since neither has processed it yet. At dequeue, we need a guard to skip already-visited nodes silently:









        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\workflow\workflowCore.js
          
changes: undefined
          
现在再运行测试：















        
            
toolName: run_command
            
status: success
          
command: pnpm test -- src/pages/__tests__/workflow/workflowCore.test.js undefined
          
测试通过（exit code 0）！现在检查 375px 布局，启动 dev 服务器：

















        
            
toolName: todo_write
            
status: success
          
Todos updated: 5 items
          
让我先检查 CSS 中 375px 的布局是否完善：


















        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\workflow\workflow.css
          
CSS 基础的 375px 适配已具备，但我发现模拟状态条和画布工具栏在窄屏可能发生重叠。让我优化一下窄屏的细节：

















        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\workflow\workflow.css
          
changes: undefined
          
现在在 375px 媒体查询里增加更细化的适配，确保工具栏和模拟状态条不重叠：

















        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\workflow\workflow.css
          
changes: undefined
          
现在运行 lint、完整测试套件，并启动开发服务器：



















        
            
toolName: todo_write
            
status: success
          
Todos updated: 5 items
          

        
            
toolName: run_command
            
status: success
          
command: pnpm eslint src/pages/workflow/ src/pages/__tests__/workflow/ undefined
          

        
            
toolName: run_command
            
status: success
          
command: pnpm test undefined
          
**全部 1193 个测试通过！**（22 个测试文件，exit code 0）。Lint 也通过。现在启动开发服务器并打开预览：
















        
            
toolName: todo_write
            
status: success
          
Todos updated: 5 items
          

        
            
toolName: run_command
            
status: running
          
command: pnpm dev undefined
          

        
            
toolName: open_preview
            
status: success
          
预览
          
所有 4 个遗留问题已修复完成！

## ✅ 修复清单

### 1. 恢复循环检测并发出 loop 事件
**文件**: [workflowCore.js](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/workflow/workflowCore.js#L289-L352)

新增 `tryEnqueue` 辅助函数，将循环检测放在**入队时**进行：
- 若目标节点已访问且是 **END 类型** → 静默跳过（并行分支正常收敛）
- 若目标节点已访问且**非 END 类型** → 发出 `{ type: 'loop', nodeId }` 事件并终止

[index.jsx](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/workflow/index.jsx#L170-L175) 中的 loop 事件分支现在可以正常触发，无需清理代码。

### 2. 移除 edge 的 truthiness 额外校验
**文件**: [workflowCore.js](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/workflow/workflowCore.js#L243-L257)

去掉了 `!edge.source ||` 和 `!edge.target ||`，只保留 `nodeIds.has()` 引用存在性检查，避免错误拒绝 `'0'`、`''` 等合法（虽然 unusual）的节点 id。

### 3. 375px 移动端布局优化
**文件**: [workflow.css](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/workflow/workflow.css)

- `.wf-sim-status` 增加 `max-width: calc(100% - 80px - 24px)` 和 `line-height: 1.3`，防止文字溢出行与工具栏重叠
- 375px 断点下：画布工具栏按钮缩至 28px、zoom-info 变窄；模拟状态条缩小字号和内边距并计算安全 max-width；空画布提示和空面板提示也相应缩小

### 4. 所有测试通过
```
 Test Files  22 passed (22)
      Tests  1193 passed (1193)
```

workflow 模块新增了 3 个测试用例：
| 测试 | 验证内容 |
|------|---------|
| `should detect loops and emit loop event` | s→t→s 回环正确触发 loop 事件 |
| `should not falsely detect loop when parallel branches converge at end node` | 并行分支收敛到 END 不触发误报 |
| `should detect loop involving non-end nodes only` | a→b→c→a 条件分支回环正确检测 |

开发服务器运行于：**http://localhost:5173/workflow**，可在浏览器调整视口到 375px 宽度手动验证窄屏布局和模拟执行动画的步进效果。