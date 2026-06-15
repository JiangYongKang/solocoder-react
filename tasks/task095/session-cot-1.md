我来帮你实现这个事件调试器页面。首先让我了解一下项目结构和现有代码风格。
        
            
toolName: todo_write
            
status: success
          
Todos updated: 8 items
          

        
            
toolName: view_folder
            
status: success
          
c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react
          

        
            
toolName: view_folder
            
status: success
          
c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src
          

        
            
toolName: file_search
            
status: success
          
file_pattern: src/pages/**/*
          
让我查看几个现有页面来了解代码风格和项目约定。

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\api-debugger\index.jsx
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\api-debugger\apiDebuggerUtils.js
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\api-debugger\apiDebuggerUtils.test.js
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\package.json
          
让我再看一下 App.jsx 和一个 CSS 文件来了解路由和样式约定。

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\App.jsx
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\api-debugger\api-debugger.css
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\jsconfig.json
          
现在我对项目结构有了清晰的了解。让我更新任务计划并开始实现。


        
            
toolName: todo_write
            
status: success
          
Todos updated: 9 items
          
首先创建目录和核心逻辑模块。


        
            
toolName: run_command
            
status: success
          
command: New-Item -ItemType Directory -Force -Path "c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\event-debugger" undefined
          
现在创建核心逻辑模块 `eventDebuggerUtils.js`：



        
            
toolName: Write
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\event-debugger\eventDebuggerUtils.js
          
changes: undefined
          

        
            
toolName: todo_write
            
status: success
          
Todos updated: 9 items
          
现在创建按键事件捕获组件：




        
            
toolName: Write
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\event-debugger\KeyCapturePanel.jsx
          
changes: undefined
          

        
            
toolName: todo_write
            
status: success
          
Todos updated: 9 items
          
现在创建鼠标事件捕获组件：





        
            
toolName: Write
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\event-debugger\MouseCapturePanel.jsx
          
changes: undefined
          

        
            
toolName: todo_write
            
status: success
          
Todos updated: 9 items
          
现在创建频率波形图组件：







        
            
toolName: Write
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\event-debugger\FrequencyChart.jsx
          
changes: undefined
          

        
            
toolName: todo_write
            
status: success
          
Todos updated: 9 items
          
现在创建主页面组件和样式文件：









        
            
toolName: Write
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\event-debugger\index.jsx
          
changes: undefined
          
现在创建样式文件：
















        
            
toolName: Write
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\event-debugger\event-debugger.css
          
changes: undefined
          
现在在 App.jsx 中添加路由：





        
            
toolName: todo_write
            
status: success
          
Todos updated: 9 items
          

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\App.jsx
          
changes: undefined
          
我看到还有一些其他页面的导入。让我找到添加路由的位置：





        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\App.jsx
          

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\App.jsx
          
changes: undefined
          

        
            
toolName: todo_write
            
status: success
          
Todos updated: 9 items
          
现在创建测试目录和单元测试文件：









        
            
toolName: run_command
            
status: success
          
command: New-Item -ItemType Directory -Force -Path "c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\event-debugger" undefined
          
现在创建单元测试文件：



















        
            
toolName: Write
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\event-debugger\eventDebuggerUtils.test.js
          
changes: undefined
          

        
            
toolName: todo_write
            
status: success
          
Todos updated: 9 items
          
现在运行测试来验证代码：















        
            
toolName: run_command
            
status: success
          
command: pnpm test -- src/pages/__tests__/event-debugger/eventDebuggerUtils.test.js undefined
          
测试全部通过了！让我再运行一下 lint 检查确保代码符合规范：







        
            
toolName: run_command
            
status: success
          
command: pnpm lint -- src/pages/event-debugger/ src/pages/__tests__/event-debugger/ undefined
          
lint 报错很多但看起来是其他文件的问题。让我只检查我们创建的文件：










        
            
toolName: run_command
            
status: success
          
command: npx eslint src/pages/event-debugger/eventDebuggerUtils.js src/pages/event-debugger/KeyCapturePanel.jsx src/pages/event-debugger/MouseCapturePanel.jsx src/pages/event-debugger/FrequencyChart.jsx src/pages/event-debugger/index.jsx undefined
          
