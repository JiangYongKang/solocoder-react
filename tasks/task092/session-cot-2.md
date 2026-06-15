我来逐一修复这些问题。首先创建任务计划：
        
            
toolName: todo_write
            
status: success
          
Todos updated: 4 items
          
让我先读取相关文件了解当前代码状态：

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\wiki\index.jsx
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\wiki\wikiUtils.js
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\wiki\MarkdownEditor.jsx
          
现在我清楚了三个问题的原因。让我逐一修复：

**问题1**：`index.jsx` 的 useEffect 中每次 data 变化都立即调用 saveData，没有防抖。
**问题2**：`searchKeyword` 被绑定到 `showSearchResults`，关闭浮层后变空。
**问题3**：tokenize 用 `\b` 分割会把 HTML 标签拆成多个 token。

先修复 index.jsx 中的问题1和问题2：



        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\wiki\index.jsx
          
changes: undefined
          
现在修改 `handleSelectSearchResult` 和 `MarkdownEditor` 的 props：





        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\wiki\index.jsx
          
changes: undefined
          
现在修改传递给 MarkdownEditor 的 searchKeyword，使用独立的 `activeSearchKeyword`：







        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\wiki\index.jsx
          
changes: undefined
          
现在需要修复 `MarkdownEditor` 中的高亮逻辑。当前的问题是有搜索关键词时直接对纯文本做 `highlightTextSafe`，不会渲染 Markdown。需要先渲染 Markdown，再在 HTML 中高亮关键词：









        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\wiki\wikiUtils.js
          
changes: undefined
          
现在修改 `MarkdownEditor.jsx`，使用新的 `highlightHtml` 函数：





        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\wiki\MarkdownEditor.jsx
          
changes: undefined
          
让我重新编写一个更清晰的 MarkdownEditor.jsx，使用 `highlightHtml` 函数对已渲染的 HTML 做高亮：








        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\wiki\MarkdownEditor.jsx
          
现在我需要修改 `MarkdownEditor.jsx`，清理无用代码并使用正确的 `highlightHtml` 函数。同时需要更新 `index.jsx` 传递正确的函数：











        
            
toolName: Write
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\wiki\MarkdownEditor.jsx
          
changes: undefined
          
现在更新 `index.jsx`，移除不再需要的 `highlightTextSafe` import 和 prop：













        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\wiki\index.jsx
          
changes: undefined
          
现在更新 index.jsx 中的 MarkdownEditor 调用，移除多余的 prop：
















        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\wiki\index.jsx
          
changes: undefined
          
现在更新 todo 并修复第三个问题：tokenize 处理 HTML 标签：















        
            
toolName: todo_write
            
status: success
          
Todos updated: 4 items
          
现在修复问题3：`diffContent` 中的 `tokenize` 逻辑。核心思路是**先做 escapeHtml，再做 tokenize**，并且使用能正确识别 HTML 实体的正则：


















        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\wiki\wikiUtils.js
          
changes: undefined
          
现在更新 todo，补充单元测试：


















        
            
toolName: todo_write
            
status: success
          
Todos updated: 4 items
          
让我读取测试文件，找到合适的位置添加新测试：




















        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\wiki\wikiUtils.test.js
          

        
            
toolName: search_by_regex
            
status: success
          
query: import.*from.*wikiUtils
          

        
            
toolName: search_by_regex
            
status: success
          
