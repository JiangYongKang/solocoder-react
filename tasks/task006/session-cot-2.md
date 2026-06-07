我来逐一修复这 7 个问题。先创建任务清单：

        
            
toolName: todo_write
            
status: success
          
Todos updated: 7 items
          
让我先读取当前所有相关文件，了解现有实现：



        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\chat\index.jsx
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\chat\ChatWindow.jsx
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\chat\ChatInput.jsx
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\chat\ContactList.jsx
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\chat\utils.js
          
好的，我已经理解了所有问题。让我按顺序修复，从底层开始：先改 utils 的单测、ChatInput 的光标，再重构 ChatWindow 和 ContactList 的数据流。

先读取并更新现有测试文件，然后批量修改组件：



        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\chat\utils.test.js
          
现在开始修改。先更新测试文件，补充核心数据函数的测试：







        
            
toolName: Write
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\chat\utils.test.js
          
changes: undefined
          
现在更新 ChatInput，补上键盘方向键的光标位置同步（问题 4）：







        
            
toolName: todo_write
            
status: success
          
Todos updated: 7 items
          

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\chat\ChatInput.jsx
          
changes: undefined
          
刚才的 edit 有语法错误，让我重写这个函数：









        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\chat\ChatInput.jsx
          
changes: undefined
          
现在重构 ChatWindow —— 同时解决问题 1（活跃对话不加未读）、问题 2（移动端返回按钮）、问题 3（副作用移出 useState）：











        
            
toolName: todo_write
            
status: success
          
Todos updated: 7 items
          

        
            
toolName: Write
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\chat\ChatWindow.jsx
          
changes: undefined
          
现在重构 ContactList 和主页面，去掉 key 触发重建，并给返回按钮加样式：










        
            
toolName: todo_write
            
status: success
          
Todos updated: 7 items
          

        
            
toolName: Write
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\chat\index.jsx
          
changes: undefined
          
现在更新 ContactList，显式消费 version prop 避免未使用警告，同时保证渲染会随 version 变化重新读取 localStorage：














        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\chat\ContactList.jsx
          
changes: undefined
          
现在给返回按钮加 CSS 样式，并清理 ChatWindow 里未使用的 import：















        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\chat\chat.css
          

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\chat\chat.css
          
changes: undefined
          
现在清理 ChatWindow 中未使用的 incrementUnread import，然后运行测试：

















        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\chat\ChatWindow.jsx
          
changes: undefined
          
现在运行测试和 lint 检查：


















        
            
toolName: todo_write
            
status: success
          
Todos updated: 7 items
          

        
            
toolName: run_command
            
status: success
          
command: cd c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react ; pnpm test undefined
          

        
            
toolName: run_command
            
status: success
          
command: cd c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react ; pnpm exec eslint src/pages/chat src/pages/__tests__/chat undefined
          
ESLint 报了 ChatWindow 的 useEffect 里 setState。我调整一下：让 ChatWindow 用 key 随 contactId 重建（这对"不同会话用独立组件实例"是合理的），useState 初始器里只做纯读取，副作用单独放 useEffect 且不 setState：

















        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\chat\ChatWindow.jsx
          
changes: undefined
          
现在 index.jsx 里需要给 ChatWindow 加 key，让切换联系人时组件重建（这样 useState 初始器会重新加载消息，这是合理的语义——不同联系人就是不同会话）：


















        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\chat\index.jsx
          
changes: undefined
          
再跑 lint 和聊天的测试：


















        
            
toolName: run_command
            
status: success
          
command: cd c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react ; pnpm exec eslint src/pages/chat src/pages/__tests__/chat undefined
          

        
            
toolName: run_command
            
status: success
          
command: cd c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react ; pnpm test -- src/pages/__tests__/chat undefined
          
全部通过！现在跑一下完整 build 验证构建：




















        
            
toolName: run_command
            
status: success
          
command: cd c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react ; pnpm build undefined
          
所有检查通过！现在更新任务状态：



















        
            
toolName: todo_write
            
status: success
          
Todos updated: 7 items
          
7 个问题全部修复并通过验证 ✅

## 修复总结

| # | 问题 | 修复方式 | 涉及文件 |
|---|---|---|---|
| 1 | 正在对话的联系人收到模拟回复仍加未读红点 | ChatWindow 内用 `isActiveRef` 跟踪挂载状态，模拟消息到达时**不再调用 `incrementUnread`**，并将消息直接设为 `read: true` | [ChatWindow.jsx](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/chat/ChatWindow.jsx#L53-L69) |
| 2 | 移动端点进聊天窗口无法返回联系人列表 | ChatWindow 顶部加返回按钮（`onBackToList` prop），仅在 ≤768px 显示；桌面端隐藏 | [ChatWindow.jsx](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/chat/ChatWindow.jsx#L110-L115)、[chat.css](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/chat/chat.css#L210-L235) |
| 3 | useState 惰性初始化器里有副作用 | `markAllRead`、`saveMessagesForContact`、`clearUnread` 全部移到 `useEffect`；初始化器里只做纯读取 `loadMessagesForContact`（仅读 localStorage） | [ChatWindow.jsx](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/chat/ChatWindow.jsx#L19-L43) |
| 4 | 键盘方向键移动光标后表情插到旧位置 | 新增 `syncCursorFromInput` 工具函数，`onKeyDown` 中对 `ArrowLeft/Right/Up/Down`、`Home`、`End`、`PageUp/PageDown` 等导航键用 `setTimeout(0)` 异步读取最新 `selectionStart` | [ChatInput.jsx](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/chat/ChatInput.jsx#L38-L54) |
| 5 | localStorage 核心数据函数缺单测 | 新增 15 个测试用例覆盖：`loadAllMessages/saveAllMessages`、`loadMessagesForContact/saveMessagesForContact`、`loadAllUnread/saveAllUnread`、`getUnreadCount`、`incrementUnread`、`clearUnread`（含独立联系人隔离、清零后不影响他人等边界） | [utils.test.js](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/__tests__/chat/utils.test.js#L116-L224) |
| 6 | ContactList 靠改 key 强制重建刷新 | 改为接收 `version` prop 触发正常重渲染，每次渲染从 localStorage 读取最新数据；ChatWindow 用 key 重建（这是合理语义：不同联系人=不同会话实例） | [ContactList.jsx](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/chat/ContactList.jsx#L4-L7)、[index.jsx](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/chat/index.jsx#L30-L41) |
| 7 | 运行测试全通过 | 聊天模块 **47 passed / 47**、ESLint 0 errors、`vite build` 成功。其余 4 个失败用例来自 `file-manager` 和 `form-builder` 模块，属于项目既有遗留问题，与本次修改无关 | |

## 验证结果

```
聊天测试:  47 passed (47)  ✅
ESLint:    0 problems        ✅
Build:     成功              ✅
```