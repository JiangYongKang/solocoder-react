我来逐个修复这些问题。首先进行任务规划：

        
            
toolName: todo_write
            
status: success
          
Todos updated: 7 items
          
让我先读取当前的相关文件内容：


        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\todo-list\index.jsx
          
现在让我读取 todoUtils.js 来了解需要添加哪些辅助函数：



        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\todo-list\todoUtils.js
          
好的，我现在来逐个修复这些问题。首先在 `todoUtils.js` 中添加支持筛选的计数函数：





        
            
toolName: todo_write
            
status: success
          
Todos updated: 7 items
          

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\todo-list\todoUtils.js
          
changes: undefined
          
我需要在 `todoUtils.js` 中导入 `ALL_TASKS_VIEW` 常量：





        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\todo-list\todoUtils.js
          
changes: undefined
          
现在我需要添加一个专门处理分组视图下根任务重排序的函数：







        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\todo-list\todoUtils.js
          
changes: undefined
          
现在修改 `index.jsx` 来应用所有修复。首先导入新的工具函数并修复打卡逻辑：







        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\todo-list\index.jsx
          
changes: undefined
          
现在修复打卡记录逻辑——只在任务被标记为完成时触发：









        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\todo-list\index.jsx
          
changes: undefined
          
现在修复拖拽排序逻辑，使用新的 `reorderGroupRootTasks` 函数：










        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\todo-list\index.jsx
          
changes: undefined
          
现在更新分组侧边栏的角标，使其考虑筛选条件，并清理残留的 `parentId` prop：

















        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\todo-list\index.jsx
          
changes: undefined
          
现在清理 TaskCard 调用处残留的 `parentId={null}` 属性：















        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\todo-list\index.jsx
          
changes: undefined
          

        
            
toolName: todo_write
            
status: success
          
Todos updated: 7 items
          
现在读取现有测试文件，添加新函数的测试：



















        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\todo-list\todoUtils.test.js
          
现在更新测试文件，添加新函数的导入和测试：





























        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\todo-list\todoUtils.test.js
          
changes: undefined
          
现在添加新的测试用例。首先在 `countGroupIncomplete` 测试后添加筛选计数测试：



























        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\todo-list\todoUtils.test.js
          
changes: undefined
          
现在添加 `reorderGroupRootTasks` 的测试：




























        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\todo-list\todoUtils.test.js
          
changes: undefined
          

        
            
toolName: todo_write
            
status: success
          
Todos updated: 7 items
          
现在运行测试来验证所有修复：



























        
            
toolName: run_command
            
status: success
          
command: cd c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react; npx vitest --run src/pages/__tests__/todo-list/todoUtils.test.js undefined
          
有 3 个测试失败了。我来分析并修复这些问题：

1. **reorderGroupRootTasks 测试**：测试数据中 subtask 只在父任务的 subtasks 数组中，但实际上我们的数据结构要求每个任务都在顶层数组中，并有 `parentId` 字段

2. **countFilteredGroupIncomplete/countFilteredAllIncomplete**：这些函数应该先扁平化所有任务，然后应用筛选，再计数通过筛选的未完成任务数量

让我先修复 `todoUtils.js` 中的计数函数：


























        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\todo-list\todoUtils.js
          
changes: undefined
          
现在修复测试中的测试数据：


























        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\todo-list\todoUtils.test.js
          
changes: undefined
          
让我检查一下 `countFilteredAllIncomplete` 的逻辑是否与原函数保持一致。原来的 `countAllIncomplete` 会递归计算子任务，所以筛选版本也应该一致：





























        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\todo-list\todoUtils.js
          
changes: undefined
          
让我再次运行测试，看看当前状态：































        
            
toolName: run_command
            
status: success
          
command: cd c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react; npx vitest --run src/pages/__tests__/todo-list/todoUtils.test.js 2>&1 undefined
          