query: describe\('Diff
          

        
            
toolName: search_by_regex
            
status: success
          
query: describe\('全文搜索
          
先更新导入语句，添加新函数：



















        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\wiki\wikiUtils.test.js
          
changes: undefined
          
现在让我读取 diffContent 测试部分和全文搜索部分，添加新的测试用例：





















        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\wiki\wikiUtils.test.js
          
现在在 Diff 对比部分添加 tokenizeLine 和更严格的 HTML 测试，然后在全文搜索部分添加 highlightHtml 测试：






















        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\wiki\wikiUtils.test.js
          
changes: undefined
          
现在让我查找全文搜索和高亮测试的末尾：
























        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\wiki\wikiUtils.test.js
          
现在在全文搜索部分末尾添加 `highlightHtml` 测试：



























        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\wiki\wikiUtils.test.js
          
changes: undefined
          
现在运行测试，看看所有修改是否正确：


























        
            
toolName: run_command
            
status: success
          
command: pnpm test -- src/pages/__tests__/wiki/wikiUtils.test.js undefined
          
有3个测试失败。前两个是测试用例的预期值错误（`escapeHtml` 会把 `&` 转义），第三个是因为中间词被标记为差异导致字符串不连续。让我修复测试用例：


























        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\wiki\wikiUtils.test.js
          
changes: undefined
          
现在修复第三个失败的测试：































        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\wiki\wikiUtils.test.js
          
changes: undefined
          
现在重新运行测试：

































        
            
toolName: run_command
            
status: success
          
command: pnpm test -- src/pages/__tests__/wiki/wikiUtils.test.js undefined
          
太好了！所有113个测试都通过了！现在运行 lint 检查确保代码质量：



































        
            
toolName: run_command
            
status: success
          
command: pnpm eslint "src/pages/wiki/index.jsx" "src/pages/wiki/wikiUtils.js" "src/pages/wiki/MarkdownEditor.jsx" "src/pages/wiki/SpaceSidebar.jsx" "src/pages/__tests__/wiki/wikiUtils.test.js" undefined
          
奇怪，lint 报告显示的导入问题，让我确认 MarkdownEditor.jsx 的实际内容：




































        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\wiki\MarkdownEditor.jsx
          
看起来文件没有正确更新。让我重新写入正确的内容：






































        
            
toolName: Write
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\wiki\MarkdownEditor.jsx
          
changes: undefined
          
现在再次运行 lint 检查：









































        
            
toolName: run_command
            
status: success
          
command: pnpm eslint "src/pages/wiki/index.jsx" "src/pages/wiki/wikiUtils.js" "src/pages/wiki/MarkdownEditor.jsx" "src/pages/wiki/SpaceSidebar.jsx" "src/pages/wiki/PageTree.jsx" "src/pages/wiki/VersionSidebar.jsx" "src/pages/wiki/SearchResults.jsx" "src/pages/wiki/TagCloud.jsx" "src/pages/wiki/MemberPanel.jsx" "src/pages/wiki/constants.js" "src/pages/__tests__/wiki/wikiUtils.test.js" undefined
          
完美！lint 检查全部通过。现在最后运行一次完整测试确保一切正常：










































        
            
toolName: run_command
            
status: success
          
command: pnpm test -- src/pages/__tests__/wiki/wikiUtils.test.js undefined
          
现在更新 todo 列表并提供总结：













































        
            
toolName: todo_write
            
status: success
          
Todos updated: 4 items
          
## ✅ 所有问题已修复完成！

以下是本次修复的详细说明：

---

### 🔧 问题 1：localStorage 自动保存防抖

**修改文件**：[index.jsx](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/wiki/index.jsx)

**修复前**：每次 data 变化都会立即触发 `saveData(data)`，用户每输入一个字符都会进行完整的 JSON 序列化和 localStorage 写入。

**修复后**：
- 新增 `debouncedSaveData` 函数，使用 `saveTimeoutRef` 管理防抖定时器
- `useEffect` 监听 data 变化时调用防抖函数，延迟 2 秒（`DEBOUNCE_DELAY`）后才真正写入
- 组件卸载时清理定时器

```javascript
const debouncedSaveData = useCallback((dataToSave) => {
  if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
  saveTimeoutRef.current = setTimeout(() => {
    saveData(dataToSave)
  }, DEBOUNCE_DELAY)
}, [])

useEffect(() => {
  debouncedSaveData(data)
}, [data, debouncedSaveData])
```

---

### 🔧 问题 2：搜索关键字高亮与滚动

**修改文件**：
- [index.jsx](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/wiki/index.jsx)
- [wikiUtils.js](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/wiki/wikiUtils.js)
- [MarkdownEditor.jsx](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/wiki/MarkdownEditor.jsx)

**修复前**：`searchKeyword={showSearchResults ? globalSearchQuery : ''}`，关闭搜索浮层后关键词立即清空，高亮消失。

**修复后**：
1. 新增独立的 `activeSearchKeyword` 状态，与搜索浮层解耦
2. 选择搜索结果时设置 `activeSearchKeyword`，浮层关闭后高亮依然保留
3. 新增 `highlightHtml(html, keyword)` 函数——先将 HTML 按标签分割，只在**文本节点**中插入高亮标签，不破坏 HTML 结构
4. 渲染流程：先 `markdownToHtml` 渲染 → 再 `highlightHtml` 高亮关键词 → 最后 `scrollIntoView` 滚动到首个匹配

```javascript
export function highlightHtml(html, keyword) {
  // 先拆分 HTML 标签与文本内容
  const parts = html.split(/(<[^>]+>)/g)
  for (let i = 0; i < parts.length; i++) {
    // 跳过 HTML 标签，只在文本节点中做高亮
    if (parts[i].startsWith('<') && parts[i].endsWith('>')) continue
    parts[i] = parts[i].replace(regex, '<span class="highlight">$&</span>')
  }
  return parts.join('')
}
```

---

### 🔧 问题 3：diffContent tokenize 处理 HTML 标签

**修改文件**：[wikiUtils.js](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/wiki/wikiUtils.js#L504-L603)

**修复前**：`tokenize = (line) => line.split(/(\s+|\b)/)` 使用 `\b` 单词边界分割，`<script>` 会被拆成 `['<', 'script', '>']`，再经 `escapeHtml` 转义后结构破坏。

**修复后**：
1. 抽出独立的 `tokenizeLine(line)` 导出函数
2. **先做 escapeHtml 转义**：`<script>` → `&lt;script&gt;`
3. **再做分词**，正则 `/&(?:[a-zA-Z]+|#\d+|#x[0-9a-fA-F]+);|\s+|[^\s&]+/g` 能正确识别：
   - HTML 命名实体（`&lt;`、`&gt;`、`&amp;`、`&quot;` 等）
   - 数字字符引用（`&#65;`）
   - 十六进制字符引用（`&#x41;`）
   - 空白字符序列
   - 普通文本序列
4. token 本身已是转义后的文本，diff 输出时**不再重复 escapeHtml**，避免双重转义

```javascript
export function tokenizeLine(line) {
  const escaped = escapeHtml(line)
  const tokens = escaped.match(/&(?:[a-zA-Z]+|#\d+|#x[0-9a-fA-F]+);|\s+|[^\s&]+/g)
  return tokens || []
}
```

---

### 🧪 问题 4：补充单元测试

**修改文件**：[wikiUtils.test.js](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/__tests__/wiki/wikiUtils.test.js)

新增 **18 个** 测试用例：

| 测试套件 | 新增用例 | 覆盖内容 |
|---------|---------|---------|
| `tokenizeLine` | 8 个 | 普通文本分词、HTML 实体作为完整 token、混合内容、空字符串、字符引用转义、特殊字符转义 |
| `diffContent` | 3 个 | 相同/不同 HTML 标签转义结构验证、标签内容变化时实体完整性 |
| `highlightHtml` | 7 个 | 文本节点高亮、不修改标签属性、空输入、大小写不敏感、特殊正则字符安全 |

---

### ✅ 验证结果

| 检查项 | 结果 |
|-------|------|
| **单元测试** | 113 个测试 **全部通过** ✅ |
| **Lint 检查** | wiki 相关 11 个文件 **零错误** ✅ |