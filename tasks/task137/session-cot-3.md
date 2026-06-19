toolName: todo_write
            
status: success
          
Todos updated: 4 items
          
先读取当前文件状态：
        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\sms-template\index.jsx
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\sms-template\index.jsx
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\sms-template\sms-template.css
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\sms-template\sms-template.css
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\sms-template\index.jsx
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\sms-template\index.jsx
          
现在我已经完整了解了所有需要修复的位置。开始逐个修复：
        
            
toolName: todo_write
            
status: success
          
Todos updated: 4 items
          
**修复1：disabled 状态下 textarea 背景遮挡 overlay**

方案：textarea disabled 时改为 `color: transparent`（文字也由 overlay 承担），overlay 层在 disabled 时使用灰色文字和蓝色高亮。
        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\sms-template\sms-template.css
          
changes: undefined
          
现在在 index.jsx 的 textarea-wrapper 上添加 `is-disabled` 类名：
        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\sms-template\index.jsx
          
changes: undefined
          

        
            
toolName: todo_write
            
status: success
          
Todos updated: 4 items
          
**修复2+3：合并重复的渲染函数 + 消除 previewContent 重复计算**

将两个重复函数合并为一个 `renderContentWithVars`，参数化 CSS 类名和 key 前缀。同时修复预览渲染直接使用已计算的 `previewContent`。
        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\sms-template\index.jsx
          
changes: undefined
          
现在更新编辑区 overlay 的调用：
        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\sms-template\index.jsx
          
changes: undefined
          
现在修复预览面板，直接使用 `previewContent` 而不是重复计算：
        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\sms-template\index.jsx
          
changes: undefined
          
现在 `buildPreviewContent` 不再需要在 index.jsx 的 import 中了（预览面板不再直接调用），但 `previewContent` useMemo 中还在用它。让我确认 import：
        
            
toolName: search_by_regex
            
status: success
          
query: buildPreviewContent
          
`buildPreviewContent` 仍在 `previewContent` 的 useMemo 中使用，所以 import 需要保留。
        
            
toolName: todo_write
            
status: success
          
Todos updated: 4 items
          

        
            
toolName: run_command
            
status: success
          
command: cd c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react ; pnpm run test -- src/pages/__tests__/sms-template/utils.test.js 2>&1 undefined
          
107个测试全部通过！
        
            
toolName: todo_write
            
status: success
          
Todos updated: 4 items
          
4个问题全部修复完毕，107个测试全部通过 ✅。以下是修复详情：

---

## 修复清单

### 1️⃣ disabled 状态下 textarea 背景遮挡高亮 overlay

**问题**：textarea disabled 时 `background: #f5f7fa` + `z-index: 2` 完全遮住了 `z-index: 1` 的 overlay 高亮层，变量蓝色标记不可见。

**修复**：
- [sms-template.css](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/sms-template/sms-template.css#L454-L467)：textarea disabled 时改为 `color: transparent` + `caret-color: transparent`，文字渲染交由 overlay 层承担；新增 `.is-disabled` 修饰类让 overlay 在 disabled 时显示灰色文字（`#909399`），变量高亮依然保持蓝色背景
- [index.jsx](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/sms-template/index.jsx#L898)：textarea-wrapper 动态添加 `is-disabled` 类名

### 2️⃣ 合并重复的变量解析渲染函数

**问题**：`renderEditorHighlight` 和 `renderHighlightedContent` 各有一套完全相同的正则解析循环，仅 CSS 类名和 key 前缀不同，维护时容易遗漏。

**修复**：[index.jsx](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/sms-template/index.jsx#L698-L722) 合并为单一函数 `renderContentWithVars`，通过参数化选项 `{ varClassName, keyPrefix, fallback, trailingNewline }` 区分调用场景：
- 编辑区 overlay：`renderContentWithVars(content, { varClassName: 'sms-var-highlight', keyPrefix: 'ed', fallback: '\n', trailingNewline: true })`
- 预览面板：`renderContentWithVars(previewContent)`（默认使用 `sms-variable` 类名）

### 3️⃣ 消除 previewContent 的重复计算

**问题**：`previewContent` 的 useMemo 已完成签名拼接 + 变量替换的完整计算，但预览面板渲染时又内联重算了一遍 `buildPreviewContent(...)`。

**修复**：[index.jsx](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/sms-template/index.jsx#L1007-L1012) 预览面板直接使用 `renderContentWithVars(previewContent)`，不再重复计算。

### 4️⃣ 测试验证

**107 / 107 单元测试全部通过** ✅