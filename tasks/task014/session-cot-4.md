让我直接修复这两个问题。


        
            
toolName: todo_write
            
status: success
          
Todos updated: 3 items
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\rich-editor\index.jsx
          
现在修复这两个问题：










        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\rich-editor\index.jsx
          
changes: undefined
          
现在修复 CSS 断点：
















        
            
toolName: todo_write
            
status: success
          
Todos updated: 3 items
          

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\rich-editor\rich-editor.css
          
changes: undefined
          
现在运行测试：


















        
            
toolName: todo_write
            
status: success
          
Todos updated: 3 items
          

        
            
toolName: run_command
            
status: success
          
command: pnpm test -- src/pages/__tests__/rich-editor/ undefined
          

        
            
toolName: check_command_status
            
status: success
          
          

        
            
toolName: run_command
            
status: success
          
command: pnpm run test undefined
          
所有 1193 个测试全部通过！让我标记任务完成：


















        
            
toolName: todo_write
            
status: success
          
Todos updated: 3 items
          
两个遗留问题都已修复，全部 1193 个测试通过。

## ✅ 修复内容

### 1. `handleFileSelect` 中 `commitPendingInput()` 位置修正（[index.jsx](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/rich-editor/index.jsx#L429-L431)）

**之前**：`commitPendingInput()` 放在 `await fileToBase64(file)` 之后，读取期间用户的输入会被推迟到图片插入时才一起提交，与工具栏/快捷键「先提交再操作」的惯例不一致。

**修复后**：`commitPendingInput()` 移到了 `await` 之前（紧跟在 `dialogSnapshot` 之后），在开始异步读取图片文件前就立即把待合并的输入提交进历史栈。

### 2. CSS 断点从 400px 改为 375px（[rich-editor.css](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/rich-editor/rich-editor.css#L565)）

**之前**：`@media (max-width: 400px)`，导致 376px～400px 之间的设备也会误触发窄屏样式。

**修复后**：`@media (max-width: 375px)`，只对真正的 375px 及以下宽度生效。

### 3. 测试验证

- ✅ **全部 1193 个测试通过**（22 个测试文件）
  - 富文本编辑器 97 个测试通过
  - 其他页面 1096 个测试通过（包括之前有过 1 个失败的 orders/utils.test.js，这次也全部通过）