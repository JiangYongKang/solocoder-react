好的，我来修复这两个代码质量问题。

        
            
toolName: todo_write
            
status: success
          
Todos updated: 3 items
          
先看一下当前的 FrequencyChart.jsx 实现：


        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\event-debugger\FrequencyChart.jsx
          
现在修复 FrequencyChart.jsx 的依赖管理问题。核心思路是将频率数据存入 ref，让 draw 从 ref 读取，避免 useCallback 依赖频繁变化的数组引用：





        
            
toolName: Write
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\event-debugger\FrequencyChart.jsx
          
changes: undefined
          
现在修复第二个问题：移除 MouseCapturePanel.jsx 中未使用的 throttledMouseMoveRef：








        
            
toolName: todo_write
            
status: success
          
Todos updated: 3 items
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\event-debugger\MouseCapturePanel.jsx
          

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\event-debugger\MouseCapturePanel.jsx
          
changes: undefined
          

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\event-debugger\MouseCapturePanel.jsx
          
changes: undefined
          
现在运行测试确保全部通过：













        
            
toolName: todo_write
            
status: success
          
Todos updated: 3 items
          

        
            
toolName: run_command
            
status: success
          
command: pnpm vitest run src/pages/__tests__/event-debugger/eventDebuggerUtils.test.js undefined
          
所有 70 个测试全部通过！让我更新任务列表：















        
            
toolName: todo_write
            
status: success
          
Todos updated: 3 items
          
## 修复完成！

### 1. FrequencyChart.jsx — 依赖管理问题修复

**问题**：`keyFrequency` 和 `mouseFrequency` 每次渲染都返回新数组引用，`draw` 函数的 `useCallback` 以这两个值为依赖项，导致 `draw` 每次渲染都重新创建，`useCallback` 缓存失效。同时 `ResizeObserver` 依赖 `draw`，导致每秒断开重连一次。

**修复方案**：
- 使用 `useRef` 存储频率数据：`keyFrequencyRef` 和 `mouseFrequencyRef`
- 每次渲染时更新 ref 的 `.current` 值
- `draw` 函数内部从 ref 读取频率数据，不再直接依赖外部数组
- `useCallback` 的依赖数组变为空数组 `[]`，`draw` 函数只会创建一次
- `ResizeObserver` 的 `useEffect` 也只会在组件挂载时创建一次，卸载时断开，不会每秒重建

代码参考：[FrequencyChart.jsx](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/event-debugger/FrequencyChart.jsx#L15-L137)

### 2. MouseCapturePanel.jsx — 移除死代码

**问题**：`throttledMouseMoveRef` 变量声明了并在 `useEffect` 中赋值，但在整个组件的 JSX、事件处理和清理函数中均未被读取使用。

**修复**：
- 移除第 26 行的 `throttledMouseMoveRef = useRef(null)` 声明
- 移除第 97 行的 `throttledMouseMoveRef.current = throttledMouseMove` 赋值

代码参考：[MouseCapturePanel.jsx](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/event-debugger/MouseCapturePanel.jsx#L23-L25)

### 3. 测试验证

✅ **70 个单元测试全部通过**