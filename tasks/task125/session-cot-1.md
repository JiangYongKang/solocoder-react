我来帮你实现这个手机验证码登录页面。首先让我了解一下项目结构和现有代码。
        
            
toolName: view_folder
            
status: success
          
c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react
          

        
            
toolName: view_folder
            
status: success
          
c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src
          
让我查看几个关键文件，了解项目的结构和测试框架。

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\package.json
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\App.jsx
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\auth\validators.js
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\auth\validators.test.js
          
让我再查看一个现有页面的结构和 authStorage 的实现。
        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\auth\authStorage.js
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\auth\Login.jsx
          
现在我对项目有了充分了解。让我创建任务列表并开始实现。


        
            
toolName: todo_write
            
status: success
          
Todos updated: 6 items
          
现在开始实现。首先创建工具函数文件。



        
            
toolName: todo_write
            
status: success
          
Todos updated: 6 items
          

        
            
toolName: run_command
            
status: success
          
command: New-Item -ItemType Directory -Force -Path "c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\phone-login", "c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\phone-login" undefined
          
目录创建成功。现在创建工具函数文件。

        
            
toolName: Write
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\phone-login\utils.js
          
changes: undefined
          
工具函数文件创建成功。现在继续创建样式文件和主页面组件。


        
            
toolName: todo_write
            
status: success
          
Todos updated: 6 items
          
现在创建样式文件和主页面组件。


        
            
toolName: Write
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\phone-login\phone-login.css
          
changes: undefined
          
现在创建主页面组件。




        
            
toolName: Write
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\phone-login\index.jsx
          
changes: undefined
          
现在创建单元测试文件并更新 App.jsx。



        
            
toolName: todo_write
            
status: success
          
Todos updated: 6 items
          

        
            
toolName: Write
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\phone-login\utils.test.js
          
changes: undefined
          
测试文件创建完成。现在更新 App.jsx 添加路由和任务卡片。





        
            
toolName: todo_write
            
status: success
          
Todos updated: 6 items
          
现在更新 App.jsx，添加导入、任务卡片和路由。





        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\App.jsx
          
changes: undefined
          
现在添加任务卡片到 TASKS 数组：







        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\App.jsx
          
changes: undefined
          
编辑出现了问题，让我重新读取并修复 App.jsx。








        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\App.jsx
          
让我修复 TASKS 数组的问题，并查看需要添加路由的位置。










        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\App.jsx
          
现在修复 App.jsx。首先修复 TASKS 数组的错误：











        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\App.jsx
          
changes: undefined
          
现在添加路由：










        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\App.jsx
          
changes: undefined
          
App.jsx 更新完成。现在运行测试来验证代码正确性。












        
            
toolName: todo_write
            
status: success
          
Todos updated: 6 items
          
现在运行单元测试：
















        
            
toolName: run_command
            
status: success
          
command: cd c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react ; npx vitest run src/pages/__tests__/phone-login/utils.test.js undefined
          
需要查看其他测试文件如何处理 localStorage。让我检查一下 auth 存储测试：

















        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\auth\authStorage.test.js
          

        
            
toolName: file_search
            
status: success
          
file_pattern: **/vite.config.*
          
明白了，需要使用 `vi.stubGlobal` 来 mock localStorage。让我更新测试文件：



















        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\phone-login\utils.test.js
          
changes: undefined
          
现在替换 localStorage 的测试部分：

























        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\phone-login\utils.test.js
          
changes: undefined
          
现在删除多余的 afterEach 引用。让我检查文件中是否还有：
























        
            
toolName: search_by_regex
            
status: success
          
query: afterEach
          
现在再次运行测试：



























        
            
toolName: run_command
            
status: success
          
command: cd c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react ; npx vitest run src/pages/__tests__/phone-login/utils.test.js undefined
          
所有 49 个测试都通过了！现在运行 lint 检查：


























        
            
