我来分析并修复这个 URL 二次转义问题。

问题本质：`mdProtectInline` 接收的是已转义文本，URL 已经被 `mdEscapeHtml` 处理过了（`<` 变成 `&lt;`），然后 `sanitizeUrl` 又对 URL 调用一次 `mdEscapeHtml`，导致 `&` 被再次转义成 `&amp;`，最终变成 `&amp;lt;`。

解决方案：调整解析顺序——**先对原始文本做行内语法解析（用 Token 保护），再对整体做 HTML 转义**。Token 不含特殊字符，不会受转义影响，而 URL、链接文本、code 内容等在 Token 内部单独做一次正确的 HTML 转义。

让我先看一下当前代码：

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\snippets\snippetsUtils.js
          
让我先添加一个测试用例来验证这个问题，然后修复：


        
            
toolName: todo_write
            
status: success
          
Todos updated: 4 items
          
让我先添加测试用例：



        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\snippets\snippetsUtils.test.js
          

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\snippets\snippetsUtils.test.js
          
changes: undefined
          
让我先运行新测试确认问题存在：



        
            
toolName: todo_write
            
status: success
          
Todos updated: 4 items
          
现在修复核心逻辑。先修改 `mdProtectInline`，让它接收原始文本并在内部对各部分做转义：





        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\snippets\snippetsUtils.js
          
changes: undefined
          
现在修改 `renderMarkdown`，把解析顺序调整为先 protect 再 escape：





        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\snippets\snippetsUtils.js
          
changes: undefined
          
现在运行测试：






        
            
toolName: todo_write
            
status: success
          
Todos updated: 4 items
          

        
            
toolName: run_command
            
status: success
          
command: pnpm run test -- src/pages/__tests__/snippets/snippetsUtils.test.js undefined
          
107 个测试全部通过！现在运行所有测试并启动 dev server：










        
            
toolName: run_command
            
status: success
          
command: pnpm run test undefined
          
全部 2106 个测试通过！现在启动 dev server 并验证 lint：








        
            
toolName: todo_write
            
status: success
          
Todos updated: 4 items
          

        
            
toolName: run_command
            
status: running
          
command: pnpm exec eslint src/pages/snippets/ src/pages/__tests__/snippets/ ; pnpm run dev undefined
          

        
            
toolName: check_command_status
            
status: success
          
          
ESLint 零错误，dev server 已启动！让我打开预览：











        
            
toolName: open_preview
            
status: success
          
预览
          

        
            
toolName: todo_write
            
status: success
          
Todos updated: 4 items
          
URL 二次转义问题已全部修复完成！

## 修复总结

### 问题根因
旧流程是**先 HTML 全量转义，再做行内语法解析**：
- 原始 URL：`https://example.com?q=<x>`
- 全量转义后：`https://example.com?q=&lt;x&gt;` （`<` 已变成 `&lt;`）
- `sanitizeUrl` 再次调用 `mdEscapeHtml`，把 `&` 再转成 `&amp;`，最终变成 `&amp;lt;x&amp;gt;`

### 修复方案
调整为**先做行内语法解析（Token 保护）→ 再整体 HTML 转义 → 最后恢复 Token**：

**[snippetsUtils.js](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/snippets/snippetsUtils.js)** 修改：
1. 新增 `processContent()` 辅助函数，封装三步流程
2. `mdProtectInline` 接收原始未转义文本，内部对提取的各部分（code 内容、链接 URL、链接文本、粗体/斜体）各自调用一次 `mdEscapeHtml`
3. Token 占位符 `\u0000TOK...KON\u0001` 不含 `&<>"'` 字符，第二步的整体 `mdEscapeHtml` 不会影响它们
4. 所有块级元素（标题、引用、列表、普通行）统一走 `processContent()` 流程

**[snippetsUtils.test.js](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/__tests__/snippets/snippetsUtils.test.js)** 新增 3 个测试：
- URL 在普通文本中只转义一次
- URL 在列表项中只转义一次
- URL 在标题中只转义一次

### 验证结果
| 检查项 | 结果 |
|--------|------|
| 全部单元测试 | **2106 passed** |
| snippets 模块 ESLint | **0 errors** |
| Dev Server | 已启动 http://localhost:5174/snippets |

你可以在浏览器中打开 http://localhost:5174/snippets，用 DevTools 设备模拟切换 375px 和 1440px 宽度验证布局。