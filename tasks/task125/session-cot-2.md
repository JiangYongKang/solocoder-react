我来逐一修复这些问题。首先创建任务列表并读取现有文件。
        
            
toolName: todo_write
            
status: success
          
Todos updated: 6 items
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\phone-login\utils.js
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\phone-login\index.jsx
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\phone-login\utils.test.js
          
好的，现在我逐一修复这些问题。首先更新 utils.js，添加倒计时相关的纯函数。

        
            
toolName: todo_write
            
status: success
          
Todos updated: 6 items
          
先更新 utils.js，添加倒计时相关的纯函数：



        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\phone-login\utils.js
          
changes: undefined
          
现在在 utils.js 末尾添加倒计时纯函数：







        
            
toolName: edit_file_search_replace
            
status: failed
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\phone-login\utils.js
          
          
需要提供更多上下文：









        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\phone-login\utils.js
          

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\phone-login\utils.js
          
changes: undefined
          
utils.js 更新完成。现在重写 index.jsx，修复所有问题：





        
            
toolName: todo_write
            
status: success
          
Todos updated: 6 items
          
现在重写整个 index.jsx 文件：







        
            
toolName: Write
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\phone-login\index.jsx
          
changes: undefined
          
index.jsx 更新完成。现在更新测试文件，添加新增纯函数的单元测试：






        
            
toolName: todo_write
            
status: success
          
Todos updated: 6 items
          
现在更新测试文件，添加新增纯函数的测试：









        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\phone-login\utils.test.js
          
changes: undefined
          
现在在测试文件末尾添加新增纯函数的测试：










        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\phone-login\utils.test.js
          
changes: undefined
          
测试文件更新完成。现在运行测试：











        
            
toolName: todo_write
            
status: success
          
Todos updated: 6 items
          
现在运行测试：











        
            
toolName: run_command
            
status: success
          
command: cd c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react ; npx vitest run src/pages/__tests__/phone-login/utils.test.js undefined
          
全部 75 个测试通过！现在检查 VS Code 诊断：














        
            
toolName: GetDiagnostics
            
status: success
          
          

        
            
toolName: GetDiagnostics
            
status: success
          
          

        
            
toolName: GetDiagnostics
            
status: success
          
          
所有文件诊断无错误！任务完成！
















        
            
toolName: todo_write
            
status: success
          
Todos updated: 6 items
          
所有问题已全部修复完成！以下是修复总结：

## ✅ 问题 5 个问题全部修复并验证通过

---

### 1️⃣ **修复 1：倒计时按钮文案三态区分

**文件修改**：
- [utils.js](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/phone-login/utils.js#L216-L224) 新增 `getCountdownButtonText(countdown, hasRequestedBefore)` 纯函数
- [index.jsx](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/phone-login/index.jsx#L133) 新增 `hasRequestedBefore` state
- [index.jsx](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/phone-login/index.jsx#L338) 验证码成功时 `setHasRequestedBefore(true)
- [index.jsx](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/phone-login/index.jsx#L492) 按钮使用 `getCountdownButtonText`

**按钮文案逻辑**：
- `countdown > 0` → `"XX 秒后重新发送`
- `countdown === 0 && hasRequestedBefore === false` → `"获取验证码"`
- `countdown === 0 && hasRequestedBefore === true` → `"重新获取验证码"`

---

### 2️⃣ **修复 2：滑块验证 setTimeout 竞态漏洞

**文件修改**：[index.jsx](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/phone-login/index.jsx#L151-L178)

- 新增 5 个 ref：`countdownRef`、`lockCountdownRef`、`sliderSuccessTimerRef`、`sliderFailTimerRef`、`drawCaptchaTimerRef`
- 新增 `clearAllTimers` 统一清理函数，组件卸载时自动调用
- 新增 `closeSliderModal` 函数，关闭弹窗时先清理 `sliderSuccessTimerRef/sliderFailTimerRef
- 滑块成功/失败的 `setTimeout` 执行时先检查并清理已有定时器
- 关闭按钮 × 和 点击遮罩层 都改为调用 `closeSliderModal`

---

### 3️⃣ **修复 3：登录态初始化 SPA 重挂载问题

**文件修改**：[index.jsx](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/phone-login/index.jsx#L110-L124)

- 移除模块级 `getInitialLoginState()` 函数调用
- 新增 `initRef = useRef(false)`
- 在 `useEffect` 中使用 `initRef` 守卫：`if (!initRef.current)` 做一次性初始化
- 保证组件每次通过 SPA 导航重挂载都会重新读取 localStorage，反映最新状态

---

### 4️⃣ **修复 4：倒计时逻辑提炼为纯函数

**文件修改**：[utils.js](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/phone-login/utils.js#L213-L261)

新增纯函数：
- `SMS_COUNTDOWN_SECONDS` / `ERROR_LOCK_SECONDS` - 常量
- `getCountdownButtonText` - 按钮文案三态判定
- `getNextCountdownValue` - 倒计时递减
- `isCountdownActive` - 倒计时激活判定
- `canRequestCode` - 是否可以请求验证码
- `getLockButtonText` - 锁定按钮文案
- `getNextLockValue` - 锁定递减
- `isLocked` - 锁定判定
- `shouldTriggerLock` - 错误次数触发锁定判定

---

### 5️⃣ **修复 5：单元测试覆盖**

**文件修改**：[utils.test.js](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/__tests__/phone-login/utils.test.js#L375-L514)

新增 27 个测试用例，覆盖：
- 常量检查（2 个）
- `getCountdownButtonText`（4 个 - 覆盖三种状态及优先级
- `getNextCountdownValue`（3 个）
- `isCountdownActive`（3 个）
- `canRequestCode`（4 个）
- `getLockButtonText`（2 个）
- `getNextLockValue`（3 个）
- `isLocked`（3 个）
- `shouldTriggerLock`（2 个）

---

## ✅ 验证结果

- **单元测试**：75 个测试全部通过 ✓
- **VS Code 诊断**：所有文件 0 错误 0 警告 ✓