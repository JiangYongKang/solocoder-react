我来逐一分析并修复这4个问题。首先制定修复计划：

        
            
toolName: todo_write
            
status: success
          
Todos updated: 6 items
          

        
            
toolName: todo_write
            
status: success
          
Todos updated: 6 items
          
让我先读取当前文件的完整内容，以便准确进行修复：


        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\websocket-debugger\index.jsx
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\websocket-debugger\wsDebuggerUtils.js
          
现在我理解了所有问题。让我逐一修复。首先在 `wsDebuggerUtils.js` 中添加需要的辅助函数：



        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\websocket-debugger\wsDebuggerUtils.js
          
changes: undefined
          
现在更新 `createDefaultSettings()` 以包含 `heartbeatEnabled` 字段：



        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\websocket-debugger\wsDebuggerUtils.js
          
changes: undefined
          
现在我需要更新 `highlightJson` 以支持关键词高亮，并添加一个统一的消息格式化函数：





        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\websocket-debugger\wsDebuggerUtils.js
          
changes: undefined
          
现在更新 `index.jsx` 修复所有4个问题。首先更新导入：







        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\websocket-debugger\index.jsx
          
changes: undefined
          
现在更新 `SettingsPanel` 添加心跳启用开关：







        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\websocket-debugger\index.jsx
          
changes: undefined
          
现在更新 `LogEntry` 组件以支持关键词高亮，并将 `url` 传递给 `SettingsPanel`：







        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\websocket-debugger\index.jsx
          
changes: undefined
          
现在修复 `doConnect` 函数中的核心逻辑（问题1、3、4）：









        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\websocket-debugger\index.jsx
          
changes: undefined
          
现在修复错误原因显示条件，以及更新子组件调用（问题1、2）：










        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\websocket-debugger\index.jsx
          
changes: undefined
          
现在更新 `LogEntry` 和 `SettingsPanel` 调用，传递所需的 props：









        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\websocket-debugger\index.jsx
          
changes: undefined
          
现在更新 `SettingsPanel` 函数签名和调用，传递 `url`：









        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\websocket-debugger\index.jsx
          
changes: undefined
          
现在更新 `SettingsPanel` 调用：










        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\websocket-debugger\index.jsx
          
changes: undefined
          
现在更新待办列表并修复测试文件：





        
            
toolName: todo_write
            
status: success
          
Todos updated: 6 items
          
现在读取测试文件，然后添加新函数的测试：







        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\websocket-debugger\wsDebuggerUtils.test.js
          
现在更新测试文件，添加新函数的测试并更新现有测试：









        
            
toolName: Write
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\websocket-debugger\wsDebuggerUtils.test.js
          
changes: undefined
          
现在运行测试验证所有修复：







        
            
toolName: todo_write
            
status: success
          
Todos updated: 6 items
          

        
            
toolName: run_command
            
status: success
          
command: cd c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react ; pnpm run test 2>&1 undefined
          
所有 5508 个测试全部通过。让我再检查一下 lint 和构建：







        
            
toolName: run_command
            
status: success
          
command: cd c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react ; npx eslint src/pages/websocket-debugger/ 2>&1 undefined
          
有几个 lint 错误需要修复。让我来处理：









        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\websocket-debugger\index.jsx
          
changes: undefined
          
现在修复 `doConnect` 的依赖数组问题：











        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\websocket-debugger\index.jsx
          
changes: undefined
          
现在再次检查 lint：










        
            
toolName: run_command
            
status: success
          
command: cd c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react ; npx eslint src/pages/websocket-debugger/ 2>&1 undefined
          
Lint 检查通过。现在再次运行所有测试并验证构建：















        
            
toolName: run_command
            
status: success
          
command: cd c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react ; pnpm run test 2>&1 | Select-Object -Last 10 undefined
          
有一个测试失败了。让我查看具体错误：

















        
            
toolName: run_command
            
status: success
          
command: cd c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react ; pnpm run test 2>&1 | Select-String -Pattern "(FAIL|Error|failed|wsDebuggerUtils)" -Context 5 | Select-Object -First 30 undefined
          
这个失败的测试是 `sudokuCore.test.js`，与 WebSocket 调试工具的修改无关。让我确认 WebSocket 调试工具的测试全部通过：



















        
            
toolName: run_command
            
status: success
          
command: cd c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react ; npx vitest --run src/pages/__tests__/websocket-debugger/ 2>&1 undefined
          
WebSocket 调试工具的 101 个测试全部通过。另一个失败的测试是数独模块的，与本次修改无关。让我验证一下构建：

















        
            
toolName: run_command
            
status: success
          
command: cd c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react ; npx vite build 2>&1 | Select-Object -Last 5 undefined
          
构建成功！现在更新待办列表：

















        
            
toolName: todo_write
            
status: success
          
Todos updated: 6 items
          
所有 4 个问题已修复完毕。以下是修复总结：

## 修复内容

### 1. 连接断开状态与错误原因显示
**修改文件**：[index.jsx](file:///C:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/websocket-debugger/index.jsx#L437-L452)
- `ws.onclose` 中意外断开时设置 `CONNECTION_STATUS.ERROR` 而非 `DISCONNECTED`
- UI 显示条件改为：只要有 `errorReason` 就显示，不限制状态
- 用户主动断开时清空 `errorReason`，避免残留显示

### 2. 搜索关键词高亮显示
**新增函数**（[wsDebuggerUtils.js](file:///C:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/websocket-debugger/wsDebuggerUtils.js#L55-L71)）：
- `highlightKeyword(text, keyword)` - 递归查找并用 `<span class="ws-log-highlight">` 包裹匹配关键词
- `formatMessageForDisplay(content, expanded, keyword)` - 统一处理显示格式化（JSON 语法高亮 + 关键词高亮 + 截断）
- `highlightJson` 增加 `keyword` 参数支持

**修改组件**：[LogEntry](file:///C:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/websocket-debugger/index.jsx#L184-L214) 接收 `searchKeyword` prop，使用 `formatMessageForDisplay` 渲染

### 3. 心跳检测启用条件
**新增函数**（[wsDebuggerUtils.js](file:///C:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/websocket-debugger/wsDebuggerUtils.js#L33-L52)）：
- `isEchoServer(url)` - 匹配 `echo.websocket.org`、`ws.ifelse.io`、`echo-server` 等模式
- 新增 `DEFAULT_HEARTBEAT_ENABLED` 常量，`createDefaultSettings()` 包含 `heartbeatEnabled` 字段

**修改组件**：
- [SettingsPanel](file:///C:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/websocket-debugger/index.jsx#L101-L141) 添加心跳启用开关，连接 echo 服务器时显示提示
- [onopen](file:///C:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/websocket-debugger/index.jsx#L402-L418) 中检查 `settings.heartbeatEnabled && !isEchoServer(url)` 才启动心跳

### 4. 心跳超时检测逻辑
**新增函数**（[wsDebuggerUtils.js](file:///C:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/websocket-debugger/wsDebuggerUtils.js#L45-L52)）：
- `isPongResponse(content)` - 识别 JSON `{"type":"pong"}` 和纯文本 `pong`

**修改逻辑**：[onmessage](file:///C:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/websocket-debugger/index.jsx#L420-L435) 中只有当 `pending` 状态 **且** `isPongResponse(content)` 时才重置心跳失败计数

## 验证结果
- ✅ WebSocket 调试工具：101/101 测试通过
- ✅ 整个项目：5507/5508 测试通过（唯一失败的是数独模块的测试，与本次修改无关）
- ✅ ESLint 检查通过
- ✅ Vite 构建成功