我来按照要求逐一修复这些问题。首先查看相关文件的当前状态：
        
            
toolName: todo_write
            
status: success
          
Todos updated: 4 items
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\route-planner\routeUtils.js
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\sticky-notes\stickyNotesUtils.js
          
确认了三个问题：

1. `copyToClipboard`：可用性判断仍在 try 内部（第397行）
2. `downloadJSON`：`revokeObjectURL` 有额外 try-catch（第386-388行）
3. `stickyNotesUtils.js`：`moveNoteById` 有 `adjustedIndex` 逻辑（第202行）

现在逐一修复：

## 修复1：copyToClipboard —— 将可用性判断移回 try-catch 外部

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\route-planner\routeUtils.js
          
changes: undefined
          

        
            
toolName: todo_write
            
status: success
          
Todos updated: 4 items
          
## 修复2：downloadJSON —— 移除 revokeObjectURL 额外的 try-catch



        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\route-planner\routeUtils.js
          
changes: undefined
          

        
            
toolName: todo_write
            
status: success
          
Todos updated: 4 items
          
## 修复3：还原 sticky-notes moveNoteById 函数的索引偏移逻辑





        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\sticky-notes\stickyNotesUtils.js
          
changes: undefined
          

        
            
toolName: todo_write
            
status: success
          
Todos updated: 4 items
          
## 修复4：运行 route-planner 包测试

现在运行 route-planner 包的测试，确认 104 个测试全部通过：




        
            
toolName: run_command
            
status: success
          
command: pnpm vitest run src/pages/__tests__/route-planner/ undefined
          
有两个测试失败了，需要修改测试以匹配还原后的生产代码行为：

1. `should handle revokeObjectURL throwing gracefully`：由于我们移除了额外 try-catch，revokeObjectURL 抛错现在会被外层 catch 返回 false，测试应期望 `false` 而非 `true`
2. `should catch generic exceptions from clipboard API`：由于判断移回了 try 外部，clipboard getter 抛错会在 try 外触发，需要改用 `writeText` 同步抛错的方式

让我读取并修复这两个测试：

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\route-planner\routeUtils.test.js
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\route-planner\routeUtils.test.js
          
现在修复这两个测试用例：



        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\route-planner\routeUtils.test.js
          
changes: undefined
          

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\route-planner\routeUtils.test.js
          
changes: undefined
          
现在重新运行 route-planner 包测试：



        
            
toolName: run_command
            
status: success
          
command: pnpm vitest run src/pages/__tests__/route-planner/ undefined
          
route-planner 包的 104 个测试全部通过！现在更新 todo：



        
            
toolName: todo_write
            
status: success
          
Todos updated: 4 items
          
所有问题已按要求修复完成！以下是修复总结：

## 修复内容

### 1. copyToClipboard —— 可用性判断与异常处理分离 ✅

在 [routeUtils.js](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/route-planner/routeUtils.js#L395-L403) 中，将 `navigator.clipboard` 可用性判断移回 `try-catch` 外部：

```js
export async function copyToClipboard(text) {
  if (typeof navigator === 'undefined' || !navigator.clipboard) return false;  // 判断移到 try 外部
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
```

这样**不可用检查**和 **writeText 异常处理**各自独立，边界清晰分离。

### 2. downloadJSON —— 移除 revokeObjectURL 额外 try-catch ✅

在 [routeUtils.js](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/route-planner/routeUtils.js#L375-L391) 中，移除了对 `URL.revokeObjectURL` 额外包裹的内层 `try-catch`，使其与外层异常处理统一：

```js
export function downloadJSON(content, filename) {
  if (typeof window === 'undefined') return false;
  try {
    ...
    URL.revokeObjectURL(url);  // 直接调用，不再单独 try-catch
    return true;
  } catch {
    return false;
  }
}
```

### 3. sticky-notes —— 还原 moveNoteById 索引偏移逻辑 ✅

在 [stickyNotesUtils.js](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/sticky-notes/stickyNotesUtils.js#L199-L203) 中，删除了不属于本任务包的 `adjustedIndex` 偏移逻辑：

```js
export function moveNoteById(notes, noteId, targetIndex) {
  const fromIndex = notes.findIndex(n => n.id === noteId)
  if (fromIndex === -1) return notes
  return reorderNotes(notes, fromIndex, targetIndex)  // 直接传递 targetIndex
}
```

### 4. route-planner 测试用例同步更新 ✅

在 [routeUtils.test.js](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/__tests__/route-planner/routeUtils.test.js) 中，同步更新了两个测试用例的期望以匹配还原后的生产代码行为：

- **`should handle revokeObjectURL throwing gracefully`**：期望从 `true` 改为 `false`（因为额外 try-catch 已移除，revokeObjectURL 抛错会被外层捕获返回 false）
- **`should catch generic exceptions from clipboard API`**：将 getter 抛错 mock 改为 `writeText` 同步抛错 mock，确保异常在 try-catch 内部被捕获（符合"测试不应驱动生产代码架构变更"的原则）

### 测试结果 ✅

```
Test Files  1 passed (1)
     Tests  104 passed (104)
  Duration  327ms
```

**修复范围严格遵守要求**：仅修改了 `route-planner` 包相关文件（生产代码 + 测试），以及还原了 `sticky-notes` 包中不属于本任务的改动。