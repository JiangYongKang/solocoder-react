让我创建任务清单并逐一修复这些问题。


        
            
toolName: todo_write
            
status: success
          
Todos updated: 4 items
          
先看当前的 ensureMinimumUsers、ensureMinimumRoles 和 getCheckState 的实现。





        
            
toolName: todo_write
            
status: success
          
Todos updated: 4 items
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\permissions\utils.js
          
现在看 getCheckState 的实现。







        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\permissions\utils.js
          
现在开始修复。首先看 constants.js 中的 mock 数据，确认管理员用户和角色。







        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\permissions\constants.js
          
现在修改 utils.js：
1. deleteUser 禁止删除最后一个用户
2. deleteRole 禁止删除最后一个角色
3. ensureMinimumUsers 只恢复 1 个默认管理员用户
4. ensureMinimumRoles 只恢复 1 个默认管理员角色
5. getCheckState 用叶子节点判断










        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\permissions\utils.js
          
changes: undefined
          
现在修改 deleteRole 禁止删除最后一个角色，并修改 getCheckState 使用叶子节点判断。











        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\permissions\utils.js
          
changes: undefined
          
现在修改 getCheckState 使用叶子节点判断。












        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\permissions\utils.js
          
changes: undefined
          
现在修改 index.jsx：处理 deleteUser/deleteRole 返回失败时的提示。先看现有的删除确认逻辑。










        
            
toolName: todo_write
            
status: success
          
Todos updated: 4 items
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\permissions\index.jsx
          
让我先看用户表格和角色表格中删除按钮的渲染位置，然后在只剩一个时禁用删除按钮。










        
            
toolName: search_by_regex
            
status: success
          
query: userDeleteConfirm|roleDeleteConfirm|删除
          
让我看表格中删除按钮的渲染。














        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\permissions\index.jsx
          
让我看删除确认弹窗结构。















        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\permissions\index.jsx
          
我添加一个简单的错误提示机制，以及在只剩一个用户/角色时禁用删除按钮。先添加状态和 toast。

















        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\permissions\index.jsx
          
现在修改 index.jsx：添加 errorMessage 状态，禁用删除按钮（只剩一个时），并显示错误提示。让我一次性修改多处。首先添加状态。
















        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\permissions\index.jsx
          
changes: undefined
          
让我检查 index.jsx 的 import，确保 useRef 和 useCallback 已导入。


















        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\permissions\index.jsx
          

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\permissions\index.jsx
          
changes: undefined
          
现在修改 handleUserDelete 和 handleRoleDelete 处理错误。
















        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\permissions\index.jsx
          
changes: undefined
          

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\permissions\index.jsx
          
changes: undefined
          
现在修改表格中的删除按钮：只剩一个用户/角色时禁用。并添加 toast 展示。先找删除按钮。

















        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\permissions\index.jsx
          

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\permissions\index.jsx
          
changes: undefined
          
现在找角色删除按钮位置。



















        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\permissions\index.jsx
          

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\permissions\index.jsx
          
changes: undefined
          
现在在页面顶部添加 error toast 的渲染。让我看页面 JSX 结构。





















        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\permissions\index.jsx
          
在 current-user-info 后面加上错误提示 toast。



















        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\permissions\index.jsx
          
changes: undefined
          
现在在 index.css 中添加 error-toast 样式、btn-link.disabled 样式，并优化 375px 布局。让我先看完整的 CSS。




















        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\permissions\index.css
          
现在添加 error-toast、btn-link.disabled 等新样式。



















        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\permissions\index.css
          
changes: undefined
          
现在添加 error-toast 样式。在 current-user-info 后添加。





















        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\permissions\index.css
          
changes: undefined
          
现在更新测试文件。让我先看现有测试中与 deleteUser、ensureMinimumUsers、getCheckState 相关的部分。

















        
            
toolName: todo_write
            
status: success
          
Todos updated: 4 items
          

        
            
toolName: search_by_regex
            
status: success
          
