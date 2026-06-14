toolName: todo_write
            
status: success
          
Todos updated: 2 items
          
先确认相关代码的当前状态：

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\sort-visualizer\index.jsx
          
现在统一为 opts 对象参数风格。修改 `resolveAlgorithmName`、`resolveAlgorithm` 两个函数，以及它们的调用点：




        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\sort-visualizer\index.jsx
          
changes: undefined
          
现在更新 `initializeGeneratorIfIdle` 中的调用：







        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\sort-visualizer\index.jsx
          
changes: undefined
          
现在更新 `stepGeneratorOnce` 中的调用：





        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\sort-visualizer\index.jsx
          
changes: undefined
          
现在运行测试验证所有 68 个测试仍然通过：







        
            
toolName: todo_write
            
status: success
          
Todos updated: 2 items
          

        
            
toolName: run_command
            
status: success
          
command: npm test -- src/pages/__tests__/sort-visualizer/sortAlgorithms.test.js undefined
          

        
            
toolName: GetDiagnostics
            
status: success
          
          

        
            
toolName: todo_write
            
status: success
          
Todos updated: 2 items
          
修复完成 ✅

## 修改内容

统一了 [index.jsx](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/sort-visualizer/index.jsx) 中三个函数的参数传递风格，全部采用 `opts` 对象形式：

### 修改前（两种风格混用）

```js
// 5 个独立参数
function resolveAlgorithmName(stateKey, isCompareMode, algorithmA, algorithmB, singleAlgorithm) { ... }
function resolveAlgorithm(stateKey, isCompareMode, algorithmA, algorithmB, singleAlgorithm) { ... }

// opts 对象参数
function initializeGeneratorIfIdle(state, stateKey, setState, stateRef, opts) { ... }
```

### 修改后（统一为 opts 对象）

```js
// 全部使用 opts 对象参数
function resolveAlgorithmName(stateKey, opts) { ... }      // [L57-L64](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/sort-visualizer/index.jsx#L57-L64)
function resolveAlgorithm(stateKey, opts) { ... }           // [L66-L71](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/sort-visualizer/index.jsx#L66-L71)
function initializeGeneratorIfIdle(state, stateKey, setState, stateRef, opts) { ... }
```

### 调用点同步更新
- `initializeGeneratorIfIdle` 内调用 `resolveAlgorithm(stateKey, opts)` — [L156](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/sort-visualizer/index.jsx#L156)
- `stepGeneratorOnce` 内调用 `resolveAlgorithmName(stateKey, algoOpts)` — [L353](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/sort-visualizer/index.jsx#L353)

## 验证结果

- **单元测试**：68 passed ✅
- **诊断**：0 errors ✅