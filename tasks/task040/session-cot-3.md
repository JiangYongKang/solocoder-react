toolName: todo_write
            
status: success
          
Todos updated: 4 items
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\fitness-tracker\TrendChart.jsx
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\fitness-tracker\DonutChart.jsx
          

        
            
toolName: Write
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\fitness-tracker\TrendChart.jsx
          
changes: undefined
          

        
            
toolName: todo_write
            
status: success
          
Todos updated: 4 items
          

        
            
toolName: Write
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\fitness-tracker\DonutChart.jsx
          
changes: undefined
          

        
            
toolName: todo_write
            
status: success
          
Todos updated: 4 items
          

        
            
toolName: run_command
            
status: running
          
command: pnpm run dev undefined
          

        
            
toolName: open_preview
            
status: success
          
预览
          

        
            
toolName: run_command
            
status: success
          
command: pnpm run test src/pages/__tests__/fitness-tracker/ undefined
          

        
            
toolName: GetDiagnostics
            
status: success
          
          

        
            
toolName: GetDiagnostics
            
status: success
          
          

        
            
toolName: todo_write
            
status: success
          
Todos updated: 4 items
          
修复完成。以下是变更总结：

## 修复内容

### 1. [TrendChart.jsx](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/fitness-tracker/TrendChart.jsx)

移除了渲染阶段对 `getComputedStyle(document.documentElement)` 的调用，所有 SVG 属性直接使用 CSS 变量字符串：

| 原写法 | 新写法 |
|---|---|
| `stroke={borderColor}` | `stroke="var(--border)"` |
| `stroke={textColor}` / `fill={textColor}` | `stroke="var(--text)"` / `fill="var(--text)"` |
| `fill={accentColor}` | `fill="var(--accent)"` |
| `stroke={accentColor}` | `stroke="var(--accent)"` |
| `stopColor={accentColor}` | `stopColor="var(--accent)"` |

### 2. [DonutChart.jsx](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/fitness-tracker/DonutChart.jsx)

同样移除了 `getComputedStyle` 调用，SVG 文本颜色直接使用 CSS 变量：

| 原写法 | 新写法 |
|---|---|
| `fill={textHColor}` | `fill="var(--text-h)"` |
| `fill={textColor}` | `fill="var(--text)"` |

## 验证结果

- **Dev Server**：启动成功，http://localhost:5176/#/fitness-tracker 页面无报错 ✅
- **单元测试**：125 个测试全部通过 ✅
- **Diagnostics**：两个修改文件均无 lint/type 错误 ✅

修复原理：SVG 元素和 HTML 元素一样天然支持 CSS 自定义属性（`var(--xxx)`），浏览器会在渲染时自动解析，不需要在 JS 层强制同步计算样式。这样消除了渲染副作用，也避免了每次重渲染触发强制同步布局（forced synchronous layout）。