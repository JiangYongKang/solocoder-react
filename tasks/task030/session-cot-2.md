我来逐一修复这些问题。首先创建任务列表：

        
            
toolName: todo_write
            
status: success
          
Todos updated: 5 items
          
让我先查看当前相关文件的内容：



        
            
toolName: todo_write
            
status: success
          
Todos updated: 5 items
          
让我先读取相关文件：





        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\pomodoro\pomodoroUtils.js
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\pomodoro\index.jsx
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\pomodoro\constants.js
          
好的，让我开始修复这些问题。首先修复问题1：addRecord 函数的防御性检查，同时添加运行时状态持久化的工具函数。

先更新 constants.js 添加新的 storage key：





        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\pomodoro\constants.js
          
changes: undefined
          
现在修复 pomodoroUtils.js 中的 addRecord 函数并添加运行时状态持久化函数：









        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\pomodoro\pomodoroUtils.js
          
changes: undefined
          
现在修复 addRecord 函数：















        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\pomodoro\pomodoroUtils.js
          
changes: undefined
          
现在添加运行时状态持久化函数。让我先读取 pomodoroUtils.js 末尾，然后添加新函数：


















        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\pomodoro\pomodoroUtils.js
          
现在在文件末尾添加运行时状态持久化函数：

















        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\pomodoro\pomodoroUtils.js
          
changes: undefined
          
好的，问题1修复完成。现在让我修复问题2和3 - 重构 index.jsx，将副作用从 setState updater 移到 useEffect，并添加运行时状态持久化：













        
            
toolName: todo_write
            
status: success
          
Todos updated: 5 items
          
现在重构 index.jsx，主要改动：
1. 导入新工具函数
2. 初始化恢复持久化状态
3. 将副作用从 setState updater 移到 useEffect
4. 运行时状态变化时保存到 localStorage

















        
            
toolName: Write
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\pomodoro\index.jsx
          
changes: undefined
          
好的，问题2和3已修复。现在让我补充单元测试：


















        
            
toolName: todo_write
            
status: success
          
Todos updated: 5 items
          
让我先读取现有的测试文件，然后添加新测试：
























        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\pomodoro\pomodoroUtils.test.js
          
现在更新测试文件，添加缺失的测试：

























        
            
toolName: Write
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\pomodoro\pomodoroUtils.test.js
          
changes: undefined
          
现在运行测试验证所有修复：
























        
            
toolName: todo_write
            
status: success
          
Todos updated: 5 items
          

        
            
toolName: run_command
            
status: success
          
command: pnpm test -- src/pages/__tests__/pomodoro/pomodoroUtils.test.js undefined
          
有两个测试需要修复。让我先修复 `loadTimerState` 的逻辑，然后修复 AudioContext mock：

















        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\pomodoro\pomodoroUtils.js
          
changes: undefined
          
现在修复 AudioContext 的测试：



















        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\pomodoro\pomodoroUtils.test.js
          
changes: undefined
          
现在重新运行测试：

























        
            
toolName: run_command
            
status: success
          
command: pnpm test -- src/pages/__tests__/pomodoro/pomodoroUtils.test.js undefined
          
所有 83 个测试全部通过！现在运行构建确保项目编译正常：




























        
            
toolName: run_command
            
status: success
          
command: pnpm build undefined
          
构建成功！所有修复完成。让我完成最后的任务：


























        
            
toolName: todo_write
            
status: success
          
Todos updated: 5 items
          
所有问题已成功修复！以下是修复内容的总结：

## ✅ 修复内容

### 1. addRecord 函数防御性检查（[pomodoroUtils.js](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/pomodoro/pomodoroUtils.js#L169-L177)）
- 当 `records` 为 `undefined`/`null`/非数组时，不再抛出 TypeError
- 返回安全的空数组或只包含新记录的数组

### 2. 副作用从 setState updater 移出（[index.jsx](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/pomodoro/index.jsx#L166-L176)）
- 新增 `phaseCompletedRef` ref 防止重复触发
- 倒计时归零的副作用（播放蜂鸣、发送通知、切换阶段）全部移到独立的 `useEffect` 中监听 `remainingSeconds === 0` 触发
- `setInterval` 内的 `setRemainingSeconds` updater 只做纯状态计算（递减到 0），不再包含任何副作用
- 符合 React 18 严格模式规范，避免 updater 被执行两次导致提示音/通知重复

### 3. 运行时状态持久化
- 新增常量：[constants.js](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/pomodoro/constants.js#L36) 中添加 `STORAGE_KEY_TIMER_STATE`
- 新增工具函数：
  - [saveTimerState](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/pomodoro/pomodoroUtils.js#L301-L316) - 保存当前阶段、剩余秒数、总秒数、已完成番茄数、当前任务
  - [loadTimerState](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/pomodoro/pomodoroUtils.js#L318-L343) - 加载并验证持久化状态，对异常值做范围限制
  - [clearTimerState](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/pomodoro/pomodoroUtils.js#L345-L352) - 清除持久化状态
- 页面初始化时从 localStorage 恢复状态（[index.jsx](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/pomodoro/index.jsx#L43-L64)）
- 运行时状态变化时自动保存（[index.jsx](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/pomodoro/index.jsx#L108-L116)）

### 4. 补充单元测试（[pomodoroUtils.test.js](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/__tests__/pomodoro/pomodoroUtils.test.js)）
新增 **34 个** 测试用例，覆盖：
- **updateDocumentTitle**：document 不存在、剩余秒数>0、剩余秒数=0 三种场景
- **resetDocumentTitle**：document 不存在、正常重置标题
- **requestNotificationPermission**：不支持、已授权、已拒绝、用户授权、用户拒绝、抛错 6 种场景
- **sendNotification**：不支持、未授权、已授权成功、构造抛错 4 种场景
- **playBeep**：AudioContext 不存在、成功播放、构造抛错 3 种场景
- **addRecord**：新增 4 个防御性边界场景测试
- **saveTimerState/loadTimerState/clearTimerState**：14 个场景，涵盖正常读写、空值、损坏数据、无效阶段、越界数值、异常类型、存储异常等

## 📊 验证结果
- **单元测试**：83/83 全部通过 ✅
- **生产构建**：`pnpm build` 成功 ✅
- **响应式布局**：已在 CSS 中实现 375px ~ 1440px 的响应式适配