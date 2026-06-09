让我逐一修复这些问题。首先创建任务列表：







        
            
toolName: todo_write
            
status: success
          
Todos updated: 6 items
          
让我先读取相关文件，确认问题位置：








        
            
toolName: todo_write
            
status: success
          
Todos updated: 6 items
          

        
            
toolName: view_files
            
status: success
          
            
filePath: /Users/vincent/GoletaLab/solocoder-react/src/pages/crm/index.jsx
          

        
            
toolName: view_files
            
status: success
          
            
filePath: /Users/vincent/GoletaLab/solocoder-react/src/pages/crm/CustomerTable.jsx
          

        
            
toolName: view_files
            
status: success
          
            
filePath: /Users/vincent/GoletaLab/solocoder-react/src/pages/crm/utils.js
          

        
            
toolName: search_by_regex
            
status: success
          
query: export function formatDate
          

        
            
toolName: view_files
            
status: success
          
            
filePath: /Users/vincent/GoletaLab/solocoder-react/src/pages/crm/utils.js
          
现在逐个修复这三个问题：

**问题 1：** 修复 index.jsx 中的 `result.products` 无效引用：










        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: /Users/vincent/GoletaLab/solocoder-react/src/pages/crm/index.jsx
          
changes: undefined
          
**问题 2：** 修复 CustomerTable.jsx 中正常数据状态下归属人列缺少 sortable 类和排序事件：















        
            
toolName: todo_write
            
status: success
          
Todos updated: 6 items
          

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: /Users/vincent/GoletaLab/solocoder-react/src/pages/crm/CustomerTable.jsx
          
changes: undefined
          
**问题 3：** 修复 utils.js 中 formatDate 和 formatDateOnly 的边界问题：


















        
            
toolName: todo_write
            
status: success
          
Todos updated: 6 items
          

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: /Users/vincent/GoletaLab/solocoder-react/src/pages/crm/utils.js
          
changes: undefined
          
现在检查单元测试，看看 formatDate 相关的测试是否需要调整：





















        
            
toolName: todo_write
            
status: success
          
Todos updated: 6 items
          

        
            
toolName: search_by_regex
            
status: success
          
query: formatDate|formatDateOnly
          

        
            
toolName: view_files
            
status: success
          
            
filePath: /Users/vincent/GoletaLab/solocoder-react/src/pages/__tests__/crm/crmUtils.test.js
          
需要修改 formatDate 测试，让 timestamp=0 时也正常格式化，并补全 formatDateOnly 测试：

























        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: /Users/vincent/GoletaLab/solocoder-react/src/pages/__tests__/crm/crmUtils.test.js
          
changes: undefined
          
现在运行 CRM 测试确认所有修复正确：
































        
            
toolName: run_command
            
status: success
          
command: pnpm test -- src/pages/__tests__/crm/crmUtils.test.js 2>&1 | tail -30 undefined
          
失败的是 exam 和 tetris 模块已有的问题，让我单独确认 CRM 的测试：








































        
            
toolName: run_command
            
status: success
          
command: pnpm test -- src/pages/__tests__/crm/crmUtils.test.js 2>&1 | grep -E "(crm|PASS|FAIL|passed|failed|Test Files)" undefined
          

        
            
toolName: run_command
            
status: success
          
command: pnpm vitest run src/pages/__tests__/crm/crmUtils.test.js 2>&1 | tail -15 undefined
          
CRM 的 122 个测试全部通过！现在运行 lint 检查：


























        
            
toolName: todo_write
            
status: success
          
Todos updated: 6 items
          

        
            
toolName: run_command
            
status: success
          
command: pnpm eslint src/pages/crm/ 2>&1 undefined
          
ESLint 检查通过！现在启动 dev server 验证页面可正常访问：

























        
            
toolName: todo_write
            
status: success
          
Todos updated: 6 items
          

        
            
toolName: run_command
            
status: running
          
command: pnpm run dev 2>&1 undefined
          
开发服务器启动成功！现在打开预览：




























        
            
toolName: open_preview
            
status: success
          
预览
          
这个报错来自 `social-feed` 模块（另一个独立功能），与 CRM 模块无关。让我确认 CRM 相关的编译状态并标记完成：






























        
            
toolName: todo_write
            
status: success
          
Todos updated: 6 items
          
所有 4 个问题已全部修复完成！以下是修改明细：

## 修复内容

### 1. 修复 `result.products` 无效引用
**文件**: [index.jsx](file:///Users/vincent/GoletaLab/solocoder-react/src/pages/crm/index.jsx#L196-L203)

原代码 `result.products || result.customers` 中 `products` 是不存在的属性。改为直接使用 `result.customers`。

---

### 2. 修复归属人列表头排序行为不一致
**文件**: [CustomerTable.jsx](file:///Users/vincent/GoletaLab/solocoder-react/src/pages/crm/CustomerTable.jsx#L102-L104)

正常数据状态下归属人列缺少 `sortable` 类和 `onClick` 排序事件，与空状态的表头行为不一致。已补全：

```jsx
<th className="col-owner sortable" onClick={() => handleSort('ownerId')}>
  归属人 {renderSortIcon('ownerId')}
</th>
```

---

### 3. 修复 `formatDate` / `formatDateOnly` 边界问题
**文件**: [utils.js](file:///Users/vincent/GoletaLab/solocoder-react/src/pages/crm/utils.js#L377-L395)

原判断条件 `!timestamp` 在 JavaScript 中对 `0` 返回 `true`，导致 Unix 纪元时间 `formatDate(0)` 错误返回空字符串。改为使用 `timestamp == null` 只过滤 `null` 和 `undefined`：

```js
if (timestamp == null) return ''
```

---

### 4. 更新单元测试
**文件**: [crmUtils.test.js](file:///Users/vincent/GoletaLab/solocoder-react/src/pages/__tests__/crm/crmUtils.test.js#L838-L876)

- 移除 `formatDate(0)` 期望返回空字符串的错误断言
- 新增 `timestamp=0（Unix纪元）正常格式化` 测试用例（两个函数各一个）
- 为 `formatDateOnly` 补充 `undefined` 空值测试

## 验证结果

| 检查项 | 结果 |
|--------|------|
| CRM ESLint (`pnpm eslint src/pages/crm/`) | ✅ **0 错误** |
| CRM 单元测试 (`122` 个用例) | ✅ **全部通过** |
| 开发服务器 (`http://localhost:5174/`) | ✅ **正常启动** |

> 浏览器中出现的 `social-feed` 模块报错属于其他独立模块，与 CRM 功能无关。你可以访问 `http://localhost:5174/#/crm` 查看 CRM 页面。