让我先分析并修复这些问题。

        
            
toolName: todo_write
            
status: success
          
Todos updated: 7 items
          
让我先读取需要修改的文件。

        
            
toolName: todo_write
            
status: success
          
Todos updated: 7 items
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\password-manager\storage.js
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\password-manager\index.jsx
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\password-manager\utils.js
          
好，我现在清楚地了解了所有需要修复的问题。让我逐个修复。

**修复问题 1：saveEntries/loadEntries 密码 Base64 编码**


        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\password-manager\storage.js
          
changes: undefined
          

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\password-manager\storage.js
          
changes: undefined
          

        
            
toolName: todo_write
            
status: success
          
Todos updated: 7 items
          
**修复问题 2：EntryCard 中显示密码和复制密码共用 timerRef**

我需要分离 `timerRef` 为 `showPwdTimerRef` 和 `copyPwdTimerRef`。同时还需修复问题 4（✓ 改为"已复制"文字）。

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\password-manager\index.jsx
          
changes: undefined
          
**修复问题 4：复制按钮显示"已复制"文字而非 ✓ 图标**



        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\password-manager\index.jsx
          
changes: undefined
          

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\password-manager\index.jsx
          
changes: undefined
          

        
            
toolName: todo_write
            
status: success
          
Todos updated: 7 items
          
**修复问题 3：导出数据前显示安全警告确认**

我需要添加一个单独的 `showExportWarning` 状态，以及将 ConfirmDialog 改为可区分"普通确认"和"导出警告确认"——导出警告应该有"确认导出"按钮而不是"确认"红色按钮。最简单的方式是让 ConfirmDialog 支持自定义按钮标签。


        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\password-manager\index.jsx
          
changes: undefined
          
现在修改 handleExport 弹出确认，以及修改 confirmDialog 的结构来支持自定义 confirmLabel/confirmDanger。我需要把 `confirmDialog` 扩展成包含 `label` 和 `danger` 字段的对象。




        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\password-manager\index.jsx
          
changes: undefined
          
现在更新所有的 `setConfirmDialog` 调用，以及底部 confirmDialog 的渲染逻辑，以传递 `confirmLabel` 和 `confirmDanger`。先找到所有的 `setConfirmDialog` 调用：




        
            
toolName: search_by_regex
            
status: success
          
query: setConfirmDialog
          
我需要在多处 `setConfirmDialog` 调用中添加默认的 `confirmLabel` 和 `confirmDanger`。让我修复它们：

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\password-manager\index.jsx
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\password-manager\index.jsx
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\password-manager\index.jsx
          
现在我来更新最后的 confirmDialog 渲染，并更新上述调用点以传递正确的参数。最简单的方式：对于信息提示类对话框（非危险操作），使用 `confirmDanger: false` 和 `confirmLabel: '确定'`；对于信息类其实是默认的 `确认` 红色按钮也可以，但为了语义正确，让我把信息类的改成 `confirmDanger: false, confirmLabel: '确定'`：


        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\password-manager\index.jsx
          
changes: undefined
          

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\password-manager\index.jsx
          
changes: undefined
          

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\password-manager\index.jsx
          
changes: undefined
          
现在更新底部 confirmDialog 的渲染，读取 `confirmLabel` 和 `confirmDanger`：



        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\password-manager\index.jsx
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\password-manager\index.jsx
          

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\password-manager\index.jsx
          
changes: undefined
          

        
            
toolName: todo_write
            
status: success
          
Todos updated: 7 items
          
**修复问题 5：formatTimestamp 中 `!ts` 错误处理时间戳 0**

时间戳 0 是合法的（对应 1970-01-01 00:00:00 UTC），但 `!0` 为 true，会被当作无效值。




        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\password-manager\utils.js
          
changes: undefined
          

        
            
toolName: todo_write
            
status: success
          
Todos updated: 7 items
          
现在我来创建新增/修改的纯 JS 逻辑添加测试。需要测试的内容：

1. 测试 formatTimestamp - 新增对时间戳 0 处理
2. 测试 saveEntries/loadEntries 存储时的密码编码（需要 mock localStorage）

让我先读取现有测试，再补充新测试：


        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\password-manager\utils.test.js
          
现在我需要添加测试。为了避免编辑大文件，我会创建一个单独的测试文件来存放新增的测试：

        
            
toolName: Write
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\password-manager\storage.test.js
          
changes: undefined
          
现在我需要修复原有的 `formatTimestamp` 测试——原测试中 `formatTimestamp(0)` 期望返回 `''`，这是错误的，应该修改：




        
            
toolName: search_by_regex
            
status: success
          
query: formatTimestamp
          
我需要修复原有的 formatTimestamp 测试，因为时间戳 0 现在应该被视为有效值：





        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\password-manager\utils.test.js
          
changes: undefined
          

        
            
toolName: todo_write
            
status: success
          
Todos updated: 7 items
          