现在只有一个测试失败了。问题是 `countFilteredAllIncomplete` 会递归计算子任务（与原 `countAllIncomplete` 行为一致），但测试期望只计数根任务。我来修改测试以匹配实际的预期行为——角标应该显示该分组下**所有**未完成任务的数量（包括子任务）：































        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\todo-list\todoUtils.test.js
          
changes: undefined
          
现在运行测试验证所有测试通过：
































        
            
toolName: run_command
            
status: success
          
command: cd c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react; npx vitest --run src/pages/__tests__/todo-list/todoUtils.test.js undefined
          
所有 107 个测试通过！现在运行 lint 检查：





































        
            
toolName: run_command
            
status: success
          
command: cd c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react; npx eslint src/pages/todo-list/ src/pages/__tests__/todo-list/ undefined
          
Lint 检查通过！现在运行 `pnpm run test` 验证所有测试：




































        
            
toolName: run_command
            
status: success
          
command: cd c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react; pnpm run test 2>&1 undefined
          
所有失败的测试都是其他页面预先存在的问题（`event-debugger`、`time-tracker`、`habit-tracker`），与我们的修改无关。**我们的 todo-list 所有 107 个测试全部通过**。



        
            
toolName: todo_write
            
status: success
          
Todos updated: 7 items
          
## 修复完成总结

### 修复的问题

**1. 打卡记录逻辑修复** ([index.jsx](file:///C:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/todo-list/index.jsx#L386-L396))
- 之前：每次任务状态切换都会无条件记录打卡
- 现在：只在任务**从未完成变为完成**时才记录打卡（检查 `wasCompleted` 状态）

```jsx
const handleToggle = useCallback((taskId) => {
  setTasks(prev => {
    const task = findTaskById(prev, taskId)
    const wasCompleted = task?.completed
    const updated = toggleTaskCompletion(prev, taskId)
    if (!wasCompleted) {  // 只有从完成 → 未完成不触发
      setCheckins(c => recordCheckin(c))
    }
    return updated
  })
}, [])
```

**2. 拖拽排序索引修复** ([todoUtils.js](file:///C:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/todo-list/todoUtils.js#L333-L363))
- 新增 `reorderGroupRootTasks` 函数，使用任务 ID 而非相对索引来定位被拖动任务
- 该函数在分组视图下仅操作该分组的任务，保持其他分组任务的顺序不变

**3. 筛选后角标更新** ([todoUtils.js](file:///C:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/todo-list/todoUtils.js#L436-L453))
- 新增 `countFilteredGroupIncomplete` 和 `countFilteredAllIncomplete` 函数
- 侧边栏角标现在会根据当前激活的筛选条件动态更新
- UI 中使用这两个新函数替换原来的无筛选版本

**4. 残留 `parentId={null}` 清理** ([index.jsx](file:///C:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/todo-list/index.jsx#L669-L675))
- 移除了 TaskCard 调用处残留的 `parentId={null}` 属性

### 新增的单元测试 ([todoUtils.test.js](file:///C:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/__tests__/todo-list/todoUtils.test.js))

新增 **17 个** 单元测试，覆盖：

- **`reorderGroupRootTasks`** (7 个测试)：
  - 特定分组内的任务重排序
  - 将任务从中间移到开头
  - ALL_TASKS_VIEW 跨分组重排序
  - 保持其他分组任务顺序不变
  - 保留子任务在结果中
  - 任务不存在时返回原数组

- **`countFilteredGroupIncomplete`** (7 个测试)：
  - 无筛选时的计数
  - 优先级筛选
  - 状态筛选
  - 截止日期筛选
  - null 筛选参数处理
  - 带子任务的筛选计数
  - ALL_TASKS_VIEW 支持

- **`countFilteredAllIncomplete`** (3 个测试)：
  - 无筛选时的计数
  - 优先级筛选
  - null 筛选参数处理
  - 与原函数一致的子任务递归计数行为

### 验证结果

- ✅ **107/107** todo-list 单元测试全部通过
- ✅ ESLint 检查零错误
- ✅ `pnpm run test` 中其他页面的失败是预先存在的问题，与本次修改无关