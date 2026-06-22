toolName: todo_write
            
status: success
          
Todos updated: 2 items
          

        
            
toolName: search_by_regex
            
status: success
          
query: export function loadFromStorage|function loadFromStorage
          

        
            
toolName: search_by_regex
            
status: success
          
query: loadFromStorage
          

        
            
toolName: todo_write
            
status: success
          
Todos updated: 4 items
          

        
            
toolName: search_by_regex
            
status: success
          
query: function safeGetItem|export function safeGetItem
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\task-dag\taskDagCore.js
          

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\task-dag\taskDagCore.js
          
changes: undefined
          

        
            
toolName: todo_write
            
status: success
          
Todos updated: 4 items
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\task-dag\taskDagCore.test.js
          

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\task-dag\taskDagCore.test.js
          
changes: undefined
          

        
            
toolName: run_command
            
status: success
          
command: npm test -- src/pages/__tests__/task-dag/taskDagCore.test.js undefined
          

        
            
toolName: todo_write
            
status: success
          
Todos updated: 4 items
          

        
            
toolName: run_command
            
status: success
          
command: npx eslint src/pages/task-dag/ src/pages/__tests__/task-dag/ undefined
          

        
            
toolName: run_command
            
status: success
          
command: npm run build undefined
          

        
            
toolName: todo_write
            
status: success
          
Todos updated: 4 items
          
## 问题已修复

### 问题分析

原代码中 `loadFromStorage` 函数在所有异常路径下都被 try-catch 静默捕获，始终返回不含 `error` 属性的统一结构 `{ nodes: [], edges: [] }`，导致组件中 `saved.error` 的条件分支**永远为假**，形成死代码，用户永远看不到存储读取失败的错误提示。

### 修复内容

**1. 重写 `loadFromStorage` 函数** [`taskDagCore.js`](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/task-dag/taskDagCore.js#L433-L455)

区分不同错误场景并返回具体的 `error` 信息：

| 场景 | 返回值 |
|------|--------|
| 无数据（正常） | `{ nodes: [], edges: [] }` （无 error） |
| 有效数据 | `{ nodes: [...], edges: [...] }` （无 error） |
| JSON 解析失败 | `{ nodes: [], edges: [], error: '数据解析失败: ...' }` |
| 数据不是有效对象 | `{ nodes: [], edges: [], error: '数据格式错误: 不是有效对象' }` |
| 缺少 nodes/edges 数组 | `{ nodes: [], edges: [], error: '数据格式错误: 缺少 nodes 或 edges 数组' }` |
| localStorage 异常 | `{ nodes: [], edges: [], error: '读取本地存储失败: ...' }` |

**2. 更新组件初始化逻辑** [`index.jsx`](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/task-dag/index.jsx#L256-L267)

通过 `useMemo` 加载初始数据，当 `initialState.toast` 存在时自动显示错误提示，现在这段逻辑不再是死代码。

**3. 更新单元测试** [`taskDagCore.test.js`](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/__tests__/task-dag/taskDagCore.test.js#L658-L708)

- 原有 4 个测试全部更新，增加 `error` 属性断言
- 新增 1 个测试：`localStorage 异常时应返回错误信息`
- 测试总数：68 → 69，全部通过

### 验证结果

- ✅ ESLint：0 错误
- ✅ 单元测试：69 个测试全部通过
- ✅ 项目构建：`npm run build` 成功