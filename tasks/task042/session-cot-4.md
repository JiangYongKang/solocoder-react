好的，我来快速修复测试文件中未使用的导入问题。






        
            
toolName: todo_write
            
status: success
          
Todos updated: 3 items
          

        
            
toolName: view_files
            
status: success
          
            
filePath: /Users/vincent/GoletaLab/solocoder-react/src/pages/__tests__/image-editor/imageEditorCore.test.js
          

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: /Users/vincent/GoletaLab/solocoder-react/src/pages/__tests__/image-editor/imageEditorCore.test.js
          
changes: undefined
          

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: /Users/vincent/GoletaLab/solocoder-react/src/pages/__tests__/image-editor/imageEditorCore.test.js
          
changes: undefined
          

        
            
toolName: todo_write
            
status: success
          
Todos updated: 3 items
          

        
            
toolName: run_command
            
status: success
          
command: cd /Users/vincent/GoletaLab/solocoder-react && npm test -- src/pages/__tests__/image-editor/ undefined
          
60 个测试全部通过！现在运行 lint 检查：







        
            
toolName: todo_write
            
status: success
          
Todos updated: 3 items
          

        
            
toolName: GetDiagnostics
            
status: success
          
          

        
            
toolName: GetDiagnostics
            
status: success
          
          

        
            
toolName: todo_write
            
status: success
          
Todos updated: 3 items
          
所有问题已修复完成！

## 🔧 修复内容

从 [imageEditorCore.test.js](file:///Users/vincent/GoletaLab/solocoder-react/src/pages/__tests__/image-editor/imageEditorCore.test.js) 中删除了两个未使用的导入：

1. **第 1 行**：删除 `beforeEach`（从 vitest 导入）
2. **第 50 行**：删除 `EXPORT_FORMAT_NAMES`（从 constants.js 导入）

---

## ✅ 验证结果

| 项目 | 结果 |
|------|------|
| 单元测试 | **60/60 全部通过** |
| ESLint 检查 | 所有 image-editor 相关文件 **0 报错** |