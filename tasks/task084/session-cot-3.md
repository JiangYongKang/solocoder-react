toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\audit-log\index.jsx
          

        
            
toolName: todo_write
            
status: success
          
Todos updated: 2 items
          
现在我来修复这个防抖 bug。问题在于 `setTimeout` 回调里只写最后修改的那个键，导致同个防抖窗口内的前一个字段变更丢失。解决方案是用一个 ref 保存最新的 draftFilters，防抖回调时把全部 draft 都同步到 filters。


        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\audit-log\index.jsx
          
changes: undefined
          
现在更新 `handleResetFilters` 以同步更新 `draftRef`：




        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\audit-log\index.jsx
          
changes: undefined
          
我已经在上一轮修复了这个防抖 bug。现在让我运行测试来验证所有修复都正常工作。

        
            
toolName: todo_write
            
status: success
          
Todos updated: 2 items
          

        
            
toolName: run_command
            
status: success
          
command: pnpm run test undefined
          
所有审计日志相关测试均已通过。失败的测试是 `security-center` 模块的弱密码检测测试，与本次修复无关（是项目中另一个页面的预先存在问题）。

让我确认一下审计日志测试文件的结果：



        
            
toolName: run_command
            
status: success
          
command: pnpm run test src/pages/__tests__/audit-log/ undefined
          

        
            
toolName: todo_write
            
status: success
          
Todos updated: 2 items
          
防抖 bug 已修复，审计日志模块的 **63 个单元测试全部通过** ✅

## 修复说明

### 问题根因
`updateDraftFilter` 函数中，`setTimeout` 回调只写入最后一个变更的键：
```js
setTimeout(() => {
  setFilters((prev) => ({ ...prev, [key]: value })) // 只写单键！
  setPage(1)
}, 300)
```
当用户在 300ms 内先后修改两个字段（如先改操作人、再改操作类型），后一个字段的 `setTimeout` 会清除前一个的计时器，最终回调只同步最后修改的那个键，前一个字段的值虽然进入了 `draftFilters`，但永远不会被写入 `filters`。

### 修复方案
引入 `draftRef` ref 对象保存最新的 draft 状态，防抖回调触发时一次性把全部 draft 同步到 filters：

```js
const debounceRef = useRef(null)
const draftRef = useRef(draftFilters)

const updateDraftFilter = useCallback((key, value) => {
  const next = { ...draftRef.current, [key]: value }
  draftRef.current = next   // ref 同步更新，不受闭包影响
  setDraftFilters(next)
  if (debounceRef.current) clearTimeout(debounceRef.current)
  debounceRef.current = setTimeout(() => {
    setFilters(draftRef.current)  // 一次性写入全部字段
    setPage(1)
  }, 300)
}, [])
```

关键设计点：
- 使用 ref 而非 state 作为防抖回调的数据源，避免闭包捕获旧值
- 防抖到期时整体提交 draft，确保窗口内所有字段变更都能生效
- `handleResetFilters` 也同步更新 `draftRef.current`，避免重置后残留旧 draft

### 测试验证
- 审计日志模块：**63/63 测试通过**
- （注：全局测试套件中 `security-center` 模块有 1 个预先存在的弱密码检测测试失败，与本次修改无关）