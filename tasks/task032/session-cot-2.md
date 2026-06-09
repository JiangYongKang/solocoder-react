我来逐一修复这些问题。首先创建任务计划。







        
            
toolName: todo_write
            
status: success
          
Todos updated: 8 items
          
让我先读取当前的 mockData.js 和 gitUtils.js 来了解现有结构。









        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\git-browser\mockData.js
          
让我同时读取 text-diff/diffUtils.js 和当前的 gitUtils.js，然后开始修复。










        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\text-diff\diffUtils.js
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\git-browser\gitUtils.js
          
现在我开始修复这些问题。首先创建 git-browser 内部的 diffUtils，然后修复 generateOriginalContent，重写 mockData.js，最后更新 index.jsx 和测试。













        
            
toolName: Write
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\git-browser\diffUtils.js
          
changes: undefined
          
现在修复 generateOriginalContent，改为确定性生成（基于文件路径和内容的哈希，不使用 Math.random）。
















        
            
toolName: todo_write
            
status: success
          
Todos updated: 8 items
          
现在修改 gitUtils.js，修复 generateOriginalContent 并添加确定性生成的工具函数，以及添加从提交历史生成文件快照的函数。


















        
            
toolName: edit_file_search_replace
            
status: failed
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\git-browser\gitUtils.js
          
          
让我用 Write 工具重写整个 gitUtils.js 文件，包含所有修复后的函数。


















        
            
toolName: Write
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\git-browser\gitUtils.js
          
changes: undefined
          
现在重写 mockData.js，补充更多层级目录和文件，确保每分支 20+ 文件，并提供统一的基础文件列表用于提交快照生成。





















        
            
toolName: Write
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\git-browser\mockData.js
          
changes: undefined
          
现在更新 index.jsx，修复对 text-diff 的引用和实现点击提交切换状态功能。先读取当前文件。


















        
            
toolName: todo_write
            
status: success
          
Todos updated: 8 items
          
现在重写整个 index.jsx 文件，修复 import 和实现提交切换逻辑。





















        
            
toolName: Write
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\git-browser\index.jsx
          
changes: undefined
          

        
            
toolName: CompactFake
            
status: success
          
          
让我先查看当前项目状态，了解已完成的工作和待补充的测试。
        
            
toolName: view_folder
            
status: success
          
c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\git-browser
          

        
            
toolName: view_folder
            
status: success
          
c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\git-browser
          
让我查看现有的测试文件和核心实现文件：

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\git-browser\gitUtils.test.js
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\git-browser\gitUtils.js
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\git-browser\diffUtils.js
          
好的，我现在看到了当前状态。已有的测试覆盖了 gitUtils 中的大部分函数，但缺少新增的 `simpleHash`, `seededRandom`, `buildFileTreeFromList`, `computeCommitFileSnapshot` 测试，同时还缺少 `diffUtils.js` 的测试。让我先更新任务进度，然后补充测试。



        
            
toolName: todo_write
            
status: success
          
Todos updated: 8 items
          
现在让我补充测试。首先更新已有的 `gitUtils.test.js`，添加对新增函数的测试，然后创建 `diffUtils.test.js`。




        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\git-browser\gitUtils.test.js
          
changes: undefined
          
现在在文件末尾追加新增函数的测试：






        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\git-browser\gitUtils.test.js
          
changes: undefined
          
现在创建 `diffUtils.test.js` 来测试 diff 相关的函数：






        
            
toolName: Write
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\git-browser\diffUtils.test.js
          
changes: undefined
          
测试文件已创建。现在让我检查一下 `index.jsx` 确保实现正确，然后运行测试。首先让我查看 `index.jsx` 和 `mockData.js`：






        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\git-browser\index.jsx
          
让我再查看一下 `mockData.js` 确保文件数量充足：









        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\git-browser\mockData.js
          
`mockData.js` 中有 30 个以上的文件，满足要求。现在让我更新 todo 并运行测试：









        
            
toolName: todo_write
            
status: success
          
Todos updated: 8 items
          

        
            
toolName: run_command
            
status: success
          
command: pnpm run test --run undefined
          
测试命令已经在 package.json 中包含了 `--run`，让我重新运行：






        
            
toolName: run_command
            
status: success
          
command: pnpm run test undefined
          
大部分测试都通过了！失败的 28 个测试来自其他模块（qrcode、regex-tester、whiteboard），不是我们的 git-browser 相关的。让我单独运行 git-browser 的测试来确认：










        
            
toolName: run_command
            
status: success
          
command: pnpm exec vitest run src/pages/__tests__/git-browser/ undefined
          
