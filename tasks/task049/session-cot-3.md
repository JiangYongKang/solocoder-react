让我先读取当前的 CustomerTable.jsx 并创建任务计划：








        
            
toolName: todo_write
            
status: success
          
Todos updated: 4 items
          

        
            
toolName: todo_write
            
status: success
          
Todos updated: 4 items
          

        
            
toolName: view_files
            
status: success
          
            
filePath: /Users/vincent/GoletaLab/solocoder-react/src/pages/crm/CustomerTable.jsx
          
现在重构 CustomerTable.jsx，抽取表头为共享渲染逻辑，消除代码重复：


















        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: /Users/vincent/GoletaLab/solocoder-react/src/pages/crm/CustomerTable.jsx
          
changes: undefined
          
现在运行 CRM 单元测试和 lint 检查：





















        
            
toolName: todo_write
            
status: success
          
Todos updated: 4 items
          

        
            
toolName: run_command
            
status: success
          
command: pnpm vitest run src/pages/__tests__/crm/crmUtils.test.js 2>&1 | tail -15 undefined
          

        
            
toolName: run_command
            
status: success
          
command: pnpm eslint src/pages/crm/ 2>&1 undefined
          
122 个单元测试全部通过，ESLint 0 错误！现在启动 dev server 验证：

























        
            
toolName: todo_write
            
status: success
          
Todos updated: 4 items
          

        
            
toolName: run_command
            
status: running
          
command: pnpm run dev 2>&1 undefined
          

        
            
toolName: open_preview
            
status: success
          
预览
          
浏览器没有任何报错！所有任务都完成：





























        
            
toolName: todo_write
            
status: success
          
Todos updated: 4 items
          
所有残留问题已修复完成！

## 修复内容

### 消除 CustomerTable.jsx 表头代码重复
**文件**: [CustomerTable.jsx](file:///Users/vincent/GoletaLab/solocoder-react/src/pages/crm/CustomerTable.jsx#L48-L168)

**重构前**: 空状态和正常状态各维护一份表头（9 列 × 2 = 18 个重复 `<th>`），未来任意列的修改都需要同步更新两处，维护成本高且易遗漏。

**重构后**: 
- 抽取 `renderTableHead()` 共享函数渲染表头，**从根源消除代码重复**
- 抽取 `renderTableBody()` 渲染数据行，逻辑更清晰
- 统一的返回结构：通过 `isEmpty` 变量控制是否渲染 `<tbody>` 和空状态提示

```jsx
const renderTableHead = () => (
  <thead>
    <tr>
      {/* 9 列的唯一定义 */}
    </tr>
  </thead>
)

const isEmpty = !items || items.length === 0
return (
  <div className="table-wrap">
    <table className="crm-table">
      {renderTableHead()}
      {!isEmpty && renderTableBody()}
    </table>
    {isEmpty && <div className="empty-state">暂无数据</div>}
  </div>
)
```

## 验证结果

| 检查项 | 结果 |
|--------|------|
| CRM ESLint (`pnpm eslint src/pages/crm/`) | ✅ **0 错误** |
| CRM 单元测试 (`122` 个用例) | ✅ **全部通过** |
| 开发服务器 | ✅ **正常启动** http://localhost:5177/ |
| 浏览器控制台（CRM 页面 `http://localhost:5177/#/crm`） | ✅ **无任何报错** |