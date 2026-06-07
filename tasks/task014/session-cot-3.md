让我先查看当前的 index.jsx 文件，然后修复这些问题。

        
            
toolName: todo_write
            
status: success
          
Todos updated: 4 items
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\rich-editor\index.jsx
          
现在修复这两个问题。主要修复思路：
1. 对于异步的 image-file 处理，在 await 之后使用 `setHistory` 的函数式更新拿到最新状态，并从 DOM 重新读取光标
2. 普通 text 类型粘贴也需要调用 `commitPendingInput`
3. `handleFileSelect`（对话框上传图片）也有同样的闭包问题







        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\rich-editor\index.jsx
          
changes: undefined
          
现在也修复 `handleFileSelect`（对话框上传图片）同样的闭包问题：










        
            
toolName: todo_write
            
status: success
          
Todos updated: 4 items
          

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\rich-editor\index.jsx
          
changes: undefined
          
现在检查 CSS 文件并优化 375px 移动端布局：












        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\rich-editor\rich-editor.css
          
让我增强 375px 移动端的布局支持：













        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\rich-editor\rich-editor.css
          
changes: undefined
          
现在运行所有测试：


















        
            
toolName: todo_write
            
status: success
          
Todos updated: 4 items
          

        
            
toolName: run_command
            
status: success
          
command: pnpm run test undefined
          
所有富文本编辑器相关的测试都通过了。失败的那个测试是 `orders/utils.test.js` 中的，是项目原本就存在的问题，与本次修改无关。让我确认富文本编辑器测试全部通过：
















        
            
toolName: run_command
            
status: success
          
command: pnpm test -- src/pages/__tests__/rich-editor/ undefined
          
富文本编辑器 97 个测试全部通过！现在检查代码诊断：

















        
            
toolName: GetDiagnostics
            
status: success
          
          

        
            
toolName: todo_write
            
status: success
          
Todos updated: 4 items
          
所有遗留问题已修复完成！以下是详细的修复内容：

## ✅ 修复内容

### 1. 粘贴图片文件异步闭包状态过时问题（[index.jsx](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/rich-editor/index.jsx#L231-L252)）

**问题**：`handlePaste` 中 `fileToBase64` 是异步的，等待期间用户可能继续编辑，导致闭包捕获的 `content`、`start`、`end` 过时。

**修复**：在 `await` 之后使用 `setHistory` 的**函数式更新**（updater），由 React 传入最新的 history state：
```js
setHistory((h) => {
  const currentContent = getHistoryContent(h.present)  // 取最新内容
  const selection = getSelection()                    // 从 DOM 读当前光标
  // ...用最新值计算插入
})
```
并在 `requestAnimationFrame` 中恢复光标，确保后续渲染完成后定位准确。

### 2. 普通文本粘贴未提交待合并输入（[index.jsx](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/rich-editor/index.jsx#L213-L216)）

**问题**：粘贴普通文本时没有调用 `commitPendingInput()`，导致粘贴内容和之前的连续打字被合并进同一条历史记录。

**修复**：在 `detectPastedContent` 返回 `type === 'text'` 时，显式调用 `commitPendingInput()` 后 `return`，交由浏览器执行默认粘贴行为，同时保持历史记录的逻辑单元独立。

### 3. 对话框上传图片 handleFileSelect 同样的闭包问题（[index.jsx](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/rich-editor/index.jsx#L416-L455)）

**问题**：和粘贴图片一样，`handleFileSelect` 中 `fileToBase64` 异步等待期间，`content` 和 `dialog` 可能已经过时。

**修复**：
- 进入异步前先对 `dialog` 做**快照**：`const dialogSnapshot = { ...dialog }`，避免弹窗状态变化导致 start/end 丢失
- `await` 后同样用 `setHistory((h) => ...)` 的函数式更新取最新内容
- 调用 `commitPendingInput()` 确保不与之前的输入合并

### 4. 375px 移动端布局优化（[rich-editor.css](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/rich-editor/rich-editor.css#L565-L733)）

新增 `@media (max-width: 400px)` 断点专门适配：

| 元素 | 优化 |
|---|---|
| `.re-toolbar` | `flex-wrap: nowrap` + `overflow-x: auto` + 隐藏滚动条 → 工具栏可横滑，不会换行撑高 |
| `.re-toolbar-btn` | 30×30px 小按钮，12px 字体 |
| `.re-container` | padding 12px，gap 10px |
| `.re-title` | 18px |
| `.re-textarea` / `.re-preview-content` | padding 12px，13px 字体，更紧凑行高 |
| `.re-preview-content h1/h2/h3` | 20/17/15px，减少 margin |
| `.re-dialog` | padding 16px，radius 12px，按钮和输入缩小 |
| `.re-saved-text` | `max-width: 70px` + 省略号，防止小屏挤掉标题 |
| `.re-radio-group` | `flex-wrap: wrap`，避免小屏横向溢出 |

### 5. 测试验证

- ✅ **富文本编辑器 97 个单元测试全部通过**
- ✅ 所有修改文件 ESLint/诊断零错误
- ⚠️ 全量测试中 1 个失败用例来自 `src/pages/__tests__/orders/utils.test.js` 的 `saveCart and loadCart round-trip`（购物车 saveCart 多存了 `stock` 字段），与本次富文本编辑器修改**完全无关**，是项目已有的遗留问题。