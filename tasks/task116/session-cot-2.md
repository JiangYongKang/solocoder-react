我来逐一修复这三个问题。首先分析现有代码结构，然后进行修复。

        
            
toolName: todo_write
            
status: success
          
Todos updated: 3 items
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\route-planner\RouteMapCanvas.jsx
          
现在修复 Canvas 组件。核心思路：使用 ref 暂存拖拽中的坐标，mouseMove 时直接重绘 Canvas（不触发 React 重渲染），只在 mouseUp 时才提交最终坐标给上层。





        
            
toolName: Write
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\route-planner\RouteMapCanvas.jsx
          
changes: undefined
          

        
            
toolName: todo_write
            
status: success
          
Todos updated: 3 items
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\route-planner\routeUtils.test.js
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\route-planner\routeUtils.test.js
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\route-planner\routeUtils.test.js
          
现在更新测试文件，为 `downloadJSON` 和 `copyToClipboard` 添加完整的单元测试：




        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\route-planner\routeUtils.test.js
          
changes: undefined
          

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\route-planner\routeUtils.test.js
          
changes: undefined
          

        
            
toolName: todo_write
            
status: success
          
Todos updated: 3 items
          

        
            
toolName: run_command
            
status: success
          
command: pnpm test src/pages/__tests__/route-planner/routeUtils.test.js undefined
          
需要导入缺失的 vitest 辅助函数：






        
            
toolName: edit_file_search_replace
            
status: failed
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\route-planner\routeUtils.test.js
          
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\route-planner\routeUtils.test.js
          

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\route-planner\routeUtils.test.js
          
changes: undefined
          

        
            
toolName: run_command
            
status: success
          
command: pnpm test src/pages/__tests__/route-planner/routeUtils.test.js undefined
          
有两类问题需要修复。让我先看一下 downloadJSON 的实现：







        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\route-planner\routeUtils.js
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\route-planner\routeUtils.js
          
我需要修复两类测试问题。downloadJSON 使用全局 `Blob` 而非 `window.Blob`，且 navigator 不能直接赋值。让我重写测试：









        
            
toolName: edit_file_search_replace
            
status: failed
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\route-planner\routeUtils.test.js
          
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\route-planner\routeUtils.test.js
          
让我直接重写从 downloadJSON 开始的两个 describe 块，使用 vi.stubGlobal：






        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\route-planner\routeUtils.test.js
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\route-planner\routeUtils.test.js
          
现在我直接用 Write 重写整个测试文件，确保所有部分都正确：








        
            
toolName: Write
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\route-planner\routeUtils.test.js
          
changes: undefined
          
测试文件已更新。现在运行测试验证：










        
            
toolName: run_command
            
status: success
          
command: pnpm run test undefined
          
让我先查看 downloadJSON 和 copyToClipboard 的实际实现：










        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\route-planner\routeUtils.js
          
现在分析问题：

1. **downloadJSON**：`vi.stubGlobal` 传入的对象中的 vi.fn 没有被正确调用（警告提示 mock 未使用 function/class 实现）
2. **copyToClipboard**：getter 抛错在 `if (!navigator.clipboard)` 判断（位于 try/catch 外部）时触发，未被捕获
3. 还有一个 sticky-notes 预先存在的测试失败

让我先修复 routeUtils.js 中的 copyToClipboard，然后修复测试：









        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\route-planner\routeUtils.js
          
changes: undefined
          
现在修复测试文件。问题出在 vi.stubGlobal 设置的对象中 vi.fn() 无法正常工作。让我改用在 jsdom 环境的真实对象上进行 spy 和替换的方式：












        
            
toolName: edit_file_search_replace
            
status: failed
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\route-planner\routeUtils.test.js
          
          
让我直接重写整个测试文件来避免匹配问题：
















        
            
toolName: Write
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\route-planner\routeUtils.test.js
          
changes: undefined
          
现在先检查 sticky-notes 的测试，看看预先存在的问题：

















        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\sticky-notes\stickyNotesUtils.test.js
          

        
            
toolName: search_by_regex
            
status: success
          
query: function moveNoteById|export.*moveNoteById
          

        
            
toolName: search_by_regex
            
status: success
          
query: function moveNoteById|export function moveNoteById
          

        
            
toolName: search_by_regex
            
status: success
          
query: function reorderNotes|export function reorderNotes
          
让我先单独运行 route-planner 的测试，确认我们的修复是否有效：


















        
            
toolName: run_command
            
status: success
          
command: pnpm vitest run src/pages/__tests__/route-planner/routeUtils.test.js undefined
          
route-planner 的104个测试全部通过！现在处理 sticky-notes 的预先存在问题：





















        
            
toolName: run_command
            
status: failed
          
command: pnpm vitest run src/pages/__tests__/sticky-notes/stickyNotesUtils.test.js -t "should move note by id" undefined
          
让我直接读取 sticky-notes 的实际实现，分析 reorderNotes 的问题：
























        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\sticky-notes\stickyNotesUtils.js
          
让我直接运行完整的测试，看看当前的整体状况：


























        
            
toolName: run_command
            
status: success
          
command: pnpm run test 2>&1 | Select-Object -Last 50 undefined
          
所有测试全部通过！让我更新 todo：

























        
            
toolName: todo_write
            
status: success
          
Todos updated: 3 items
          
所有三个问题已全部修复完成！以下是修复总结：

## 修复内容

### 1. Canvas 拖拽性能问题 ✅

在 [RouteMapCanvas.jsx](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/route-planner/RouteMapCanvas.jsx) 中实施了 **ref 暂存 + 直接 Canvas 重绘** 模式：

- **`handleMouseMove`**：只更新内部 `draggingWaypointRef` 并直接调用 `performDraw(overrideWp)` 重绘 Canvas，**不触发任何 React 状态更新，也不清空已计算路线**
- **`handleMouseUp`**：仅当坐标真正发生变化时才调用 `onWaypointDragEnd` 向上层提交一次最终状态，此时才清空路线

### 2. downloadJSON 和 copyToClipboard 单元测试 ✅

在 [routeUtils.test.js](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/__tests__/route-planner/routeUtils.test.js) 中使用 **`Object.defineProperty` 替换全局属性** 的方式补充了测试（避开 `vi.stubGlobal` 的兼容性问题）：

- **downloadJSON（11 个用例）**：覆盖 window 未定义、Blob 创建、URL 创建、anchor 属性设置、默认文件名、click/append/remove 调用、URL revoke、正常返回、DOM 异常、Blob 构造抛错、revoke 抛错等场景
- **copyToClipboard（8 个用例）**：覆盖 navigator 未定义、clipboard 不可用、writeText 调用、成功返回、权限拒绝、空字符串、特殊字符、clipboard getter 抛错等场景

同步修复了 [routeUtils.js](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/route-planner/routeUtils.js#L393-L401) 中 `copyToClipboard` 的边界缺陷：将 `navigator.clipboard` 判断也移入 `try/catch` 内，防止 getter 抛错时无法捕获。

### 3. 全量测试通过 ✅

```
Test Files  134 passed (134)
     Tests  10574 passed (10574)
  Duration  5.32s
```