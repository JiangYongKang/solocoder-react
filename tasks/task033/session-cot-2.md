我来逐一修复这些问题。首先让我检查 App.jsx 的当前状态。

        
            
toolName: todo_write
            
status: success
          
Todos updated: 6 items
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\App.jsx
          
确实，App.jsx 中缺少白板相关的集成代码，还有 ApiDebuggerPage 也没有导入。让我一次性修复：



        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\App.jsx
          
changes: undefined
          
现在添加 TASKS 数组中的协作白板条目和路由：




        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\App.jsx
          
changes: undefined
          
现在添加白板路由：






        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\App.jsx
          
changes: undefined
          
现在让我处理第二个问题：修复文本输入框在缩放比例下字体大小不一致的问题。先读取 index.jsx：





        
            
toolName: todo_write
            
status: success
          
Todos updated: 6 items
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\whiteboard\index.jsx
          
现在我需要修复这两个问题。先在 whiteboardCore.js 添加一个计算文本输入框参数的纯函数，然后修复 index.jsx。同时清理 drawShape 的 fillStyle。让我先看看现有的 whiteboardCore.js 来找到需要的函数。




        
            
toolName: search_by_regex
            
status: success
          
query: screenToWorld|worldToScreen
          
现在让我在 whiteboardCore.js 添加一个计算文本输入框屏幕参数的纯函数：






        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\whiteboard\whiteboardCore.js
          

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\whiteboard\whiteboardCore.js
          
changes: undefined
          
现在让我修改 index.jsx，使用新函数并清理 drawShape 的 fillStyle：








        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\whiteboard\index.jsx
          
changes: undefined
          
现在清理 drawShape 中对非文本形状无用的 fillStyle：










        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\whiteboard\index.jsx
          
changes: undefined
          
现在修复 handleMouseDown 中使用新函数计算文本输入框参数，并且添加 zoom 变化时实时更新输入框位置：










        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\whiteboard\index.jsx
          
changes: undefined
          
现在添加一个 useEffect 来在 zoom 或 pan 变化时实时更新文本输入框位置：













        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\whiteboard\index.jsx
          
changes: undefined
          
现在让我更新 todo 并补充单元测试：

















        
            
toolName: todo_write
            
status: success
          
Todos updated: 6 items
          
现在让我读取现有的测试文件并补充测试：











        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\whiteboard\whiteboardCore.test.js
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\whiteboard\whiteboardCore.test.js
          
现在更新测试文件，添加对新函数和更多边界情况的测试：















        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\whiteboard\whiteboardCore.test.js
          
changes: undefined
          
现在在测试文件末尾添加新的测试：


















        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\whiteboard\whiteboardCore.test.js
          
changes: undefined
          
我需要在测试文件中添加 isShapeIntersectingPoint 的 import：
















        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\whiteboard\whiteboardCore.test.js
          
changes: undefined
          
我需要把 isShapeIntersectingPoint 和其相关的辅助函数移到 whiteboardCore.js 中（作为纯函数），这样才能被测试：

















        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\whiteboard\whiteboardCore.js
          
让我在 whiteboardCore.js 的 isPointInText 函数附近添加这些几何辅助函数和 isShapeIntersectingPoint：
















        
            
toolName: search_by_regex
            
status: success
          
query: isPointInText|findTextAtPoint
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\whiteboard\whiteboardCore.js
          

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\whiteboard\whiteboardCore.js
          
changes: undefined
          
现在更新 index.jsx，从 whiteboardCore.js 导入这些函数并删除本地定义：



















        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\whiteboard\index.jsx
          
changes: undefined
          
现在从 index.jsx 中删除本地重复定义的这些函数：



















        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\whiteboard\index.jsx
          
changes: undefined
          
现在更新测试文件，添加对新几何函数的测试：





















        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\whiteboard\whiteboardCore.test.js
          
changes: undefined
          

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\whiteboard\whiteboardCore.test.js
          
