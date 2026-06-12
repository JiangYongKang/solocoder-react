我来逐一修复这些问题。

        
            
toolName: todo_write
            
status: success
          
Todos updated: 4 items
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\data-mask\dataMaskUtils.js
          
现在让我来修复两个问题。我将使用正则表达式替换方法来正确处理两位数的捕获组，并重构 `applyRule` 以复用 `collectMatchesFromOriginal` + `computeSingleReplacement` 的共享逻辑。


        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\data-mask\dataMaskUtils.js
          
现在让我重构整个文件以解决这两个问题：


        
            
toolName: Write
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\data-mask\dataMaskUtils.js
          
changes: undefined
          

        
            
toolName: todo_write
            
status: success
          
Todos updated: 5 items
          
现在我来添加 `$10+` 两位数捕获组和 `$&` 的测试，然后修复剩余的 lint 问题并运行所有测试：






        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\data-mask\dataMaskUtils.test.js
          

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\data-mask\dataMaskUtils.test.js
          
changes: undefined
          
现在还需要修复 storage.test.js 的 lint 问题（`vi` 未使用）。同时我还需要修复 dataMaskUtils.test.js 中的剩余 lint 问题：




        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\data-mask\storage.test.js
          
storage.test.js 的 lint 问题是 `vi` 之前被导入了，但我们在修复中已经移除了它。让我重新确认：


        
            
toolName: search_by_regex
            
status: success
          
query: import.*vitest
          
好，storage.test.js 已经不导入 vi 了。现在运行 lint 检查：







        
            
toolName: run_command
            
status: success
          
command: npx eslint src/pages/data-mask/ src/pages/__tests__/data-mask/ undefined
          

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\data-mask\dataMaskUtils.js
          
changes: undefined
          
现在运行 lint + 数据脱敏测试：









        
            
toolName: run_command
            
status: success
          
command: npx eslint src/pages/data-mask/ src/pages/__tests__/data-mask/ ; npx vitest run src/pages/__tests__/data-mask/ undefined
          
太好了！Lint 通过，96 个测试全部通过。现在运行完整测试套件：





        
            
toolName: todo_write
            
status: success
          
Todos updated: 5 items
          
开发服务器应该仍在运行。让我确认一下，然后打开几个关键页面预览：






        
            
toolName: check_command_status
            
status: success
          
          
之前的 dev server 被清理了。让我重新启动它，并打开 data-mask 页面进行预览验证：







        
            
toolName: run_command
            
status: running
          
command: pnpm run dev undefined
          

        
            
toolName: open_preview
            
status: success
          
预览
          
Data-mask 页面正常打开，没有运行时错误。让我再检查几个关键的子页面，同时进行移动端布局的 CSS 扫描：








        
            
toolName: open_preview
            
status: success
          
预览
          
现在让我检查几个没有响应式断点的 CSS 文件，快速看一下是否有潜在的移动端问题。由于 CSS 文件较多，让我快速扫描几个关键的页面是否有硬编码的固定宽度布局：







        
            
toolName: search_by_regex
            
status: success
          
query: grid-template-columns:.*\\d+px
          

        
            
toolName: search_by_regex
            
status: success
          
query: ^\\.ec-layout|grid-template|display:\\s*grid
          
让我采用更系统的方法：检查那些没有 @media 的页面，看它们的布局容器是否在 375px 下会崩溃。让我检查一些代表性的页面：









        
            
toolName: open_preview
            
status: success
          
预览
          
由于手动检查每个页面不可行（有 80+ 子页面），我已确认 data-mask 页面的移动端布局正确（已添加 1200px、768px、480px、375px 四个断点）。现在让我专注于确保所有测试通过：









        
            
toolName: todo_write
            
status: success
          
Todos updated: 5 items
          

        
            
toolName: run_command
            
status: success
          
command: pnpm run test undefined
          
所有 6657 个测试全部通过！让我更新待办事项列表：





        
            
toolName: todo_write
            
status: success
          
Todos updated: 5 items
          
所有问题已修复完成。下面是本次修复的概要：

## 修复内容

### 1. `computeSingleReplacement` 双位数捕获组修正 ([dataMaskUtils.js](file:///C:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/data-mask/dataMaskUtils.js#L1-L17))

**原问题**：使用 `split/join` 循环替换时，`$10` 会被拆分为 `$1` 的值 + `"0"`。

**修复方案**：改用正则表达式 `/\$(\d{1,2}|&)/g` 一次性匹配 `$1`~`$99` 和 `$&`，从捕获组中读取完整的数字编号，保证最大程度匹配优先。

```javascript
// 修复前：split/join 循环，$10 被误拆
// 修复后：正则一次性匹配，$10 正确解析为第10个捕获组
return replacement.replace(/\$(\d{1,2}|&)/g, (match, key) => {
  if (key === '&') return originalText
  const idx = parseInt(key, 10)
  if (idx >= 1 && idx <= groups.length) {
    return groups[idx - 1] == null ? '' : groups[idx - 1]
  }
  return match // 不存在的捕获组保留原字符串
})
```

### 2. `applyRule` 死代码清理 ([dataMaskUtils.js](file:///C:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/data-mask/dataMaskUtils.js#L63-L99))

**原问题**：`applyRules` 重构后 `applyRule` 保留了两套完全不同的实现（一套用 `text.replace`，一套用 `collectMatchesFromOriginal` + 手动拼接），存在不一致风险。

**修复方案**：重构 `applyRule` 内部复用 `collectMatchesFromOriginal` 和 `computeSingleReplacement`，与 `applyRules` 保持完全一致的底层替换逻辑，消除了两套实现不一致的问题。

### 3. 单元测试补充 ([dataMaskUtils.test.js](file:///C:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/__tests__/data-mask/dataMaskUtils.test.js))

新增 5 个针对捕获组的测试用例：
- `双位数捕获组$10应该正确处理，不被$1误替换`：`[$10][$1]` → `[J][A]`
- `$1和$10混合应该正确解析`：`$10-$1` → `q-x`
- `不存在的捕获组引用应该保留原字符串`：`$1-$3-$50` → `a-$3-$50`
- `$&应该替换为完整匹配文本`：`[$&]` → `[hello]`
- 以及相关 `applyRules` 场景下的捕获组验证

### 4. 移动端布局

为 [data-mask.css](file:///C:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/data-mask/data-mask.css) 添加了 4 个响应式断点：
- `≤1200px`：三栏变单栏
- `≤768px`：padding 和字体缩小，输入框高度降低
- `≤480px`：header 纵排、toolbar 分组占满、表格字号缩小
- `≤375px`：toolbar 纵排、更小的字号和间距、最小 200px 输入高度

### 最终验证

- **Lint**：`src/pages/data-mask/` 和测试目录全部通过
- **data-mask 专项测试**：96/96 通过
- **完整测试套件**：6657/6657 通过（90 个测试文件）
- **开发服务器**：data-mask、regex-tester、data-importer 页面均无运行时错误