我先来探究一下项目结构，以理解现有的模式、路由和样式，然后再规划实现方案。
        
            
toolName: view_folder
            
status: success
          
c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src
          

        
            
toolName: view_folder
            
status: success
          
c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages
          

        
            
toolName: file_search
            
status: success
          
file_pattern: src/pages/event-timeline/**/*
          
我来查看一下路由、一个类似页面 (api-debugger) 和关键模式：
        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\App.jsx
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\api-debugger\index.jsx
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\api-debugger\apiDebuggerUtils.js
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\api-debugger\api-debugger.css
          
我还需要检查一下CSS变量、测试模式和包依赖：
        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\App.css
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\api-debugger\apiDebuggerUtils.test.js
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\package.json
          
现在我对项目模式有了全面的了解。让我来规划并实现这个 WebSocket 调试工具。
        
            
toolName: todo_write
            
status: success
          
Todos updated: 7 items
          

        
            
toolName: todo_write
            
status: success
          
Todos updated: 7 items
          

        
            
toolName: Write
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\websocket-debugger\wsDebuggerUtils.js
          
changes: undefined
          

        
            
toolName: todo_write
            
status: success
          
Todos updated: 7 items
          
常量已整合到 `wsDebuggerUtils.js` 中（遵循 `api-debugger` 模式）。现在我来创建 CSS 和主组件。
        
            
toolName: todo_write
            
status: success
          
Todos updated: 7 items
          

        
            
toolName: Write
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\websocket-debugger\websocket-debugger.css
          
changes: undefined
          

        
            
toolName: todo_write
            
status: success
          
Todos updated: 7 items
          
现在，我来创建主要的组件文件。这是最复杂的部分：
        
            
toolName: Write
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\websocket-debugger\index.jsx
          
changes: undefined
          

        
            
toolName: todo_write
            
status: success
          
Todos updated: 7 items
          

        
            
toolName: Write
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\websocket-debugger\wsDebuggerUtils.test.js
          
changes: undefined
          

        
            
toolName: todo_write
            
status: success
          
Todos updated: 7 items
          
现在我来更新 `App.jsx`，以添加导入、路由和任务卡片：
        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\App.jsx
          
changes: undefined
          
现在添加任务卡片条目：
        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\App.jsx
          
changes: undefined
          
编辑破坏了数组结构。让我读取当前状态并修复它：
        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\App.jsx
          
我看到了问题 - 第113/114行的 `]` 与下一行合并了。让我来修复它：
        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\App.jsx
          
changes: undefined
          
好的，数组现在看起来是正确的。现在我需要添加路由。让我找到路由部分：
        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\App.jsx
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\App.jsx
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\App.jsx
          

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\App.jsx
          
changes: undefined
          

        
            
toolName: todo_write
            
status: success
          
Todos updated: 7 items
          
现在让我运行单元测试来验证一切正常：
        
            
toolName: run_command
            
status: success
          
command: cd c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react ; npx vitest --run src/pages/__tests__/websocket-debugger/wsDebuggerUtils.test.js undefined
          
所有 75 个测试都通过了。我还会检查 lint 错误：
        
            
toolName: GetDiagnostics
            
status: success
          
          

        
            
toolName: GetDiagnostics
            
status: success
          
          
没有诊断信息。让我再运行一个更广泛的构建检查，以确保没有导入错误：
        
            
toolName: run_command
            
status: success
          
command: cd c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react ; npx vite build 2>&1 | Select-String -Pattern "(error|Error|websocket-debugger)" | Select-Object -First 20 undefined
          
没有错误 - 构建通过。让我验证完整的构建是否成功完成：
        
            
toolName: run_command
            
status: success
          
command: cd c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react ; npx vite build 2>&1 | Select-Object -Last 5 undefined
          
构建成功。现在让我再修复一件事——我注意到 `LogEntry` 组件接受 `onClick` 属性，但在条目上点击切换展开功能不起作用，因为 `onClick` 被传递给了组件但没有应用到 DOM 元素。让我修复这个问题：
        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\websocket-debugger\index.jsx
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\websocket-debugger\index.jsx
          

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\websocket-debugger\index.jsx
          
changes: undefined
          
现在，将 `onClick` 添加到 `div` 元素中：
        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\websocket-debugger\index.jsx
          

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\websocket-debugger\index.jsx
          
changes: undefined
          
好的。现在让我再次运行测试以确认一切仍然通过：
        
            
toolName: run_command
            
status: success
          
command: cd c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react ; npx vitest --run src/pages/__tests__/websocket-debugger/wsDebuggerUtils.test.js undefined
          
所有 75 个测试都通过了。我再运行一下 lint 检查：
        
            
toolName: run_command
            
status: success
          
command: cd c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react ; npx eslint src/pages/websocket-debugger/ src/App.jsx 2>&1 | Select-Object -Last 10 undefined
          
存在 React hooks lint 错误。我来检查完整的 lint 输出：
        
            
toolName: run_command
            
status: success
          
command: cd c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react ; npx eslint src/pages/websocket-debugger/ 2>&1 undefined
          
我需要修复一些 lint 问题：
1. 未使用的导入：`DEFAULT_RECONNECT_ENABLED`, `generateId`, `createDefaultSettings`, `getStatusColor`
2. `LogEntry` 中未使用的 `keyword` 参数
3. 未使用的 `isReceived` 变量
4. `doConnect` 在 `attemptReconnect` 中声明前被使用（循环依赖问题）
5. `attemptReconnect` 中缺少 `doConnect` 依赖

