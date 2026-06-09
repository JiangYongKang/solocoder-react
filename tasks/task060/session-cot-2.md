让我先检查当前代码状态，然后逐一修复这些问题。
        
            
toolName: todo_write
            
status: success
          
Todos updated: 3 items
          
先查看 Modern 模板的渲染逻辑：

        
            
toolName: view_files
            
status: success
          
            
filePath: /Users/vincent/GoletaLab/solocoder-react/src/pages/resume-editor/ResumePreview.jsx
          
让我继续看 mainMods 的渲染部分：


        
            
toolName: view_files
            
status: success
          
            
filePath: /Users/vincent/GoletaLab/solocoder-react/src/pages/resume-editor/ResumePreview.jsx
          
问题已明确。ModernTemplate 的 `mainMods` 渲染区在 line 230 只处理了 `SELF_EVALUATION`，缺少对 `CUSTOM` 类型的处理。同时让我检查是否还有废弃代码残留：


        
            
toolName: search_by_regex
            
status: success
          
query: reorderModules|handleLegacyReorder|onLegacyReorder
          

        
            
toolName: search_by_regex
            
status: success
          
query: onChange
          
废弃代码已清理干净。让我确认 ListEditor 的调用没有多余的 onChange prop：




        
            
toolName: view_files
            
status: success
          
            
filePath: /Users/vincent/GoletaLab/solocoder-react/src/pages/resume-editor/FormEditor.jsx
          
ListEditor 调用已清理干净，没有多余的 onChange prop。现在让我修复 Modern 模板的问题，同时也检查 Minimal 模板是否有同样问题：






        
            
toolName: view_files
            
status: success
          
            
filePath: /Users/vincent/GoletaLab/solocoder-react/src/pages/resume-editor/ResumePreview.jsx
          
让我继续看 MinimalTemplate 的结尾部分：







        
            
toolName: view_files
            
status: success
          
            
filePath: /Users/vincent/GoletaLab/solocoder-react/src/pages/resume-editor/ResumePreview.jsx
          
确认了问题：
- **ClassicTemplate** 和 **MinimalTemplate** 都正确处理了 CUSTOM 类型
- **ModernTemplate** 的 mainMods 区域只处理了 SELF_EVALUATION，缺少 CUSTOM

现在修复 ModernTemplate，同时确认废弃代码已全部清理：




        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: /Users/vincent/GoletaLab/solocoder-react/src/pages/resume-editor/ResumePreview.jsx
          
changes: undefined
          

        
            
toolName: todo_write
            
status: success
          
Todos updated: 3 items
          
让我全面检查所有相关代码，确认废弃代码是否都已清理：





        
            
toolName: search_by_regex
            
status: success
          
query: handleLegacyReorder|onLegacyReorder
          

        
            
toolName: search_by_regex
            
status: success
          
query: reorderModules
          

        
            
toolName: search_by_regex
            
status: success
          
query: ListEditor
          
所有废弃代码已清理完毕。让我快速确认一下 index.jsx 的导入：







        
            
toolName: search_by_regex
            
status: success
          
query: ^import
          

        
            
toolName: view_files
            
status: success
          
            
filePath: /Users/vincent/GoletaLab/solocoder-react/src/pages/resume-editor/index.jsx
          
导入全部清理干净。让我也检查一下 ModulePanel 是否还有遗留：








        
            
toolName: search_by_regex
            
status: success
          
query: onLegacyReorder|handleLegacyReorder
          
废弃代码全部清理干净。现在运行测试：







        
            
toolName: todo_write
            
status: success
          
Todos updated: 3 items
          

        
            
toolName: run_command
            
status: success
          
command: cd /Users/vincent/GoletaLab/solocoder-react && pnpm run test undefined
          
测试脚本配置只跑了 sticky-wall 的测试。让我显式运行简历编辑器的测试：









        
            
toolName: run_command
            
status: success
          
command: cd /Users/vincent/GoletaLab/solocoder-react && npx vitest run src/pages/__tests__/resume-editor/ undefined
          
所有 84 个测试全部通过！让我再跑一次 lint 确认：










        
            
toolName: run_command
            
status: success
          
command: cd /Users/vincent/GoletaLab/solocoder-react && npx eslint src/pages/resume-editor/ src/pages/__tests__/resume-editor/ 2>&1 undefined
          
Lint 也全部通过（无错误输出，退出码 0）。所有修复完成：










        
            
toolName: todo_write
            
status: success
          
Todos updated: 3 items
          
所有三个问题已修复完成！以下是修复详情：

## 1. Modern 模板自定义模块内容不显示 ✅

**修改文件**：[ResumePreview.jsx](file:///Users/vincent/GoletaLab/solocoder-react/src/pages/resume-editor/ResumePreview.jsx#L230-L233)

在 `ModernTemplate` 的 `mainMods` 渲染区，原代码只处理了 `SELF_EVALUATION` 类型：
```jsx
{(mod.type === MODULE_TYPES.SELF_EVALUATION) && (
  <div className="re-cv-text-content">{mod.data?.content || ''}</div>
)}
```

现已补充 `CUSTOM` 类型处理，与 Classic 模板和 Minimal 模板保持一致：
```jsx
{(mod.type === MODULE_TYPES.SELF_EVALUATION ||
  mod.type === MODULE_TYPES.CUSTOM) && (
  <div className="re-cv-text-content">{mod.data?.content || ''}</div>
)}
```

## 2. 废弃代码清理 ✅

经全面检查，以下废弃代码在上一轮已全部清理干净：
- `index.jsx` 中 `reorderModules` 导入：已移除
- `index.jsx` 中 `handleLegacyReorder` 回调：已移除
- `ModulePanel` 调用处 `onLegacyReorder` prop：已移除
- `FormEditor.jsx` 中 `ListEditor` 调用处多余的 `onChange` prop：三处调用均已移除

## 3. 测试与 Lint 验证 ✅

- **单元测试**：84 个测试全部通过
- **ESLint**：无任何错误