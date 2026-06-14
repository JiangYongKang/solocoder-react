让我来找到 index.jsx 中调用 `getHandles` 的两个位置：
        
            
toolName: search_by_regex
            
status: success
          
query: getHandles\(
          

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\screenshot-annotator\index.jsx
          
changes: undefined
          

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\screenshot-annotator\index.jsx
          
changes: undefined
          

        
            
toolName: run_command
            
status: success
          
command: pnpm vitest run src/pages/__tests__/screenshot-annotator/ undefined
          
164 个测试全部通过。

修复完成：在 [index.jsx 第 514 行](file:///C:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/screenshot-annotator/index.jsx#L514)（handleMouseDown 命中测试）和 [第 927 行](file:///C:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/screenshot-annotator/index.jsx#L927)（renderHandles DOM 渲染）两处，将 `getHandles(ann)` 改为 `getHandles(ann, HANDLE_SIZE)`，显式传入常量而非依赖默认参数的巧合值，消除了隐式耦合。