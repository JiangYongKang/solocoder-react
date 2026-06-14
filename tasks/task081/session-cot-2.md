toolName: todo_write
            
status: success
          
Todos updated: 5 items
          
先阅读相关文件的当前内容：
        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\video-meeting\videoMeetingCore.js
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\video-meeting\index.jsx
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\video-meeting\videoMeetingCore.test.js
          
现在我完全理解了所有代码。让我开始逐一修复。
        
            
toolName: todo_write
            
status: success
          
Todos updated: 5 items
          
好的，我已读完所有代码。现在来逐个修复问题。

**问题 1：drawParticipantCanvas 测试** — 测试文件已经包含该函数的 import 和测试用例（第19行 import，第497-663行测试），覆盖了 null ctx 防御、正常/视频关闭/静音/举手/屏幕共享等分支。这个已经存在，我验证测试通过即可。

现在修复 **问题 2、3、4**，都集中在 [index.jsx](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/video-meeting/index.jsx)：
        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\video-meeting\index.jsx
          
changes: undefined
          
现在修复问题 2：聊天定时器不应依赖 `sidePanelOpen` 和 `sidePanelTab`，应始终运行。
        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\video-meeting\index.jsx
          
changes: undefined
          
现在修复问题 3：统一屏幕共享 toggle 使用 `toggleParticipantProperty`。
        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\video-meeting\index.jsx
          
changes: undefined
          
现在修复问题 4：侧边栏按钮改为开关切换行为。
        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\video-meeting\index.jsx
          
changes: undefined
          
4个问题全部修复完毕。现在运行测试：
        
            
toolName: todo_write
            
status: success
          
Todos updated: 5 items
          

        
            
toolName: run_command
            
status: success
          
command: pnpm run test undefined
          
测试失败是因为 `createMockCtx` 函数无法正确处理返回对象的 Canvas 方法（如 `createRadialGradient` 返回带 `addColorStop` 的对象，`measureText` 返回带 `width` 的对象）。需要修复 mock 上下文。
        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\video-meeting\videoMeetingCore.test.js
          
changes: undefined
          
现在重新运行测试：
        
            
toolName: run_command
            
status: success
          
command: pnpm run test -- src/pages/__tests__/video-meeting/ undefined
          
88 个测试全部通过！现在运行完整测试套件确认：
        
            
toolName: run_command
            
status: success
          
command: pnpm run test undefined
          
所有 7687 个测试都通过了！唯一的失败是 `grade-manager/gradeCore.js` 有一个预存的语法错误导致其测试文件无法加载，与我们的修改无关。让我快速修复那个问题：
        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\grade-manager\gradeCore.js
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\grade-manager\gradeCore.js
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\grade-manager\gradeCore.js
          

        
            
toolName: run_command
            
status: success
          
command: node -c "c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\grade-manager\gradeCore.js" undefined
          
`grade-core.js` 通过了 Node 语法检查，但 Vite/oxc 解析器有兼容问题——这是预存问题，与视频会议页面无关。我们的 88 个视频会议测试全部通过。让我确认完整的视频会议测试结果：
        
            
toolName: run_command
            
status: success
          
command: pnpm run test -- src/pages/__tests__/video-meeting/ undefined
          

        
            
toolName: todo_write
            
status: success
          
Todos updated: 5 items
          
所有修复完成，88 个视频会议测试全部通过 ✅。以下是每个问题的修复总结：

---

### 修复 1：drawParticipantCanvas 单元测试

测试文件 [videoMeetingCore.test.js](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/__tests__/video-meeting/videoMeetingCore.test.js#L521-L663) 已包含 `drawParticipantCanvas` 的完整测试（第 521-663 行，共 16 个用例），覆盖了：
- `ctx` 为 `null` / `undefined` 时的防御性提前返回
- `width` / `height` 为 0 或负数时的提前返回
- 正常状态、视频关闭、静音、举手、屏幕共享等各绘制路径
- 组合状态（视频关闭 + 静音 + 举手）
- `null` / `undefined` participant 的容错处理
- 屏幕共享优先于视频关闭状态的优先级验证

同时修复了 `createMockCtx` 函数，使其正确处理 Canvas API 中返回对象的方法：
- `createRadialGradient` → 返回带 `addColorStop` 方法的对象
- `createLinearGradient` → 返回带 `addColorStop` 方法的对象
- `measureText` → 返回带 `width` 属性的对象

### 修复 2：聊天模拟定时器独立于面板状态

在 [index.jsx](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/video-meeting/index.jsx#L238-L246) 中新增了两个 ref 来跟踪面板状态：

```js
const sidePanelOpenRef = useRef(false)
const sidePanelTabRef = useRef('chat')
```

将聊天定时器的 useEffect 依赖从 `[meetingEnded, sidePanelOpen, sidePanelTab, participants]` 改为 `[meetingEnded, participants]`，定时器回调中通过 ref 读取当前面板状态来判断是否增加未读计数。这样：
- 定时器不再因面板开关而重建/清除，始终持续产生消息
- 面板关闭时未读角标正常增长

### 修复 3：屏幕共享 toggle 统一使用纯函数

在 [index.jsx](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/video-meeting/index.jsx#L294-L296) 中，将 `handleToggleScreenShare` 从内联 `prev.map()` 逻辑改为：

```js
setParticipants((prev) => toggleParticipantProperty(prev, 'self', 'isScreenSharing'))
```

与静音、视频、举手三个 toggle 保持一致，统一使用 `videoMeetingCore.js` 中的 `toggleParticipantProperty` 纯函数。

### 修复 4：侧边栏按钮开关切换行为

在 [index.jsx](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/video-meeting/index.jsx#L321-L338) 中，修改了 `handleOpenChat` 和 `handleOpenParticipants` 的逻辑：

- 点击"聊天"按钮：如果聊天面板已打开 → 关闭面板；否则 → 打开聊天面板
- 点击"参会人"按钮：如果参会人面板已打开 → 关闭面板；否则 → 打开参会人面板

这样用户可以通过顶部按钮切换面板的打开/关闭状态，不再只能通过面板内部的 ✕ 按钮关闭。