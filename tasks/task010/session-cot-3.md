好的，我来修复暗色模式下阴影看不见的问题。



        
            
toolName: todo_write
            
status: success
          
Todos updated: 2 items
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\theme-editor\theme-editor.css
          

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\theme-editor\theme-editor.css
          
changes: undefined
          
现在运行测试：





        
            
toolName: todo_write
            
status: success
          
Todos updated: 2 items
          

        
            
toolName: run_command
            
status: success
          
command: pnpm vitest run src/pages/__tests__/theme-editor/themeUtils.test.js undefined
          

        
            
toolName: todo_write
            
status: success
          
Todos updated: 2 items
          
## 修复完成！

### 修改内容

[theme-editor.css](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/theme-editor/theme-editor.css#L35-L38) 第 37 行：

```css
.te-page[data-theme-mode='dark'] {
  color-scheme: dark;
  --te-shadow-color: 255, 255, 255;  /* 从 0, 0, 0 改为 255, 255, 255（白色） */
}
```

暗色模式下 `--te-shadow-color` 从纯黑 `0, 0, 0` 改为纯白 `255, 255, 255`，这样 15% 透明度的白色阴影叠加在深色背景上就能看到明显的悬浮光晕效果了。

### 验证结果

- ✅ **单元测试**：36/36 全部通过