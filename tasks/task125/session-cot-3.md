toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\phone-login\index.jsx
          
问题清晰，需要修复两处。先看一下 utils.js 中的相关函数：
        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\phone-login\utils.js
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\phone-login\utils.test.js
          
现在执行修复。先在 utils.js 中添加纯函数 `shouldResetOnPhoneChange`，然后修复 index.jsx，最后补充测试。
        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\phone-login\utils.js
          
changes: undefined
          
现在修复 index.jsx 中的 `handlePhoneChange`，重置 `hasRequestedBefore` 并使用纯函数：
        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\phone-login\index.jsx
          

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\phone-login\index.jsx
          
changes: undefined
          
现在修复 `handlePhoneChange` 中的重置逻辑：
        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\phone-login\index.jsx
          
changes: undefined
          
现在更新测试文件，添加 import 和新的测试用例：
        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\phone-login\utils.test.js
          
changes: undefined
          
现在在 `isCountdownActive` 测试块后面添加 `shouldResetOnPhoneChange` 的测试：
        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\phone-login\utils.test.js
          

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\phone-login\utils.test.js
          
changes: undefined
          
现在运行测试验证：
        
            
toolName: run_command
            
status: success
          
command: cd c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react ; npx vitest run src/pages/__tests__/phone-login/utils.test.js undefined
          
79 个测试全部通过。再检查诊断：
        
            
toolName: GetDiagnostics
            
status: success
          
          
修复完成，总结如下：

## ✅ 修复内容

### 问题：更换手机号后 `hasRequestedBefore` 未重置

**根因**：[handlePhoneChange](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/phone-login/index.jsx#L234-L241) 中倒计时重置时只调用了 `setCountdown(0)`，没有同步重置 `hasRequestedBefore`，导致按钮文案对新号码仍显示"重新获取验证码"。

**修复**：

1. **[utils.js](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/phone-login/utils.js#L237-L239)** — 新增纯函数 `shouldResetOnPhoneChange(oldPhone, newPhone, countdown)`，封装"倒计时中且手机号变更"的判定逻辑：

```js
export function shouldResetOnPhoneChange(oldPhone, newPhone, countdown) {
  return isCountdownActive(countdown) && oldPhone !== newPhone
}
```

2. **[index.jsx](file:///c:/Users/vince/GoletaLab\SoloCoder-3\solocoder-react\src\pages\phone-login\index.jsx#L234-L236)** — `handlePhoneChange` 中使用 `shouldResetOnPhoneChange` 替代内联条件，并在重置倒计时的同时重置 `hasRequestedBefore`：

```js
if (shouldResetOnPhoneChange(rawPhone, digits, countdown)) {
  setCountdown(0)
  setHasRequestedBefore(false)  // ← 新增：同步重置
  ...
}
```

3. **[utils.test.js](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/__tests__/phone-login/utils.test.js#L440-L460)** — 新增 4 个测试用例覆盖 `shouldResetOnPhoneChange`：
   - 倒计时中手机号变更 → `true`
   - 倒计时中手机号未变更 → `false`
   - 不在倒计时中手机号变更 → `false`
   - 不在倒计时中手机号未变更 → `false`

**测试结果**：79 个测试全部通过 ✓，VS Code 诊断无错误 ✓