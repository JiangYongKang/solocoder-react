toolName: todo_write
            
status: success
          
Todos updated: 6 items
          

        
            
toolName: view_files
            
status: success
          
            
filePath: /Users/vincent/GoletaLab/solocoder-react/src/pages/i18n-manager/index.jsx
          

        
            
toolName: todo_write
            
status: success
          
Todos updated: 6 items
          
Let me also read the i18nUtils.js to add a helper for getting top-level keys.

        
            
toolName: view_files
            
status: success
          
            
filePath: /Users/vincent/GoletaLab/solocoder-react/src/pages/i18n-manager/i18nUtils.js
          
Now let me make all the fixes. First, add utility functions for dynamic initial expanded keys:


        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: /Users/vincent/GoletaLab/solocoder-react/src/pages/i18n-manager/i18nUtils.js
          
changes: undefined
          
Now let me fix the index.jsx. First, update imports and fix the KeyEditCell component to remove the dead `onChange` prop:




        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: /Users/vincent/GoletaLab/solocoder-react/src/pages/i18n-manager/index.jsx
          
changes: undefined
          
Now fix the KeyEditCell component to remove the dead `onChange` prop code:

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: /Users/vincent/GoletaLab/solocoder-react/src/pages/i18n-manager/index.jsx
          
changes: undefined
          
Now let me fix the TreeRow component to add delete button, support key editing, and align columns:



        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: /Users/vincent/GoletaLab/solocoder-react/src/pages/i18n-manager/index.jsx
          
changes: undefined
          
Now let me fix the initial expanded keys to be dynamic and pass the new props to TreeRow:





        
            
toolName: view_files
            
status: success
          
            
filePath: /Users/vincent/GoletaLab/solocoder-react/src/pages/i18n-manager/index.jsx
          
Now let me fix the dynamic initial expanded keys and read the JSX render section:






        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: /Users/vincent/GoletaLab/solocoder-react/src/pages/i18n-manager/index.jsx
          
changes: undefined
          
Now let me also add an effect to auto-expand new top-level keys when translations change (e.g., after import), and then find and update the TreeRow JSX to pass the new props:







        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: /Users/vincent/GoletaLab/solocoder-react/src/pages/i18n-manager/index.jsx
          
changes: undefined
          
Now let me find and update the TreeRow JSX in the render to pass the new props:









        
            
toolName: view_files
            
status: success
          
            
filePath: /Users/vincent/GoletaLab/solocoder-react/src/pages/i18n-manager/index.jsx
          

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: /Users/vincent/GoletaLab/solocoder-react/src/pages/i18n-manager/index.jsx
          
changes: undefined
          

        
            
toolName: todo_write
            
status: success
          
Todos updated: 6 items
          
Now let me read the existing test file and add the new tests:

















        
            
toolName: view_files
            
status: success
          
            
filePath: /Users/vincent/GoletaLab/solocoder-react/src/pages/__tests__/i18n-manager/i18nUtils.test.js
          

        
            
toolName: view_files
            
status: success
          
            
filePath: /Users/vincent/GoletaLab/solocoder-react/src/pages/__tests__/i18n-manager/i18nUtils.test.js
          

        
            
toolName: view_files
            
status: success
          
            
filePath: /Users/vincent/GoletaLab/solocoder-react/src/pages/__tests__/i18n-manager/i18nUtils.test.js
          
Now let me update the test file to add the new imports and tests for the new utility functions and row operation scenarios:



        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: /Users/vincent/GoletaLab/solocoder-react/src/pages/__tests__/i18n-manager/i18nUtils.test.js
          
changes: undefined
          
Now let me add the new tests before the end of the test file:







        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: /Users/vincent/GoletaLab/solocoder-react/src/pages/__tests__/i18n-manager/i18nUtils.test.js
          
changes: undefined
          

        
            
toolName: todo_write
            
status: success
          
Todos updated: 6 items
          
Now let me run the tests and lint to verify everything works:




        
            
toolName: run_command
            
status: success
          
command: cd /Users/vincent/GoletaLab/solocoder-react && pnpm test -- src/pages/__tests__/i18n-manager/ 2>&1 undefined
          
All 4023 tests pass across all 57 test files. Now let me run the linter on my files specifically:







        
            
toolName: GetDiagnostics
            
status: success
          
          

        
            
toolName: GetDiagnostics
            
status: success
          
          

        
            
toolName: GetDiagnostics
            
status: success
          
          

        
            
toolName: GetDiagnostics
            
status: success
          
          

        
            
toolName: GetDiagnostics
            
status: success
          
          
All files have 0 diagnostics (no lint errors or warnings). Let me mark everything complete.







        
            
toolName: todo_write
            
status: success
          
Todos updated: 6 items
          
全部 6 个问题已修复并验证通过。以下是修复详情：

## 修复内容

### 1. 树形视图叶子节点删除按钮
在 [TreeRow](file:///Users/vincent/GoletaLab/solocoder-react/src/pages/i18n-manager/index.jsx#L167-L280) 中：
- 叶子节点新增操作列 `<td>`，渲染「删除」按钮，与平铺视图一致
- 分支节点新增空操作列 `<td class="i18n-tree-branch-cell i18n-action-cell">`，与表头列数对齐
- 向递归 TreeRow 传递 `onDeleteKey` prop

### 2. 树形视图叶子节点 key 可编辑
- 叶子节点 key 从普通 `<span>` 替换为 [KeyEditCell](file:///Users/vincent/GoletaLab/solocoder-react/src/pages/i18n-manager/index.jsx#L106-L165)，支持双击进入编辑状态
- 编辑叶子节点名称后，通过 `fullKey.split('.')` 拼接出新的完整 key（保留前缀层级，仅修改末段）
- 传递 `onKeyChange` 和 `editingKeyErrors` props，错误提示与平铺视图一致

### 3. 清理死代码
- [KeyEditCell](file:///Users/vincent/GoletaLab/solocoder-react/src/pages/i18n-manager/index.jsx#L106) 移除未使用的 `onChange` prop 及 `onChange && onChange(...)` 回调代码

### 4. 动态初始展开集合
- [i18nUtils.js](file:///Users/vincent/GoletaLab/solocoder-react/src/pages/i18n-manager/i18nUtils.js#L295-L309) 新增两个工具函数：
  - `getTopLevelKeys(translations)` — 提取所有顶级命名空间并去重排序
  - `getInitialExpandedKeys(translations, level)` — 根据顶级 key 生成初始展开 Set
- 初始化从硬编码 `new Set(['app_0', ...])` 改为 `getInitialExpandedKeys(loadState().translations)`
- 新增 useEffect：当 translations 变化时（如 JSON 导入后）自动将新的顶级 key 加入展开集合

### 5. 补充单元测试（25 个新用例）
在 [i18nUtils.test.js](file:///Users/vincent/GoletaLab/solocoder-react/src/pages/__tests__/i18n-manager/i18nUtils.test.js) 新增：
- **getTopLevelKeys**（4 个）：命名空间提取、单部分 key、空数据、去重排序
- **getInitialExpandedKeys**（4 个）：level 0 默认、自定义 level、空数据、动态导入命名空间
- **row operations for both view modes**（17 个）：覆盖 CRUD 在不同嵌套层级、树形叶子完整性、筛选、覆盖率、行高亮判断、导入合并、排序等场景

## 验证结果

- ✅ **测试通过**：57 个测试文件，4023 个测试全部通过
- ✅ **Lint 通过**：`index.jsx`、`i18nUtils.js`、`constants.js`、`i18nUtils.test.js`、`App.jsx` 均为 0 错误 0 警告