让我先分析这两个问题的代码实现，然后制定修复计划。
        
            
toolName: todo_write
            
status: success
          
Todos updated: 5 items
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\visitor-registration\index.jsx
          
我现在已经清楚地定位到了两个问题的代码位置。让我更新 todo 状态并开始修复：


        
            
toolName: todo_write
            
status: success
          
Todos updated: 5 items
          
现在开始修复问题1和问题2。我将：

**问题1**：删除每秒更新时间的定时器，将登记时间存为时间戳+显示字符串，并在提交时使用存储的时间戳。

**问题2**：引入独立的 `statusRefreshTick` 状态来触发重渲染，而不是通过修改 records 引用。



好的，我需要用 Edit 工具逐个修改。让我开始修复：

**修复1**：修改 `formData` 的初始化，添加 `_registerTimestamp` 并保存初始时间戳。

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\visitor-registration\index.jsx
          
changes: undefined
          
**修复2**：添加 `statusRefreshTick` 状态，修改 60 秒定时器逻辑。



        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\visitor-registration\index.jsx
          
changes: undefined
          
**修复3**：删除每秒更新登记时间的定时器。





        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\visitor-registration\index.jsx
          
changes: undefined
          
**修复4**：让 `sortedRecords` 依赖 `statusRefreshTick`。







        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\visitor-registration\index.jsx
          
changes: undefined
          
**修复5**：修改 `handleSubmit`，提交时使用 `_registerTimestamp`，重置时生成新时间戳。







        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\visitor-registration\index.jsx
          

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\visitor-registration\index.jsx
          
changes: undefined
          
现在让我更新 todo 并补充单元测试。为了让 `formData` 初始化和重置时的时间一致性更可测试，我先将其提取为纯函数。让我先检查 utils.js 看看有没有相关函数：




        
            
toolName: todo_write
            
status: success
          
Todos updated: 5 items
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\visitor-registration\utils.js
          
我在 utils.js 中新增两个纯函数，用于验证时间一致性逻辑，然后在 index.jsx 中使用它们。





        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\visitor-registration\utils.js
          
changes: undefined
          
现在更新 index.jsx 来使用新增的纯函数，并在 utils 导入中添加它们：








        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\visitor-registration\index.jsx
          
changes: undefined
          
现在用 createFormInitialState 替换初始化代码：










        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\visitor-registration\index.jsx
          
changes: undefined
          
现在用 createRegistrationRecord 和 createFormInitialState 替换 handleSubmit 中的逻辑：












        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\visitor-registration\index.jsx
          
changes: undefined
          
现在开始补充单元测试，为新增的函数和相关逻辑编写测试：









        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\visitor-registration\utils.test.js
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\visitor-registration\utils.test.js
          
现在添加新增函数的测试用例。先更新 import，然后在文件末尾添加测试：
















        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\visitor-registration\utils.test.js
          
changes: undefined
          
现在在文件末尾添加新的测试用例：

















        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\visitor-registration\utils.test.js
          
changes: undefined
          
现在运行测试验证所有修改：
























        
            
toolName: todo_write
            
status: success
          
Todos updated: 5 items
          

        
            
toolName: run_command
            
status: success
          
command: cd c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react ; pnpm test src/pages/__tests__/visitor-registration/ undefined
          
108 个测试用例全部通过！现在运行 lint 和构建验证：
























        
            
toolName: run_command
            
status: success
          
command: cd c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react ; pnpm eslint src/pages/visitor-registration/ src/pages/__tests__/visitor-registration/ undefined
          
有两个 lint 问题需要修复：1) `generateId` 导入未使用；2) useMemo 依赖警告。让我修复：

























        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\visitor-registration\index.jsx
          
changes: undefined
          
第二个问题更适合通过语义化改造来解决：改用 `now` 状态替代 `statusRefreshTick`，每60秒更新为真实时间戳，然后显式传递给计算函数使用：



























        
            
toolName: edit_file_search_replace
            
status: failed
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\visitor-registration\index.jsx
          
          

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\visitor-registration\index.jsx
          
changes: undefined
          
现在更新 useMemo 和相关调用，显式使用 `now`：



























        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\visitor-registration\index.jsx
          
changes: undefined
          
现在需要更新 utils.js 中的 `filterRecords` 函数，让它接受可选的 `now` 参数并传递给 `getVisitorStatus`：



























        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\visitor-registration\utils.js
          