query: describe\('deleteUser'|describe\('ensureMinimum'|describe\('getCheckState'|describe\('deleteRole'
          
让我看这些测试。



















        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\permissions\utils.test.js
          
让我看 getCheckState 测试内容。






















        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\permissions\utils.test.js
          
现在更新测试：添加禁止删除最后一个用户/角色的测试，并更新 ensureMinimum 测试（只恢复1个）。























        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\permissions\utils.test.js
          
changes: undefined
          
现在更新 deleteRole 测试，添加禁止删除最后一个角色的测试。























        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\permissions\utils.test.js
          
changes: undefined
          
现在运行 pnpm run test 验证所有测试通过。






















        
            
toolName: run_command
            
status: success
          
command: pnpm run test -- src/pages/__tests__/permissions/utils.test.js undefined
          
让我换一种方式运行权限测试。

















        
            
toolName: run_command
            
status: success
          
command: npx vitest run src/pages/__tests__/permissions/utils.test.js undefined
          
98 个测试全部通过！现在运行完整测试和 build，并启动开发服务器。




















        
            
toolName: todo_write
            
status: success
          
Todos updated: 5 items
          

        
            
toolName: run_command
            
status: success
          
command: npm run build undefined
          
Build 成功！现在启动开发服务器供手动验证。























        
            
toolName: todo_write
            
status: success
          
Todos updated: 5 items
          

        
            
toolName: run_command
            
status: running
          
command: pnpm run dev undefined
          

        
            
toolName: open_preview
            
status: success
          
预览
          
所有遗留问题已全部修复并验证通过！开发服务器已启动在 http://localhost:5176/permissions。

## ✅ 修复清单

### 1. ensureMinimumUsers/ensureMinimumRoles 兜底粒度优化 [utils.js](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/permissions/utils.js)

**问题**：删除最后一个用户时一次性恢复全部 5 个 Mock 用户。

**修复方案（双重保障）**：
- **deleteUser** / **deleteRole**：禁止删除最后一个用户/角色，返回 `{ success: false, error: '至少保留一个用户/角色' }`
- **ensureMinimumUsers** / **ensureMinimumRoles**：作为极端情况兜底，只恢复 1 个默认管理员用户（`u_admin`）和 1 个默认管理员角色（`r_admin`），而不是全部 5 个用户 3 个角色

### 2. getCheckState 与 togglePermission 语义统一 [utils.js](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/permissions/utils.js#L424-L442)

**问题**：`togglePermission` 只存叶子节点，但 `getCheckState` 仍按直接子节点（`getChildIdsByParent`）判断状态。

**修复**：`getCheckState` 改为使用 `getLeafIdsUnderNode` 获取该节点下**所有叶子节点**来判断三态：
- 叶子节点：直接判断自身是否在 checkedIds 中
- 父节点：基于所有叶子后代判断 allChecked / someChecked
- 即使将来权限树扩展为多层也能正确工作

### 3. UI 层联动 [index.jsx](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/permissions/index.jsx)

- 表格「删除」按钮：只剩一个用户/角色时自动禁用（`.disabled` 样式 + `disabled` 属性）
- 新增 **error toast** 机制（`showError` + `errorMessage` 状态）：删除失败时显示 3 秒红色提示条
- 删除失败后不关闭确认弹窗，用户可看到原因

### 4. 375px 移动端布局优化 [index.css](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/permissions/index.css)

新增样式：
- `.error-toast` 红色提示条 + shakeIn 动画
- `.btn-link.disabled` / `.btn-link:disabled` 禁用态
- 移动端断点：表格 min-width 440px、按钮 padding 缩小、表单按钮 `flex:1` 等宽

### 5. 单元测试 [utils.test.js](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/__tests__/permissions/utils.test.js)

新增/更新测试用例：
| 测试 | 用例数 |
|------|--------|
| deleteUser：禁止删除最后一个用户 | +1 |
| deleteRole：禁止删除最后一个角色 | +1 |
| ensureMinimumUsers：只恢复 1 个 admin | 更新 3 个 |
| ensureMinimumRoles：只恢复 1 个 r_admin | 更新 2 个 |

## 📊 验证结果

| 检查项 | 结果 |
|--------|------|
| 单元测试 | **98 passed** ✅ |
| npm run build | ✅ 成功 |
| 开发服务器 | ✅ http://localhost:5176/permissions 无浏览器错误 |