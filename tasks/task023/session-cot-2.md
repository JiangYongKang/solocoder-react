让我先检查当前文件状态，然后逐一修复这些问题。

        
            
toolName: todo_write
            
status: success
          
Todos updated: 6 items
          

        
            
toolName: search_by_regex
            
status: success
          
query: MindMap|mind-map
          
看起来任务卡片条目存在（id 63，但让我检查 import 和 Route：

        
            
toolName: search_by_regex
            
status: success
          
query: import.*Mind|Route.*mind|mind-map.*element
          
Import 已经存在，让我检查 Route：

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\App.jsx
          
好的，App.jsx 的路由、import 和任务卡片其实都已经正确注册了（第 33 行 import、第 63 行任务卡片、第 129 行 Route）。让我继续修复其他问题。



        
            
toolName: todo_write
            
status: success
          
Todos updated: 6 items
          
让我先读取需要修改的文件：







        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\mind-map\index.jsx
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\mind-map\MindMapCanvas.jsx
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\mind-map\mindMapCore.js
          
好的，我现在清楚了所有问题。让我逐一修复：

**问题 2**：右键菜单触发范围 — 需要从整页移除 `onContextMenu`，改为只在节点右键时触发。
**问题 3**：连线改为折线 — 修改 `getConnectionPath`。
**问题 4**：缩放边界使用常量 — 使用 `clampZoom` 函数替代硬编码。

先修改核心函数中的连线逻辑：


        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\mind-map\mindMapCore.js
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\mind-map\mindMapCore.js
          
好，现在我来逐一修复所有问题。先修改 `getConnectionPath` 为折线：





        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\mind-map\mindMapCore.js
          
changes: undefined
          
现在修复 `MindMapCanvas.jsx` 中的缩放硬编码问题，并添加右键菜单的回调支持：







        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\mind-map\MindMapCanvas.jsx
          
changes: undefined
          

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\mind-map\MindMapCanvas.jsx
          
changes: undefined
          

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\mind-map\MindMapCanvas.jsx
          
changes: undefined
          
现在修改节点的右键菜单处理逻辑：







        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\mind-map\MindMapCanvas.jsx
          
changes: undefined
          
现在修复 `index.jsx` — 移除全局右键绑定，改为使用节点级别的右键回调：







        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\mind-map\index.jsx
          
changes: undefined
          

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\mind-map\index.jsx
          
changes: undefined
          

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\mind-map\index.jsx
          
changes: undefined
          
现在让我更新任务状态，并补充单元测试：









        
            
toolName: todo_write
            
status: success
          
Todos updated: 6 items
          
让我先读取现有测试文件，然后更新和补充测试：








        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\mind-map\mindMapCore.test.js
          
现在我需要更新测试：把贝塞尔曲线的测试改成折线，并补充更多测试用例。让我更新测试文件：










        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\mind-map\mindMapCore.test.js
          
changes: undefined
          
现在让我运行测试，确保所有修改都通过：













        
            
toolName: todo_write
            
status: success
          
Todos updated: 6 items
          

        
            
toolName: run_command
            
status: success
          
command: pnpm test -- src/pages/__tests__/mind-map/ undefined
          
全部 85 个测试通过！让我再运行 GetDiagnostics 检查是否有错误：












        
            
toolName: GetDiagnostics
            
status: success
          
          
完美，没有任何诊断错误！让我完成最后的任务总结：











        
            
toolName: todo_write
            
status: success
          
Todos updated: 6 items
          
所有问题已全部修复！✅ 测试通过 **85/85**，无任何诊断错误。

## 修复内容总结

### 1. App.jsx 路由注册 ✅（已存在）
经检查，`App.jsx` 中的三项均已正确注册：
- [App.jsx#L33](file:///C:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/App.jsx#L33-L33)：`import MindMapPage from '@/pages/mind-map/index.jsx'`
- [App.jsx#L63](file:///C:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/App.jsx#L63-L63)：TASKS 数组中的任务卡片
- [App.jsx#L129](file:///C:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/App.jsx#L129-L129)：`<Route path="/mind-map" element={<MindMapPage />} />`

### 2. 右键菜单触发范围 ✅
**修复前**：整页绑定 `onContextMenu`，只要有选中节点，在任何区域右键都会弹出菜单。  
**修复后**：移除整页绑定，改为在 [MindMapCanvas.jsx#L305-L312](file:///C:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/mind-map/MindMapCanvas.jsx#L305-L312) 的每个节点 `onContextMenu` 中通过新增的 `onNodeContextMenu` 回调触发。[index.jsx#L222-L228](file:///C:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/mind-map/index.jsx#L222-L228) 处理回调并弹出菜单。

### 3. 连线改为折线 ✅
**修复前**：使用贝塞尔曲线（`C` 指令）。  
**修复后**：改为正交折线（`L` 指令，先水平再垂直的 L 形路径）。见 [mindMapCore.js#L373-L387](file:///C:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/mind-map/mindMapCore.js#L373-L387)：
```
M (起点) L (中点X, 起点Y) L (中点X, 终点Y) L (终点)
```

### 4. 缩放边界使用常量 ✅
**修复前**：`MindMapCanvas.jsx` 中 `handleWheel` 硬编码 `Math.max(0.3, Math.min(2.0, ...))`。  
**修复后**：导入并使用 [mindMapCore.js#L355-L357](file:///C:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/mind-map/mindMapCore.js#L355-L357) 已定义的 `clampZoom()` 函数，该函数内部引用 `MIN_ZOOM`/`MAX_ZOOM` 常量。

### 5. 补充单元测试 ✅
更新 [mindMapCore.test.js](file:///C:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/__tests__/mind-map/mindMapCore.test.js) 中的 `getConnectionPath` 测试：
- 断言使用 `L` 而非 `C` 指令
- 验证起点/终点坐标正确性
- 验证折线的水平→垂直→水平正交形态
- 覆盖 left/right 两种方向

### 6. 测试结果
```
 Test Files  1 passed (1)
      Tests  85 passed (85)
```