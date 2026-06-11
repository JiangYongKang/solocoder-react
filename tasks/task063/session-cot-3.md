我来仔细分析这两个 bug 并修复。先阅读当前代码确认具体位置：
        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\sudoku\index.jsx
          

        
            
toolName: todo_write
            
status: success
          
Todos updated: 4 items
          
我现在对这两个 bug 都有了清晰的理解。让我一次性实现完整的修复，因为它们在 `hintedCells`/`hintRemovedNotes` 跟踪上相互关联。

**Bug 1 分析**：`handleRedo` 中 fill 类型的 `wasHinted` 逻辑照搬了 `handleUndo` 的"加回"逻辑。Redo 是重新执行一次手动填入，应该从 `hintedCells` 中删除（而非添加），因为提示格子正在被手动值覆盖。

**Bug 2 分析**：`handleHint` 丢弃了 `result.autoRemoved`，导致提示自动移除的候选笔记永久丢失。需要像 `handleNumberInput` 一样保存这些信息，并在擦除/覆盖提示格子时恢复。
        
            
toolName: Write
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\sudoku\index.jsx
          
changes: undefined
          
现在更新 `sudokuCore.js` 来持久化 `hintRemovedNotes`：
        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\sudoku\sudokuCore.js
          

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\sudoku\sudokuCore.js
          
changes: undefined
          

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\sudoku\sudokuCore.js
          
changes: undefined
          

        
            
toolName: todo_write
            
status: success
          
Todos updated: 4 items
          
现在运行测试和代码检查：
        
            
toolName: run_command
            
status: success
          
command: pnpm run test src/pages/__tests__/sudoku/sudokuCore.test.js undefined
          
57 个测试通过。现在运行 lint：
        
            
toolName: run_command
            
status: success
          
command: npx eslint src/pages/sudoku/ undefined
          
代码检查通过。让我再核实一下诊断信息：
        
            
toolName: GetDiagnostics
            
status: success
          
          

        
            
toolName: todo_write
            
status: success
          
Todos updated: 4 items
          
所有修复完成。以下是详细说明：

## Bug 1 修复：handleRedo fill 的 hintedCells 逻辑语义反转

**问题**：在 [handleRedo](file:///C:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/sudoku/index.jsx#L364-L434) 中，fill 类型的 `wasHinted` 分支照搬了 `handleUndo` 的"加回"逻辑：`next.add(cellKey)`。但 redo 是重新执行手动填入，应该从 `hintedCells` 删除（提示格子正被手动值覆盖），而非加回。

**修复**：将 handleRedo fill 分支中的 hintedCells 操作统一为 `next.delete(cellKey)`（L390-L399），并同步清除 `hintRemovedNotes`。无论 `wasHinted` 为何值，redo fill 后该格子都不应是提示状态。

操作序列验证（提示填 A → 手动覆盖 A → 撤销 → 重做）：
- 撤销：`handleUndo` 的 `wasHinted` 分支正确地 **加回** `hintedCells`（恢复提示状态）✓
- 重做：`handleRedo` 现在 **删除** `hintedCells`（重新执行覆盖）✓（之前错误地加回）

## Bug 2 修复：handleHint 丢弃 autoRemoved 导致候选笔记永久丢失

**问题**：[handleHint](file:///C:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/sudoku/index.jsx#L436-L488) 调用 `autoRemoveNotes` 时只取了 `result.notes`，丢弃了 `result.autoRemoved`。提示自动移除的候选笔记无法恢复。

**修复**：引入 `hintRemovedNotes` 状态（`{ [cellKey]: Array<{row, col, num}> }`），在多个关键路径中正确处理：

1. **[handleHint](file:///C:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/sudoku/index.jsx#L462-L480)**：保存 `result.autoRemoved` 到 `hintRemovedNotes[cellKey]`
2. **[handleErase](file:///C:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/sudoku/index.jsx#L270-L296)**：擦除提示格子时，先恢复 `hintRemovedNotes[cellKey]` 中的笔记到同行列宫格子
3. **[handleNumberInput](file:///C:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/sudoku/index.jsx#L201-L244)**：覆盖提示格子时，先恢复提示的 autoRemoved 笔记，再应用新数字的 autoRemove
4. **[handleUndo](file:///C:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/sudoku/index.jsx#L312-L356)**：撤销 fill/erase 时，`hintAutoRemoved` 的笔记需 **重新移除**（因为提示值回到了格子中）；同时恢复 `hintRemovedNotes` 映射
5. **[handleRedo](file:///C:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/sudoku/index.jsx#L375-L424)**：重做 fill/erase 时，`hintAutoRemoved` 的笔记需 **加回**（因为提示值离开了格子）；同时清除 `hintRemovedNotes` 映射

`autoRemovedNotes` 与 `hintAutoRemoved` 的语义对比：
- `autoRemovedNotes`：本次操作移除的笔记 → 撤销时加回，重做时重新移除
- `hintAutoRemoved`：之前被提示 autoRemove 移除、本次操作恢复的笔记 → 撤销时重新移除，重做时加回

持久化：[sudokuCore.js](file:///C:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/sudoku/sudokuCore.js#L249) 的 `saveGameState` / `loadGameState` 中新增 `hintRemovedNotes` 字段，`hintRemovedNotes` 是纯 JSON 对象，无需额外序列化。