让我先创建任务列表，然后逐一修复这些问题。

        
            
toolName: todo_write
            
status: success
          
Todos updated: 5 items
          
好的，让我开始修复。先标记第一个任务并开始分析代码。



        
            
toolName: todo_write
            
status: success
          
Todos updated: 5 items
          
让我再仔细查看一下相关文件，特别是提交历史的数据结构。我需要先修改提交历史结构以支持删除操作。





        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\git-browser\mockData.js
          
好的，我理解了问题。让我开始逐一修复。首先修改提交历史的数据结构，让它支持区分 added/modified/deleted，然后修改 `computeCommitFileSnapshot`。

让我先修改 `gitUtils.js`，因为这里有核心逻辑需要支持 DELETED 状态以及不同提交的内容变化：








        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\git-browser\gitUtils.js
          
现在我需要进行多个修改。让我重新设计并修改核心文件。首先修改 `gitUtils.js`，支持 DELETED 状态、不同提交的内容差异，以及改进 `generateOriginalContent`：









        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\git-browser\gitUtils.js
          
changes: undefined
          
现在让我修改 `buildFileTreeFromList` 和 `computeCommitFileSnapshot`。先看一下现有代码然后修改：










        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\git-browser\gitUtils.js
          
changes: undefined
          
好的，现在让我更新 `index.jsx`，把 commitHash 传入 `buildFileTreeFromList`：












        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\git-browser\index.jsx
          
changes: undefined
          
现在让我修改 `mockData.js`，在提交历史中增加 `deletedFiles` 字段，特别是 bugfix/header 分支中提到的移除 Footer 组件的提交：














        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\git-browser\mockData.js
          
changes: undefined
          
让我修改 `buildFileTreeFromList`，让 DELETED 文件也能显示在文件树中（但用红色状态标识），这样用户可以查看删除内容的 diff：















        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\git-browser\gitUtils.js
          
changes: undefined
          
现在让我更新任务进度并更新测试。首先标记已完成的任务：
















        
            
toolName: todo_write
            
status: success
          
Todos updated: 5 items
          
现在让我更新单元测试，覆盖新增的逻辑（`transformContentForCommit`、`DELETED` 状态支持、提交内容差异等）。先看现有的测试：

















        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\git-browser\gitUtils.test.js
          
现在让我更新测试文件，添加新函数的测试用例并扩展现有测试：


















        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\git-browser\gitUtils.test.js
          
changes: undefined
          
现在让我在测试文件末尾追加新增测试用例：






















        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\git-browser\gitUtils.test.js
          
changes: undefined
          
现在让我标记任务进度并运行测试：



































        
            
toolName: todo_write
            
status: success
          
Todos updated: 5 items
          

        
            
toolName: run_command
            
status: success
          
command: pnpm exec vitest run src/pages/__tests__/git-browser/ undefined
          
完美！所有 104 个测试通过。现在让我再运行 lint 检查确保代码规范：

























        
            
toolName: run_command
            
status: success
          
command: pnpm exec eslint src/pages/git-browser/ src/pages/__tests__/git-browser/ undefined
          
完美！测试和 lint 全部通过。让我标记所有任务完成：



























        
            
toolName: todo_write
            
status: success
          
Todos updated: 5 items
          
所有修复已完成！以下是本轮修复的详细内容：

## 修复总结

### 1. ✅ `computeCommitFileSnapshot` 支持 DELETED 状态
- 修改 [gitUtils.js](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/git-browser/gitUtils.js#L400-L448)，新增对 `deletedFiles` 字段的处理
- 目标提交中的 `deletedFiles` 标记为 `FILE_CHANGE_STATUS.DELETED`
- 前序提交的 `deletedFiles` 会从后续快照中彻底移除（模拟真实 Git 行为）
- 支持 `{ path, status }` 对象和纯字符串两种文件条目格式

### 2. ✅ 不同提交下文件内容有差异
- 新增 [transformContentForCommit](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/git-browser/gitUtils.js#L315-L325) 函数
- 基于 `文件路径::commitHash` 做确定性种子随机，对代码行做合理变换（变量名加前缀、插入代码行等）
- [buildFileTreeFromList](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/git-browser/gitUtils.js#L347-L398) 新增 `commitHash` 参数，ADDED 文件使用基础内容，MODIFIED 文件使用变换后内容
- [index.jsx](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/git-browser/index.jsx#L182-L185) 选中提交时传入对应 hash

### 3. ✅ `generateOriginalContent` 移除硬编码占位注释
- 重构为通用的 `applyLineTransformations` 辅助函数
- **mode = 'original'**（生成旧版本内容）：
  - 变量名加 `Old`/`old` 前缀或 `_old` 后缀
  - 确定性删除少量代码行（而非插入 "// removed line" 注释）
- **mode = 'modified'**（生成新版本内容）：
  - 变量名加 `New`/`new` 前缀或 `_v2` 后缀
  - 插入合理的代码行（如 `const processed = input.trim()`、`// TODO: handle edge case` 等）

### 4. ✅ `mockData.js` 补充删除提交示例
- `bugfix/header` 分支的 `fix9012` 提交增加 `deletedFiles: ['src/components/Footer.jsx']`，真实模拟"移除废弃 Footer 组件"的场景

### 5. ✅ 测试覆盖
- 新增测试从 93 个增至 **104 个全部通过**，覆盖：
  - `deletedFiles` 字段 → DELETED 状态标记
  - 前序提交删除文件后续快照不出现
  - `transformContentForCommit` 确定性、内容差异、空值处理
  - `generateOriginalContent` 不包含硬编码占位注释
  - `buildFileTreeFromList` DELETED 文件出现在树中、commitHash 内容差异
- **Lint 检查：0 errors, 0 warnings**