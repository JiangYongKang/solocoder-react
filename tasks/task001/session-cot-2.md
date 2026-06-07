我来修复这些边角问题。

        
            
toolName: todo_write
            
status: success
          
Todos updated: 5 items
          
先读取需要修改的文件：

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\auth\ForgotPassword.jsx
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\auth\Login.jsx
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\auth\Register.jsx
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\auth\ChangePassword.jsx
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\auth\index.jsx
          
现在一次性修复所有问题：



        
            
toolName: Write
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\auth\ForgotPassword.jsx
          
changes: undefined
          

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\auth\Login.jsx
          
changes: undefined
          

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\auth\Register.jsx
          
changes: undefined
          

        
            
toolName: Write
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\auth\Register.jsx
          
changes: undefined
          

        
            
toolName: Write
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\auth\ChangePassword.jsx
          
changes: undefined
          

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\auth\index.jsx
          
changes: undefined
          
现在更新 todo 并运行全部测试：




        
            
toolName: todo_write
            
status: success
          
Todos updated: 5 items
          

        
            
toolName: run_command
            
status: success
          
command: pnpm test undefined
          
失败的 2 个测试是 products 模块里的预先存在问题（`filterByStatus is not a function`），和我修改的 auth 代码无关。让我单独运行 auth 测试确认：





        
            
toolName: run_command
            
status: success
          
command: pnpm test src/pages/__tests__/auth undefined
          
✅ auth 模块的 29 个测试全部通过。那 2 个 products 测试失败是预先存在的问题（`filterByStatus is not a function`），与本次修改无关。





        
            
toolName: todo_write
            
status: success
          
Todos updated: 5 items
          
5 个边角问题已全部修复完成：

## 修改内容

### 1. 找回密码流程简化 ([ForgotPassword.jsx](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/auth/ForgotPassword.jsx))
- 删除了 step 3「即将跳转到登录页…」的中间状态屏
- 现在在展示「重置链接已发送」1.5 秒后直接调用 `onBackToLogin()` 切回登录 Tab

### 2. 清理多余的回调参数
- [Login.jsx](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/auth/Login.jsx#L38)：`onLoginSuccess(user)` → `onLoginSuccess()`
- [Register.jsx](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/auth/Register.jsx#L52)：`onRegisterSuccess(user)` → `onRegisterSuccess()`
- 与父组件 [index.jsx](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/auth/index.jsx) 的回调签名保持一致

### 3. 登录态清理逻辑统一 ([ChangePassword.jsx](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/auth/ChangePassword.jsx) + [index.jsx](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/auth/index.jsx#L40-L45))
- ChangePassword 不再自行调用 `clearAuth()`，仅触发回调
- `handlePasswordChanged` 回调统一负责 `clearAuth()` + 状态清理，避免逻辑分散

### 4. 注册表单字段顺序调整 ([Register.jsx](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/auth/Register.jsx#L56-L110))
- 调整为：**邮箱 → 密码 → 确认密码 → 昵称**（原顺序中间插入了昵称）

### 5. 测试结果
✅ auth 模块 **29 个测试全部通过**（其余 2 个 products 测试失败是项目预先存在的问题，与本次修改无关）