核心问题在于 `doConnect` 和 `attemptReconnect` 之间的循环依赖。我将通过使用 `ref` 来打破这个循环来重构：
        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\websocket-debugger\index.jsx
          
我需要重构组件以修复循环依赖和未使用的变量。关键方法是：使用 `ref` 来存储 `doConnect` 函数，以便 `attemptReconnect` 可以调用它而不会产生循环依赖。
        
            
toolName: Write
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\websocket-debugger\index.jsx
          
changes: undefined
          
现在让我再次运行 lint：
        
            
toolName: run_command
            
status: success
          
command: cd c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react ; npx eslint src/pages/websocket-debugger/ 2>&1 undefined
          
React 编译器不允许在渲染期间更新 `ref`。我需要将其移动到 `useEffect` 中：
        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\websocket-debugger\index.jsx
          
changes: undefined
          

        
            
toolName: run_command
            
status: success
          
command: cd c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react ; npx eslint src/pages/websocket-debugger/ 2>&1 undefined
          
代码检查通过了。我还会运行完整的测试套件，并进行最终构建检查：
        
            
toolName: run_command
            
status: success
          
command: cd c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react ; npx vitest --run src/pages/__tests__/websocket-debugger/wsDebuggerUtils.test.js undefined
          
所有 75 个测试通过，代码检查通过。我再验证一下构建：
        
            
toolName: run_command
            
status: success
          
command: cd c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react ; npx vite build 2>&1 | Select-Object -Last 3 undefined
          
构建成功。让我更新待办事项列表：
        
            
toolName: todo_write
            
status: success
          
Todos updated: 7 items
          
WebSocket 调试工具已完整实现。以下是创建的文件和功能概要：

## 创建的文件

### [wsDebuggerUtils.js](file:///C:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/websocket-debugger/wsDebuggerUtils.js)
纯 JS 工具函数，包含：
- **常量**：`CONNECTION_STATUS`（4种连接状态）、`DIRECTION`（发送/接收/系统）、`DEFAULT_WS_URL`、`MESSAGE_TEMPLATES`（4个常用模板）
- **时间格式化**：`formatTimestampMs`（精确到毫秒的 HH:mm:ss.SSS）、`formatConnectionDuration`（HH:MM:SS）
- **JSON 处理**：`isValidJson`、`formatJson`、`tryFormatMessage`
- **消息处理**：`truncateMessage`（超100字符截断）、`highlightJson`（语法高亮）
- **日志创建**：`createLogEntry`、`createSystemLog`
- **连接历史管理**：`createHistoryEntry`、`addHistory`（同URL更新时间，上限50条）、`deleteHistory`、`clearHistory`、`loadHistory`/`saveHistory`（localStorage 持久化）
- **设置管理**：`createDefaultSettings`、`loadSettings`/`saveSettings`（localStorage 持久化）
- **辅助函数**：`clampValue`、`getStatusColor`、`getStatusText`、`escapeHtml`、`filterLogs`、`shouldAutoScroll`

### [websocket-debugger.css](file:///C:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/websocket-debugger/websocket-debugger.css)
完整样式，采用项目统一的 CSS 变量（`--bg`、`--text-h`、`--border`、`--code-bg` 等），三栏布局，支持响应式（1280px/1024px/640px 断点）

### [index.jsx](file:///C:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/websocket-debugger/index.jsx)
主页面组件，包含三大子组件和完整交互逻辑：

1. **连接管理**：URL 输入框（默认 `wss://echo.websocket.org`）、连接/断开按钮、彩色状态指示灯（绿/黄/红/灰）、连接持续时长、错误原因显示
2. **消息发送**：多行输入框（连接前灰色禁用）、格式化 JSON 按钮、Ctrl+Enter 快捷发送、4个消息模板快捷面板
3. **实时日志**：时间戳（毫秒精度）、方向箭头（↑蓝色/↓绿色/[系统]紫色）、JSON 格式化/折叠（>100字符折叠点击展开）、自动滚动 + "↓ 有新消息"浮动按钮、搜索过滤
4. **连接历史**（左侧栏）：URL + 最后连接时间、点击填入、删除/清空、当前URL高亮、localStorage 持久化
5. **心跳检测**：可配置间隔（5-60s）和超时阈值（1-10次）、连续超时自动断开、状态显示
6. **自动重连**（右侧设置面板）：开关、最大重连次数（1-20）、重连间隔（1-30s）、重连时状态灯闪烁、系统消息提示

### [wsDebuggerUtils.test.js](file:///C:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/__tests__/websocket-debugger/wsDebuggerUtils.test.js)
75 个单元测试，覆盖所有纯函数，包括：常量验证、时间格式化、JSON 处理、消息截断、日志创建、历史记录 CRUD + 持久化、设置管理 + 持久化、clampValue、状态颜色/文本、HTML 转义、JSON 高亮、日志过滤、自动滚动判断

## 修改的文件

### [App.jsx](file:///C:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/App.jsx)
- 添加了 `WsDebuggerPage` 导入
- 在 TASKS 数组中添加了任务卡片（id: 55, route: `websocket-debugger`）
- 添加了 `/websocket-debugger` 路由

## 验证结果
- ✅ 75/75 单元测试通过
- ✅ ESLint 无错误
- ✅ Vite 构建成功