changes: undefined
          
现在更新表格渲染中的 `getVisitorStatus` 调用，传入 `now`：





























        
            
toolName: search_by_regex
            
status: success
          
query: getVisitorStatus\(record\)
          

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\visitor-registration\index.jsx
          
changes: undefined
          
现在再次运行 lint 和测试：





























        
            
toolName: run_command
            
status: success
          
command: cd c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react ; pnpm eslint src/pages/visitor-registration/ src/pages/__tests__/visitor-registration/ undefined
          
lint 全部通过！现在运行测试并构建验证：































        
            
toolName: run_command
            
status: success
          
command: cd c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react ; pnpm test src/pages/__tests__/visitor-registration/ undefined
          
测试全部通过（108/108）！输出中显示的是其他文件（locker-management）的 lint 问题，与我们的任务无关。现在运行构建验证：

































        
            
toolName: run_command
            
status: success
          
command: cd c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react ; pnpm build undefined
          
构建成功！现在更新任务状态：

































        
            
toolName: todo_write
            
status: success
          
Todos updated: 5 items
          
所有问题已修复并验证通过！以下是修复总结：

---

## 🔧 问题修复总结

### 问题 1：登记时间每秒跳动 & 显示与提交不同步

**根本原因**：
- 存在一个 `setInterval` 每秒更新 `formData.registerTime`，导致表单显示的时间像实时时钟一样不断跳动
- `handleSubmit` 提交时使用 `Date.now()`，与屏幕上显示值可能相差数秒

**修复方案**：
1. **删除每秒跳动的定时器**（原 [index.jsx](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/visitor-registration/index.jsx) 第125-130行）
2. **新增纯函数** [createFormInitialState](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/visitor-registration/utils.js#L185-L196)（utils.js）：
   - 初始化时**一次性**获取当前时间戳
   - 同时存储 `_registerTimestamp`（原始毫秒值）和 `registerTime`（格式化显示字符串）
   - 确保两者严格一致
3. **新增纯函数** [createRegistrationRecord](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/visitor-registration/utils.js#L198-L211)（utils.js）：
   - 提交记录时严格使用 `formData._registerTimestamp`，不使用 `Date.now()`
   - 保证用户看到的登记时间和实际存入记录的时间完全相同
4. **提交后重置表单**时调用 `createFormInitialState()`，生成新的静态时间

### 问题 2：60秒定时器触发不必要的 localStorage 写入

**根本原因**：
- 原实现用 `setRecords((prev) => [...prev])` 每 60 秒强制创建新数组
- 触发依赖 `records` 的 `useEffect` 执行 `saveRecords`，产生无意义的 I/O

**修复方案**：
1. 引入独立的状态 `now`（初始化为 `Date.now()`，每60秒更新为当前时间戳）
2. 将 `now` 作为显式参数传递给以下依赖计算的函数：
   - `sortedRecords`：`sortRecords(records, now)`
   - `filteredRecords`：`filterRecords(..., now)` → 同步修改了 [filterRecords](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/visitor-registration/utils.js#L62-L94) 函数签名增加可选 `now` 参数
   - `overdueCount`：`getVisitorStatus(r, now)`
   - 表格渲染：`getVisitorStatus(record, now)`
3. `records` 引用不再被无意义地修改，`useEffect` 只会在**真正新增/修改记录**时才向 localStorage 写入

---

## 🧪 新增单元测试（共 10 个用例）

在 [utils.test.js](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/__tests__/visitor-registration/utils.test.js) 中新增：

**`createFormInitialState` 测试组（4个）**：
- 创建默认表单初始状态
- 使用指定时间戳创建初始状态
- 格式化的显示时间与时间戳完全一致
- 所有字符串字段初始化为空字符串

**`createRegistrationRecord` 测试组（6个）**：
- 使用表单中的时间戳创建记录（确保一致性）
- 登记时间严格使用表单中保存的时间戳（不使用 Date.now()）
- 缺少 `_registerTimestamp` 时回退到 Date.now()
- 默认使用 generateId 生成 id
- 被访人对象完整保存在记录中
- 表单字段有前后空格时进行 trim 处理

---

## ✅ 最终验证结果

| 验证项 | 结果 |
|--------|------|
| 单元测试 | **108 / 108 全部通过** ✅ |
| ESLint | **0 errors, 0 warnings** ✅ |
| 项目构建 | **构建成功** ✅ |