现在运行 lint 和测试：


        
            
toolName: run_command
            
status: success
          
command: cd c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react; npx eslint src/pages/password-manager/ undefined
          
Lint 零错误。现在运行所有测试：

        
            
toolName: run_command
            
status: success
          
command: cd c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react; npx vitest --run src/pages/__tests__/password-manager/ undefined
          
测试环境中没有 `localStorage`。我需要使用一个模拟（mock）实现。让我在测试文件中创建一个简单的 localStorage 模拟，并将其挂载到全局作用域：



        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\password-manager\storage.test.js
          
changes: undefined
          
现在我需要删除重复的 beforeEach/afterEach 块（在 describe 块中仍然有它们）：




        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\password-manager\storage.test.js
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\password-manager\storage.test.js
          
这些 describe 块中的 beforeEach/afterEach 是多余的但不会出错——全局的 beforeEach 已经创建了 mock localStorage，而这些每个 describe 内的 beforeEach 只是调用 `localStorage.clear()`。让我保留它们（它们有助于隔离测试）。实际上它们是无害的——因为全局的 beforeEach 已经在运行时创建了 mock，所以这里再 clear 没问题。

现在再运行测试：





        
            
toolName: run_command
            
status: success
          
command: cd c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react; npx vitest --run src/pages/__tests__/password-manager/ undefined
          
所有 95 个测试全部通过。让我也运行一下 diagnostics 确保没有问题：




        
            
toolName: GetDiagnostics
            
status: success
          
          

        
            
toolName: GetDiagnostics
            
status: success
          
          

        
            
toolName: GetDiagnostics
            
status: success
          
          

        
            
toolName: todo_write
            
status: success
          
Todos updated: 7 items
          
所有 5 个问题已修复完成，所有测试通过。以下是修复内容的总结：

## 修复内容

### 问题 1：localStorage 密码明文存储
**文件**：[storage.js](file:///C:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/password-manager/storage.js#L28-L37)

- `saveEntries` 写入前对每条记录的 `password` 字段进行 Base64 编码
- `loadEntries` 读取后对每条记录的 `password` 字段进行 Base64 解码
- 同时导入了缺失的 `decodeBase64`

### 问题 2：定时器 ref 共用冲突
**文件**：[index.jsx](file:///C:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/password-manager/index.jsx#L416-L445)

- 将 `timerRef` 拆分为 3 个独立的 ref：
  - `showPwdTimerRef` — 显示密码3秒自动恢复
  - `copyPwdTimerRef` — 复制密码2秒反馈
  - `acctTimerRef` — 复制账号2秒反馈
- 清理函数中分别清理各自的定时器

### 问题 3：导出前缺少安全警告确认
**文件**：[index.jsx](file:///C:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/password-manager/index.jsx#L402-L690)

- 扩展 `ConfirmDialog` 支持 `confirmLabel` 和 `confirmDanger` 参数
- `handleExport` 不再直接下载，而是先弹出确认对话框：
  > ⚠️ 数据仅经 Base64 编码，非真正加密。请妥善保管导出文件，避免泄露。确认导出？
- 用户点击「确认导出」后才执行实际下载
- 更新了所有其他 `setConfirmDialog` 调用点以传递正确的参数

### 问题 4：复制按钮显示 ✓ 图标而非"已复制"文字
**文件**：[index.jsx](file:///C:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/password-manager/index.jsx#L463-L489)

- 账号复制按钮和密码复制按钮在 copied 状态下改为显示 "已复制" 文字

### 问题 5：formatTimestamp 将 0 视为无效值
**文件**：[utils.js](file:///C:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/password-manager/utils.js#L170-L175)

- 将 `if (!ts)` 改为显式检查：`ts === null || ts === undefined || typeof ts !== 'number' || Number.isNaN(ts)`
- 时间戳 0（对应 1970-01-01 UTC）现在会被正确格式化为日期字符串

## 新增单元测试

**文件**：[storage.test.js](file:///C:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/__tests__/password-manager/storage.test.js)

- 新增 16 个测试用例，覆盖：
  - `formatTimestamp` 对 0/null/undefined/NaN/非数字类型的处理
  - `saveEntries` 存储时密码自动 Base64 编码
  - `loadEntries` 读取时密码自动 Base64 解码
  - 空列表、缺失值、损坏数据、空密码、非密码字段保留等边界场景
  - `saveMasterPassword` / `loadMasterPassword` 的 Base64 编码行为
- 包含完整的 localStorage mock 实现

**已更新**：[utils.test.js](file:///C:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/__tests__/password-manager/utils.test.js#L439-L466) 中原先错误的 `formatTimestamp(0)` 断言。

## 验证结果

- ✅ ESLint 零错误零警告
- ✅ VS Code Diagnostics 全部为 0
- ✅ 95 个单元测试全部通过（原 77 + 新增 16 + 修改原有 2）