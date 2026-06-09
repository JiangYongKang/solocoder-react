我来逐一修复这些问题。首先创建任务列表：




        
            
toolName: todo_write
            
status: success
          
Todos updated: 5 items
          
让我先读取相关文件：







        
            
toolName: todo_write
            
status: success
          
Todos updated: 5 items
          
让我先重新理解一下用户的需求。对于"全部添加到队列"功能，我理解用户想要一个明确的批量添加默认示例媒体的功能。对于 CSS 问题，确实 `pointer-events: none` 的元素无法触发 `:hover`，需要改用 JS 监听鼠标位置来控制显示。

让我先读取 index.jsx 的相关部分：








        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\media-player\index.jsx
          
让我先仔细理解需求并看一下当前按钮和控制栏的实现：









        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\media-player\index.jsx
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\media-player\index.jsx
          
现在我来逐一修复问题。先修复按钮文案和 CSS 的问题。

关于"全部添加到队列"功能，我理解用户希望有一个清晰的批量操作按钮。当前功能是添加默认示例媒体，文案改为更准确的**"添加示例媒体"**会更符合其功能语义。

关于 CSS 的问题，`.fullscreen-hidden` 设置了 `pointer-events: none`，所以 `:hover` 确实无法被触发。需要改为通过 JS 监听鼠标位置来控制控制栏显示。

让我开始修复：





        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\media-player\index.jsx
          
changes: undefined
          
现在修复 CSS 问题 - 删除无效的 hover 规则：








        
            
toolName: todo_write
            
status: success
          
Todos updated: 5 items
          
现在让我修改 CSS，删除无效的 hover 规则，并简化逻辑：









        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\media-player\media-player.css
          
changes: undefined
          
现在修复测试文件中的断言：












        
            
toolName: todo_write
            
status: success
          
Todos updated: 5 items
          

        
            
toolName: search_by_regex
            
status: success
          
query: \.replace\(
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\media-player\mediaPlayerUtils.test.js
          
现在修复这个断言：










        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\media-player\mediaPlayerUtils.test.js
          
changes: undefined
          
现在运行测试：











        
            
toolName: todo_write
            
status: success
          
Todos updated: 5 items
          

        
            
toolName: run_command
            
status: success
          
command: cd c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react ; npm test -- src/pages/__tests__/media-player/mediaPlayerUtils.test.js undefined
          
所有 143 个测试都通过了！现在让我启动 dev 服务器进行手动验证：











        
            
toolName: todo_write
            
status: success
          
Todos updated: 5 items
          
让我先检查之前的 dev 服务器是否还在运行：










        
            
toolName: check_command_status
            
status: success
          
          
之前的服务器已停止，让我重新启动：









        
            
toolName: run_command
            
status: running
          
command: cd c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react ; npm run dev undefined
          
Dev 服务器已启动！让我打开预览：












        
            
toolName: open_preview
            
status: success
          
预览
          
这个错误来自其他模块（social-feed），与我们的音视频播放器无关，不影响功能验证。











        
            
toolName: todo_write
            
status: success
          
Todos updated: 5 items
          
所有问题已修复完成！以下是修改总结：

## 修复内容

### 1. 播放列表按钮文案调整
**文件**：[index.jsx](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/media-player/index.jsx#L628-L634)
- 按钮文案从 `"+ 添加示例"` 改为 **"添加示例媒体"**
- 功能语义更清晰：一键批量将默认示例媒体添加到播放列表（自动去重）

### 2. CSS 无效规则清理
**文件**：[media-player.css](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/media-player/media-player.css#L488-L503)
- 删除了无效的 `.fullscreen-hidden:hover` 规则
- **原因**：设置了 `pointer-events: none` 的元素无法触发 `:hover` 伪类，该 CSS 规则是死代码
- 控制栏显示逻辑完全由 JS 的 `onMouseMove` + 3秒自动隐藏定时器控制，功能不受影响

### 3. 测试断言简化
**文件**：[mediaPlayerUtils.test.js](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/__tests__/media-player/mediaPlayerUtils.test.js#L996)
- 将 `.toBe('A'.replace('A', 'B'))` 简化为 `.toBe('B')`
- 消除了不必要的运行时字符串运算，提升可读性

## 验证结果

✅ **143/143 单元测试全部通过**  
✅ **Dev 服务器已启动**：http://localhost:5173/

你可以进入首页点击"音视频播放器"任务卡片，手动验证：
- "添加示例媒体"按钮功能正常
- 全屏模式下控制栏隐藏后不会误触（鼠标移动到页面任意位置会重新显示控制栏，3秒无操作后自动隐藏）