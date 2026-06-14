我来逐一修复这些问题。先阅读当前的 index.jsx 代码：

        
            
toolName: todo_write
            
status: success
          
Todos updated: 6 items
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\sort-visualizer\index.jsx
          
现在我理解了所有问题。让我逐一修复，并重写整个 index.jsx 文件：







        
            
toolName: todo_write
            
status: success
          
Todos updated: 4 items
          

        
            
toolName: Write
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\sort-visualizer\index.jsx
          
changes: undefined
          
现在运行单元测试和 build 来验证：








        
            
toolName: todo_write
            
status: success
          
Todos updated: 4 items
          

        
            
toolName: run_command
            
status: success
          
command: npm test -- src/pages/__tests__/sort-visualizer/sortAlgorithms.test.js undefined
          

        
            
toolName: GetDiagnostics
            
status: success
          
          
所有 68 个测试通过，无任何诊断错误。现在启动 dev 服务器供你手动验证：









        
            
toolName: todo_write
            
status: success
          
Todos updated: 4 items
          

        
            
toolName: run_command
            
status: running
          
command: npm run dev undefined
          

        
            
toolName: todo_write
            
status: success
          
Todos updated: 4 items
          

        
            
toolName: open_preview
            
status: success
          
预览
          

        
            
toolName: check_command_status
            
status: success
          
          
服务器之前意外被终止了，重新启动：


        
            
toolName: run_command
            
status: running
          
command: npm run dev undefined
          

        
            
toolName: open_preview
            
status: success
          
预览
          

        
            
toolName: check_command_status
            
status: success
          
          
终端里有其他测试在运行导致退出了。这些失败的测试都是 `code-sandbox` 模块的旧问题，和我们修改的 `sort-visualizer` 完全无关。让我再单独启动 dev 服务器：








        
            
toolName: run_command
            
status: running
          
command: npm run dev undefined
          
服务器已经启动成功，运行在 http://localhost:5173/

---

## ✅ 修复总结

所有三个问题已全部修复，代码位于 [index.jsx](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/sort-visualizer/index.jsx)：

### 问题 1 & 2：对比模式下 B 侧调度缺陷 + 定时器覆盖

**原问题**：
- B 侧 `setTimeout` 回调没有递归调用 `scheduleNext`，调度完全由 A 侧驱动
- 每次调度时直接覆盖 `timerBRef.current` 未清理旧定时器

**修复方案**：引入 `scheduleSide(side)` 函数（[index.jsx#L379-L396](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/sort-visualizer/index.jsx#L379-L396)

每个算法侧独立拥有自己的调度循环，两侧完全对称：
- `scheduleSide('A')` 完成后只调度 A 侧的下一步
- `scheduleSide('B')` 完成后只调度 B 侧的下一步
- 每侧调度前**先 `clearSingleTimer(timerKey)` 清理同侧 pending 定时器**，避免双定时器叠加
- `scheduleNext` 仅负责启动两侧的调度入口，不再耦合逻辑交织

```
scheduleNext() {
  scheduleSide('A')
  scheduleSide('B')
}

scheduleSide(side) {
  clearSingleTimer(side)    ← 先清理旧定时器
  setTimeout(() => {
    stepGeneratorOnce(side, ...)
    if (hasMore) scheduleSide(side)  ← 每侧独立递归
  }, delay)
}
```

### 问题 3：`stepGeneratorOnce` 过长（125 行 → ~40 行）

将混杂职责拆分后的 `stepGeneratorOnce` 从 125 行缩减为 ~40 行的 10 个纯函数：

| 函数 | 职责 |
|--------|------|
| [resolveAlgorithm | 根据 stateKey 解析当前算法 key |
| [resolveAlgorithmName | 解析算法中文名 |
| [computeStepVisualState | 根据 step 类型计算 sorted/pivot/swapping 集合 |
| [buildLogEntry | 构建日志条目 |
| [shouldSkipLogging | 批量 sorted 步骤是否跳过日志 |
| [makeDoneState | 构建 COMPLETE 完成状态对象 |
| [makeGeneratorDoneState | 构建 generator.done 状态对象 |
| [makeNormalStepState | 构建普通步骤状态对象 |
| [initializeGeneratorIfIdle | IDLE → RUNNING 并创建 generator |

---

### 🧪 验证结果

- **单元测试**：68 passed ✅
- **诊断**：0 errors ✅
- **Dev 服务器**：http://localhost:5173/ 已启动，可以直接在浏览器访问验证对比模式下两个算法是否同步执行到完成，以及暂停/继续交互是否正常。