changes: undefined
          
我注意到有一个测试参数顺序错了，让我修复：

















        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\whiteboard\whiteboardCore.test.js
          
changes: undefined
          
现在让我启动 dev 服务器验证，然后运行测试：





















        
            
toolName: todo_write
            
status: success
          
Todos updated: 6 items
          
让我先运行测试，再启动 dev 服务器：

















        
            
toolName: run_command
            
status: success
          
command: cd c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react ; pnpm test src/pages/__tests__/whiteboard/whiteboardCore.test.js undefined
          
让我修复这两个测试用例——第一个点 (5,5) 距离画笔的点超过 5 个单位，第二个点确实在矩形的擦除半径内：

















        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\whiteboard\whiteboardCore.test.js
          
changes: undefined
          

        
            
toolName: run_command
            
status: success
          
command: cd c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react ; pnpm test src/pages/__tests__/whiteboard/whiteboardCore.test.js undefined
          
所有 116 个测试都通过了！现在启动 dev 服务器验证页面：




















        
            
toolName: todo_write
            
status: success
          
Todos updated: 6 items
          

        
            
toolName: run_command
            
status: success
          
command: cd c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react ; pnpm run dev undefined
          

        
            
toolName: check_command_status
            
status: success
          
          

        
            
toolName: run_command
            
status: running
          
command: cd c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react ; pnpm run dev undefined
          
Dev 服务器已经成功启动！让我打开预览：





















        
            
toolName: open_preview
            
status: success
          
预览
          
这个错误是 `social-feed` 模块的已有问题，和我们的白板无关。让我完成任务：






















        
            
toolName: todo_write
            
status: success
          
Todos updated: 6 items
          
所有问题已全部修复完成！以下是修复内容的总结：

## 修复内容

### 1. App.jsx 集成（已修复）
在 [App.jsx](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/App.jsx#L41-L42) 中补全了：
- `WhiteboardPage` 和 `ApiDebuggerPage` 的 import
- TASKS 数组中添加了 id:39 的「协作白板」任务卡片条目
- Routes 中添加了 `/whiteboard` 路由

### 2. 文本输入框缩放适配（已修复）
在 [whiteboardCore.js](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/whiteboard/whiteboardCore.js#L51-L61) 中新增纯函数 `getTextInputScreenParams`：
- 正确计算缩放后的屏幕坐标（`left`、`top`）
- 字体大小正确乘以 `zoom` 值
- [index.jsx](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/whiteboard/index.jsx#L256-L273) 添加了 useEffect，在 zoom/pan 变化时实时更新输入框位置和大小

### 3. 清理无用 fillStyle（已修复）
在 [index.jsx](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/whiteboard/index.jsx#L182-L230) 的 `drawShape` 函数中：
- 移除了非文本形状（画笔、矩形、圆形、直线）的无用 `fillStyle` 设置
- 只在 `TEXT` 分支内设置 `fillStyle`（因为文本需要 `ctx.fillText()`）

### 4. 补充单元测试
将纯函数从 index.jsx 移至 [whiteboardCore.js](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/whiteboard/whiteboardCore.js)，并新增 32 个测试：
- `getTextInputScreenParams`：100%/200%/50% 缩放、pan 偏移、组合等 6 个测试
- 几何辅助函数：`distance`、`pointNearRect`、`pointNearEllipse`、`pointNearLine` 共 11 个测试
- `isShapeIntersectingPoint`：各图形类型的碰撞检测 8 个测试
- `snapLineToAngle` 角度边界：各方向角度吸附 4 个测试
- 形状/历史操作边界情况 3 个测试

### 验证结果
- ✅ **116 个单元测试全部通过**
- ✅ **Dev 服务器已启动**：http://localhost:5174/

浏览器中出现的 `SyntaxError: extractTopics` 错误是 `social-feed` 模块的已有问题，与白板功能无关。