太棒了！Git Browser 相关的 **93 个测试全部通过**！现在让我运行 lint 检查：









        
            
toolName: todo_write
            
status: success
          
Todos updated: 8 items
          
让我先查看 package.json 中的 lint 命令：











        
            
toolName: search_by_regex
            
status: success
          
query: "lint"
          

        
            
toolName: run_command
            
status: success
          
command: pnpm run lint -- src/pages/git-browser/ src/pages/__tests__/git-browser/ undefined
          
这些 lint 错误大多来自其他模块。让我单独检查 git-browser 相关的文件：












        
            
toolName: run_command
            
status: success
          
command: pnpm exec eslint src/pages/git-browser/ src/pages/__tests__/git-browser/ undefined
          
有 6 个 lint 错误，都是 `mockData.js` 中正则表达式的不必要转义字符。让我查看并修复：















        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\git-browser\mockData.js
          
让我用 Grep 看看实际的原始内容：














        
            
toolName: search_by_regex
            
status: success
          
query: \\\\s|\\\\d|\\\\\\.
          

        
            
toolName: search_by_regex
            
status: success
          
query: isValidEmail|isValidPhone|isValidPassword
          
问题在于这些正则表达式在模板字符串内部，`\s`、`\d`、`\.` 被视为不必要的转义。我需要改成双反斜杠，这样解析后的内容才是正确的正则表达式：















        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\git-browser\mockData.js
          
changes: undefined
          
现在让我重新运行 lint 检查：















        
            
toolName: run_command
            
status: success
          
command: pnpm exec eslint src/pages/git-browser/ src/pages/__tests__/git-browser/ undefined
          
完美！Lint 检查全部通过了。让我再运行一次测试确保一切正常，然后标记任务完成：

















        
            
toolName: run_command
            
status: success
          
command: pnpm exec vitest run src/pages/__tests__/git-browser/ undefined
          
太好了！所有任务都已完成。让我更新 todo 状态：

















        
            
toolName: todo_write
            
status: success
          
Todos updated: 8 items
          
所有 Git 仓库浏览器页面的修复工作已完成！以下是修复的详细内容：

## 修复总结

### 1. ✅ mockData.js 文件数量扩充
- 文件数量从不足 20 个扩展到 **30+ 个文件**
- 覆盖多层级目录：`src/`、`src/components/`、`src/pages/`、`src/utils/`、`src/hooks/`、`src/styles/`、`tests/`、`config/`、`public/` 等
- 每个分支配置 8 条提交历史记录，每条提交包含多个文件变更

### 2. ✅ 点击提交切换文件树和内容区
- 在 [gitUtils.js](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/git-browser/gitUtils.js) 中新增：
  - `buildFileTreeFromList(fileList, fileContents)` - 从扁平列表构建文件树
  - `computeCommitFileSnapshot(commitHistory, targetCommitHash, baseFileList)` - 根据提交历史计算该提交时的文件快照
- 在 [index.jsx](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/git-browser/index.jsx) 中通过 `useMemo` 计算 `commitFileList` 和 `commitFileTree`，选中提交时自动覆盖默认视图

### 3. ✅ diff 逻辑迁移到 git-browser 包内部
- 新建 [diffUtils.js](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/git-browser/diffUtils.js)，包含：
  - `DIFF_TYPE` 常量、`splitLines`、`computeLCSMatrix`、`computeLineDiff`、`mergeModifiedLines`、`computeCharDiff`、`buildSideBySideDiff`、`getDiffStats`
- [index.jsx](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/git-browser/index.jsx) 的 import 路径改为 `./diffUtils`，不再跨包引用

### 4. ✅ generateOriginalContent 改为确定性生成
- 新增 `simpleHash(str)` 字符串哈希函数
- 新增 `seededRandom(seed)` 确定性伪随机数生成器（使用乘法同余法）
- `generateOriginalContent` 对同一文件路径每次返回相同内容，对不同路径返回不同内容

### 5. ✅ 补充单元测试
- [gitUtils.test.js](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/__tests__/git-browser/gitUtils.test.js) 从 49 个测试用例扩展至约 70+ 个，新增：
  - `simpleHash`、`seededRandom`、`buildFileTreeFromList`、`computeCommitFileSnapshot`、`generateOriginalContent` 确定性验证
- 新建 [diffUtils.test.js](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/__tests__/git-browser/diffUtils.test.js)，覆盖 diffUtils 所有导出函数

### 6. ✅ 测试和 Lint 通过
- **Git Browser 测试：93 passed**（2 个测试文件全部通过）
- **Lint 检查：0 errors, 0 warnings**（仅针对 git-browser 目录）