toolName: run_command
            
status: success
          
command: cd c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react ; npx eslint src/pages/phone-login/ src/pages/__tests__/phone-login/ undefined
          
需要修复 lint 问题。让我逐一解决：



























        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\phone-login\utils.test.js
          
changes: undefined
          
现在修复 index.jsx 的 lint 问题。使用 useState 惰性初始化来避免在 useEffect 中同步 setState：





























        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\phone-login\index.jsx
          
现在修复 index.jsx 的 lint 问题。使用 useState 惰性初始化和修复 useEffect 依赖：






























        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\phone-login\index.jsx
          
changes: undefined
          
现在查看剩下的 useEffect 和 moveDrag、openSliderModal 的代码：
































        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\phone-login\index.jsx
          
现在修复剩余的 useEffect 依赖警告，把逻辑内联到 useEffect 中：


































        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\phone-login\index.jsx
          
changes: undefined
          
我需要修复 handleEnd 中的 setTimeout 清理逻辑，事件处理器里的 return 不会生效：








































        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\phone-login\index.jsx
          
changes: undefined
          
现在再次运行 lint 检查：



































        
            
toolName: run_command
            
status: success
          
command: cd c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react ; npx eslint src/pages/phone-login/ src/pages/__tests__/phone-login/ undefined
          
lint 检查显示了项目中很多其他文件的错误。让我只检查我们自己的文件：






































        
            
toolName: GetDiagnostics
            
status: success
          
          
我们的 index.jsx 没有诊断错误。让我也检查其他文件：








































        
            
toolName: GetDiagnostics
            
status: success
          
          

        
            
toolName: GetDiagnostics
            
status: success
          
          

        
            
toolName: GetDiagnostics
            
status: success
          
          
所有文件的诊断都没有错误。让我再次运行测试确保一切正常，并完成任务：










































        
            
toolName: run_command
            
status: success
          
command: cd c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react ; npx vitest run src/pages/__tests__/phone-login/utils.test.js undefined
          
所有测试都通过了！现在完成最后的任务标记：




































        
            
toolName: todo_write
            
status: success
          
Todos updated: 6 items
          
手机验证码登录页面已完整实现！以下是实现的内容总结：

## 📁 创建的文件

### 功能实现
- [utils.js](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/phone-login/utils.js) - 纯函数工具库（49个测试全部通过）
- [index.jsx](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/phone-login/index.jsx) - 主页面组件
- [phone-login.css](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/phone-login/phone-login.css) - 页面样式

### 单元测试
- [utils.test.js](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/__tests__/phone-login/utils.test.js) - 49个测试用例全部通过

### 路由配置
- [App.jsx](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/App.jsx) - 已添加 id=88 的任务卡片和 `/phone-login` 路由

## ✨ 实现的功能

1. **手机号输入与格式校验**：中国手机号11位数字校验，实时/失焦/提交三重校验，自动格式化显示（如 `138 0013 8000`）

2. **发送倒计时**：60秒倒计时，按钮置灰，倒计时期间修改手机号自动取消，生成6位随机验证码并打印到控制台

3. **滑块验证码拼图**：Canvas生成随机几何图案背景带缺口，拖动滑块拼图验证，±5px容差判定，失败弹回并随机新缺口位置

4. **协议勾选**：复选框 + 《用户服务协议》《隐私政策》可点击弹窗（含200-500字占位内容），未勾选时登录按钮置灰

5. **模拟验证码校验**：6位数字验证码比对，错误3次锁定30秒倒计时

6. **登录态持久化**：localStorage存储手机号和登录时间，24小时自动过期，页面刷新自动检测，手机号中间4位脱敏显示（`138****8000`），提供退出登录功能

## ✅ 验证结果

- **单元测试**：49个测试全部通过 ✓
- **VS Code 诊断**：所有文件无错误和警告 ✓
- **功能完整度**：全部7个需求点已实现 ✓