有一个未使用的导入，让我修复一下：










        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\event-debugger\MouseCapturePanel.jsx
          

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\event-debugger\MouseCapturePanel.jsx
          
changes: undefined
          
现在再检查一下 lint：












        
            
toolName: run_command
            
status: success
          
command: npx eslint src/pages/event-debugger/eventDebuggerUtils.js src/pages/event-debugger/KeyCapturePanel.jsx src/pages/event-debugger/MouseCapturePanel.jsx src/pages/event-debugger/FrequencyChart.jsx src/pages/event-debugger/index.jsx undefined
          
lint 全部通过！让我也检查一下测试文件：
















        
            
toolName: run_command
            
status: success
          
command: npx eslint src/pages/__tests__/event-debugger/eventDebuggerUtils.test.js undefined
          
修复测试文件中未使用的导入：











        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\event-debugger\eventDebuggerUtils.test.js
          

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\event-debugger\eventDebuggerUtils.test.js
          
changes: undefined
          
现在让我再运行一次测试和 lint 确认一切正常：













        
            
toolName: run_command
            
status: success
          
command: npx eslint src/pages/__tests__/event-debugger/eventDebuggerUtils.test.js ; pnpm test -- src/pages/__tests__/event-debugger/eventDebuggerUtils.test.js undefined
          
看起来命令在 PowerShell 中执行方式不对。让我分别运行：

















        
            
toolName: run_command
            
status: success
          
command: npx eslint src/pages/__tests__/event-debugger/eventDebuggerUtils.test.js undefined
          

        
            
toolName: run_command
            
status: success
          
command: pnpm test -- src/pages/__tests__/event-debugger/eventDebuggerUtils.test.js undefined
          

        
            
toolName: run_command
            
status: success
          
command: pnpm vitest run src/pages/__tests__/event-debugger/eventDebuggerUtils.test.js undefined
          
所有测试都通过了！让我更新任务列表：









        
            
toolName: todo_write
            
status: success
          
Todos updated: 9 items
          
事件调试器页面已全部实现完成！以下是创建的文件和功能概览：

## 项目文件结构

### 页面代码 (`src/pages/event-debugger/`)
- [eventDebuggerUtils.js](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/event-debugger/eventDebuggerUtils.js) — 核心纯函数逻辑模块
- [KeyCapturePanel.jsx](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/event-debugger/KeyCapturePanel.jsx) — 按键事件捕获组件
- [MouseCapturePanel.jsx](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/event-debugger/MouseCapturePanel.jsx) — 鼠标事件捕获组件
- [FrequencyChart.jsx](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/event-debugger/FrequencyChart.jsx) — Canvas 频率波形图组件
- [index.jsx](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/event-debugger/index.jsx) — 主页面组件
- [event-debugger.css](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/event-debugger/event-debugger.css) — 样式文件

### 测试代码 (`src/pages/__tests__/event-debugger/`)
- [eventDebuggerUtils.test.js](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/__tests__/event-debugger/eventDebuggerUtils.test.js) — 54 个单元测试全部通过

## 功能实现

1. **按键事件实时捕获** — 点击捕获区域获得焦点后监听 keydown，显示序号、键名、键码、修饰键标签（Ctrl/Shift/Alt/Meta 彩色标记）、毫秒级时间戳，新条目高亮动画，焦点状态有视觉提示

2. **鼠标事件日志** — 监听 click/dblclick/mousedown/mouseup/mousemove/contextmenu，事件类型彩色标签区分，显示坐标和按钮，mousemove 100ms 节流，右键阻止默认菜单

3. **过滤搜索** — 按键支持键名过滤、修饰键多选过滤、关键字搜索；鼠标支持事件类型多选过滤、关键字搜索；过滤后序号重新编号，支持一键重置

4. **清空与导出** — 独立的清空（带确认弹窗）和 JSON 导出功能，按键和鼠标日志分别独立导出

5. **触发频率波形图** — Canvas 绘制的实时滚动波形图，展示最近 30 秒事件频率，按键蓝色、鼠标红色，带坐标轴刻度和图例

6. **数据仅在会话内维护** — 全部状态使用 React useState 管理，无 localStorage 持久化

页面路由已添加到 [App.jsx](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/App.jsx#L265-L265)，访问路径为 `/event-debugger`。