我来逐个修复这些问题。首先读取相关代码进行分析：

        
            
toolName: todo_write
            
status: success
          
Todos updated: 4 items
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\todo-list\todoUtils.js
          
现在让我读取计数函数的当前实现：



        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\todo-list\todoUtils.js
          
现在我清楚了所有问题。让我开始修复：

**1. 统一筛选策略** - 两个计数函数都应该先筛选根任务，然后递归统计：





        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\todo-list\todoUtils.js
          
changes: undefined
          
**2. 简化 `reorderGroupRootTasks` 逻辑** - 移除冗余的拼合再拆分操作：







        
            
toolName: todo_write
            
status: success
          
Todos updated: 4 items
          

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\todo-list\todoUtils.js
          
changes: undefined
          
**3. 更新单元测试** 以匹配新的筛选策略：





        
            
toolName: todo_write
            
status: success
          
Todos updated: 4 items
          
让我先读取测试文件中相关的测试：







        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\todo-list\todoUtils.test.js
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\todo-list\todoUtils.test.js
          
现在更新测试用例以匹配新的筛选策略。关键变化：根任务不通过筛选时，它的子任务即使通过筛选也不被统计：







        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\todo-list\todoUtils.test.js
          
changes: undefined
          
让我检查 `countFilteredAllIncomplete` 的测试：









        
            
toolName: search_by_regex
            
status: success
          
query: countFilteredAllIncomplete
          
让我更新 `countFilteredAllIncomplete` 的测试，添加一个测试来验证它也遵循相同的筛选策略：







        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\todo-list\todoUtils.test.js
          
changes: undefined
          
**4. 运行测试验证**：











        
            
toolName: todo_write
            
status: success
          
Todos updated: 4 items
          

        
            
toolName: run_command
            
status: success
          
command: npx vitest --run src/pages/__tests__/todo-list/todoUtils.test.js undefined
          
太好了！111 个测试全部通过。现在运行完整的测试套件：







        
            
toolName: run_command
            
status: success
          
command: pnpm run test undefined
          
测试通过！只有 `habit-tracker` 页面有 2 个预先存在的测试失败（与我们的修改无关）。我们的 todo-list 111 个测试全部通过。

**代码参考**：
- [todoUtils.js](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/todo-list/todoUtils.js#L333-L357) - 简化后的 `reorderGroupRootTasks`
- [todoUtils.js](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/todo-list/todoUtils.js#L436-L452) - 统一筛选策略的计数函数
- [todoUtils.test.js](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/__tests__/todo-list/todoUtils.test.js#L653-L769) - 更新后的测试用例


        
            
toolName: todo_write
            
status: success
          
Todos updated: 4 items
          
## 修复完成总结

### 修复的问题

**1. 统一筛选策略（与 `getGroupTasks` 保持一致）**

修复前 `countFilteredGroupIncomplete` 使用 `flattenTasks` 扁平化所有任务后逐项筛选，与 `getGroupTasks` 只对根任务筛选的策略不一致，导致角标数字与实际可见任务数不一致。

**修复后**（[todoUtils.js](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/todo-list/todoUtils.js#L436-L452)）：

```javascript
export function countFilteredGroupIncomplete(tasks, groupId, filters) {
  let rootTasks = groupId === ALL_TASKS_VIEW
    ? tasks.filter(t => !t.parentId)
    : tasks.filter(t => t.groupId === groupId && !t.parentId)
  if (filters) {
    rootTasks = filterTasks(rootTasks, filters)
  }
  return countIncompleteTasks(rootTasks)
}
```

- 先按 `groupId` 和 `!parentId` 筛选根任务
- 对根任务应用筛选条件
- 然后递归统计通过筛选的根任务下的所有未完成子任务
- 这样角标计数与任务列表显示完全一致

**2. 统一两个计数函数的筛选策略**

修复前 `countFilteredGroupIncomplete` 和 `countFilteredAllIncomplete` 使用不同的筛选路径。

**修复后**：两个函数采用完全相同的"根任务优先"筛选策略，保证相同筛选条件下结果一致。

**3. 简化 `reorderGroupRootTasks` 逻辑**（[todoUtils.js](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/todo-list/todoUtils.js#L333-L357)）

移除了冗余的 `combinedRoot` 构建和过滤步骤，直接返回拼接结果：

```javascript
return [...reorderedGroupTasks, ...otherRootTasks, ...subtaskTasks]
```

**4. 更新单元测试**（[todoUtils.test.js](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/__tests__/todo-list/todoUtils.test.js#L653-L769)）

新增 5 个测试用例：
- `should not count subtask when parent root task does not pass filter` - 根任务不通过筛选时，子任务即使通过也不计数
- `should count subtasks when parent root task passes filter` - 根任务通过筛选时，递归统计所有子任务
- `should use same filter strategy as getGroupTasks (root-first)` - 验证与列表展示策略一致
- `should not count subtask when parent root task does not pass filter` (countFilteredAllIncomplete 版本)
- `should use same filter strategy as countFilteredGroupIncomplete` - 验证两个函数结果一致

### 验证结果

- ✅ **111/111** todo-list 单元测试全部通过
- ✅ 其他页面的 2 个失败测试是 `habit-tracker` 预先存在的问题，与本次修改无关
- ✅ 总计 8725 个测试通过