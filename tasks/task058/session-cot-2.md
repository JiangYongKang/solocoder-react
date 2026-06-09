让我先查看相关代码并修复这两个问题：
        
            
toolName: todo_write
            
status: success
          
Todos updated: 3 items
          

        
            
toolName: search_by_regex
            
status: success
          
query: handleImportFile
          
现在让我查看 handleMouseDown 函数：


        
            
toolName: search_by_regex
            
status: success
          
query: handleMouseDown
          
现在我清楚了两个问题。让我修复它们：

**问题1：JSON 导入尺寸不匹配时，不应该设置 importPendingData**
**问题2：PICKER 工具中 processCell 被重复调用了**




        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: /Users/vincent/GoletaLab/solocoder-react/src/pages/pixel-editor/index.jsx
          
changes: undefined
          
现在修复第二个问题 - PICKER 工具的冗余调用：








        
            
toolName: todo_write
            
status: success
          
Todos updated: 3 items
          

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: /Users/vincent/GoletaLab/solocoder-react/src/pages/pixel-editor/index.jsx
          
changes: undefined
          
现在还需要移除导入对话框中关于"继续导入将重置画布尺寸"的提示，因为尺寸不匹配时现在直接阻止导入了。让我查看相关代码：










        
            
toolName: search_by_regex
            
status: success
          
query: 继续导入将重置
          

        
            
toolName: view_files
            
status: success
          
            
filePath: /Users/vincent/GoletaLab/solocoder-react/src/pages/pixel-editor/index.jsx
          

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: /Users/vincent/GoletaLab/solocoder-react/src/pages/pixel-editor/index.jsx
          
changes: undefined
          
现在运行测试确保全部通过：


















        
            
toolName: todo_write
            
status: success
          
Todos updated: 3 items
          

        
            
toolName: run_command
            
status: success
          
command: cd /Users/vincent/GoletaLab/solocoder-react && npx eslint src/pages/pixel-editor/ src/pages/__tests__/pixel-editor/ && pnpm test -- src/pages/__tests__/pixel-editor/pixelEditorCore.test.js undefined
          
测试似乎被中断了，让我再运行一次：

















        
            
toolName: run_command
            
status: success
          
command: cd /Users/vincent/GoletaLab/solocoder-react && pnpm test -- src/pages/__tests__/pixel-editor/pixelEditorCore.test.js undefined
          
很好！所有失败的 7 个测试都来自 `logistics-tracker` 模块，与我们的像素画编辑器无关。我们的像素画编辑器测试 **74 个全部通过** ✅。

让我也单独确认一下 lint 检查：













        
            
toolName: run_command
            
status: success
          
command: cd /Users/vincent/GoletaLab/solocoder-react && npx eslint src/pages/pixel-editor/ src/pages/__tests__/pixel-editor/ && echo "✅ Lint 检查通过" undefined
          

        
            
toolName: todo_write
            
status: success
          
Todos updated: 3 items
          
两个 Bug 已全部修复，验证通过 ✅

## 修复总结

### 问题1：JSON 导入尺寸不匹配时阻止导入
**修复位置**：[index.jsx#L357-L360](file:///Users/vincent/GoletaLab/solocoder-react/src/pages/pixel-editor/index.jsx#L357-L360)

**修复内容**：尺寸不匹配时，将 `setImportPendingData(result.data)` 改为 `setImportPendingData(null)`，确保「导入」按钮保持禁用状态，用户无法强行导入不匹配尺寸的数据。

### 问题2：PICKER 工具 processCell 冗余调用
**修复位置**：[index.jsx#L235-L250](file:///Users/vincent/GoletaLab/solocoder-react/src/pages/pixel-editor/index.jsx#L235-L250)

**修复内容**：将原本 `t === TOOLS.FILL || t === TOOLS.PICKER` 的合并分支拆分为两个独立分支：
- **PICKER**：只调用一次 `processCell`，不需要历史记录和网格更新
- **FILL**：独立处理，正常记录历史并更新网格

同时移除了导入 Modal 中不再需要的「继续导入将重置当前画布尺寸」提示（[index.jsx#L667-L672](file:///Users/vincent/GoletaLab/solocoder-react/src/pages/pixel-editor/index.jsx#L667-L672)）。

## 验证结果
- ✅ **ESLint**：0 errors, 0 warnings
- ✅ **像素画编辑器测试**：74 个测试全部通过
- ⚠️ **其他模块**：`logistics-tracker` 模块有 7 个测试失败（与本次修改无关，为项目原有问题）