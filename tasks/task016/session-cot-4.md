让我创建任务清单并逐一修复。



        
            
toolName: todo_write
            
status: success
          
Todos updated: 4 items
          
先看当前 deleteUser、deleteRole 和 DEFAULT_ADMIN 的实现。





        
            
toolName: todo_write
            
status: success
          
Todos updated: 4 items
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\permissions\utils.js
          
现在同时修复这两个问题：调整守卫顺序 + 复用 MOCK 数据并动态生成 createdAt。





        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\permissions\utils.js
          
changes: undefined
          
现在修复 deleteRole 的守卫顺序。









        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\permissions\utils.js
          
changes: undefined
          
现在更新测试：校验删除不存在用户时的 error 信息，并验证 createdAt 动态生成。







        
            
toolName: todo_write
            
status: success
          
Todos updated: 4 items
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\permissions\utils.test.js
          
现在更新 deleteUser 和 deleteRole 的测试，校验 error 字段的具体值，并验证 createdAt 动态生成。同时也看看 deleteRole 的测试。







        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\permissions\utils.test.js
          
changes: undefined
          
现在更新 deleteRole 的测试。先看当前的测试内容。











        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\permissions\utils.test.js
          

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\permissions\utils.test.js
          
changes: undefined
          
现在运行 pnpm run test 验证所有测试通过。












        
            
toolName: todo_write
            
status: success
          
Todos updated: 4 items
          

        
            
toolName: run_command
            
status: success
          
command: npx vitest run src/pages/__tests__/permissions/utils.test.js undefined
          
100 个测试全部通过！所有修复已完成验证。










        
            
toolName: todo_write
            
status: success
          
Todos updated: 4 items
          
所有遗留问题已修复并通过测试！

## ✅ 修复清单

### 1. 守卫顺序调整 [utils.js](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/permissions/utils.js)

**问题**：`deleteUser`/`deleteRole` 中「至少保留一个」守卫写在存在性检查前面，当只有一个用户但删除一个不存在 ID 时，错误信息误导为「至少保留一个用户」。

**修复**：调整顺序 — 先检查存在性，再检查是否是最后一个：

```
deleteUser/deleteRole 执行顺序：
  ① exists = users.some(id === target)   ← 先判断目标是否存在
  ② if (!exists) → return { error: '用户/角色不存在' }
  ③ if (length <= 1) → return { error: '至少保留一个用户/角色' }
  ④ 执行删除
```

同时为存在性检查也补上了 `error` 字段（之前未返回）。

### 2. DEFAULT_ADMIN 数据优化 [utils.js](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/permissions/utils.js)

**问题**：
- `DEFAULT_ADMIN_USER` / `DEFAULT_ADMIN_ROLE` 用模块级常量，`createdAt: Date.now()` 在模块加载时硬编码
- 手写了一份与 `MOCK_USERS[0]` / `MOCK_ROLES[0]` 重复的数据

**修复**：改为工厂函数动态生成，复用 constants.js 的 MOCK 数据：

```javascript
function makeDefaultAdminUser() {
  const template = MOCK_USERS.find((u) => u.id === 'u_admin') || MOCK_USERS[0]
  return { ...template, createdAt: Date.now() }  // createdAt 每次调用时动态生成
}

function makeDefaultAdminRole() {
  const template = MOCK_ROLES.find((r) => r.id === 'r_admin') || MOCK_ROLES[0]
  return { ...template, createdAt: Date.now() }
}
```

### 3. 测试更新 [utils.test.js](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/__tests__/permissions/utils.test.js)

新增测试用例：

| 测试 | 内容 |
|------|------|
| deleteUser：用户不存在 | 校验 `result.error === '用户不存在'` |
| deleteUser：不存在 vs 最后一个 | 用户列表只有 1 个但删除不存在 ID，应报「不存在」而非「至少保留一个」 |
| deleteUser：至少保留一个 | 校验 `result.error === '至少保留一个用户'` |
| deleteRole：角色不存在 | 校验 `result.error === '角色不存在'` |
| deleteRole：不存在 vs 最后一个 | 同上语义校验 |
| deleteRole：至少保留一个 | 校验 `result.error === '至少保留一个角色'` |
| ensureMinimumUsers：动态 createdAt | 用 Date.now() 前后夹逼验证 createdAt 为调用时生成 |
| ensureMinimumUsers：复用 MOCK | 校验 username/email/roleIds 与 MOCK_USERS 中 admin 一致 |
| ensureMinimumRoles：动态 createdAt | 同上夹逼验证 |
| ensureMinimumRoles：复用 MOCK | 校验 name/permissions 与 MOCK_ROLES 中 admin 一致 |

## 📊 最终测试结果

```
Test Files  1 passed (1)
Tests      100 passed (100)
Duration    346ms
```