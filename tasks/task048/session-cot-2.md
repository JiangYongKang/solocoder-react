我来逐一修复这些问题。先创建任务列表：




        
            
toolName: todo_write
            
status: success
          
Todos updated: 5 items
          

        
            
toolName: view_files
            
status: success
          
            
filePath: /Users/vincent/GoletaLab/solocoder-react/src/pages/tetris/tetrisCore.js
          

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: /Users/vincent/GoletaLab/solocoder-react/src/pages/tetris/tetrisCore.js
          
changes: undefined
          

        
            
toolName: todo_write
            
status: success
          
Todos updated: 4 items
          

        
            
toolName: view_files
            
status: success
          
            
filePath: /Users/vincent/GoletaLab/solocoder-react/src/pages/tetris/index.jsx
          
现在修复 `index.jsx` 中的三个问题：1) lockPiece 中的 calculateScore 去掉 level 参数；2) 移除软降加分；3) 移除硬降加分并在硬降后清除 currentPiece 防止双重渲染。

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: /Users/vincent/GoletaLab/solocoder-react/src/pages/tetris/index.jsx
          
changes: undefined
          

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: /Users/vincent/GoletaLab/solocoder-react/src/pages/tetris/index.jsx
          
changes: undefined
          

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: /Users/vincent/GoletaLab/solocoder-react/src/pages/tetris/index.jsx
          
changes: undefined
          

        
            
toolName: todo_write
            
status: success
          
Todos updated: 4 items
          

        
            
toolName: view_files
            
status: success
          
            
filePath: /Users/vincent/GoletaLab/solocoder-react/src/pages/__tests__/tetris/tetrisCore.test.js
          

        
            
toolName: view_files
            
status: success
          
            
filePath: /Users/vincent/GoletaLab/solocoder-react/src/pages/__tests__/tetris/tetrisCore.test.js
          

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: /Users/vincent/GoletaLab/solocoder-react/src/pages/__tests__/tetris/tetrisCore.test.js
          
changes: undefined
          

        
            
toolName: todo_write
            
status: success
          
Todos updated: 4 items
          

        
            
toolName: run_command
            
status: success
          
command: cd /Users/vincent/GoletaLab/solocoder-react && npm test -- src/pages/__tests__/tetris/tetrisCore.test.js undefined
          
所有 55 个测试通过！现在运行 lint 检查：







        
            
toolName: run_command
            
status: success
          
command: cd /Users/vincent/GoletaLab/solocoder-react && npx eslint src/pages/tetris src/pages/__tests__/tetris undefined
          

        
            
toolName: todo_write
            
status: success
          
Todos updated: 4 items
          
所有问题已修复完毕。**55 个单元测试全部通过**，ESLint 无报错。

## 修复内容总结

### 1. 计分规则修正（固定分值，无等级倍率）
- [tetrisCore.js](file:///Users/vincent/GoletaLab/solocoder-react/src/pages/tetris/tetrisCore.js#L113-L115)：`calculateScore` 函数已改为只接受 `linesCleared` 参数，直接返回 SCORE_TABLE 中的固定分值（1行100 / 2行300 / 3行500 / 4行800），不再乘以等级。

### 2. 移除软降和硬降的额外计分
- [index.jsx](file:///Users/vincent/GoletaLab/solocoder-react/src/pages/tetris/index.jsx#L330-L335)：软降（↓/S）已移除 `setScore((prev) => prev + 1)` 加分逻辑。
- [index.jsx](file:///Users/vincent/GoletaLab/solocoder-react/src/pages/tetris/index.jsx#L259-L275)：硬降已移除 `dropDistance * 2` 加分逻辑，只保留消行计分。

### 3. 硬降双重渲染闪烁修复
- [index.jsx](file:///Users/vincent/GoletaLab/solocoder-react/src/pages/tetris/index.jsx#L264-L265)：硬降后立即 `setCurrentPiece(null)` 清除当前方块状态，避免棋盘中已合并的方块与 `currentPiece` 状态中的同一方块在帧间叠加渲染。

### 4. 测试用例修正
- [tetrisCore.test.js](file:///Users/vincent/GoletaLab/solocoder-react/src/pages/__tests__/tetris/tetrisCore.test.js#L314-L343)：计分相关测试期望值已全部修正为固定分值规则：
  - 删除了 `should multiply score by level` 用例
  - 删除了 `should default to level 1 when not specified` 用例
  - 新增 `should return fixed score regardless of level` 验证用例
  - 所有 `calculateScore(n, level)` 调用改为 `calculateScore(n)`