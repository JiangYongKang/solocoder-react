我来帮你实现「主题定制系统」页面。首先让我探索一下项目结构，了解现有的代码组织和技术栈。
        
            
toolName: todo_write
            
status: success
          
Todos updated: 8 items
          

        
            
toolName: view_folder
            
status: success
          
c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react
          

        
            
toolName: view_folder
            
status: success
          
c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\package.json
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\App.jsx
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\index.css
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\README.md
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\App.css
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\jsconfig.json
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\main.jsx
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\vite.config.js
          

        
            
toolName: file_search
            
status: success
          
file_pattern: **/vitest*.{js,ts,mjs,cjs}
          

        
            
toolName: file_search
            
status: success
          
file_pattern: **/__tests__/**
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\eslint.config.js
          
现在我对项目有了完整的了解。项目使用 React 19 + Vite + React Router v7 + Vitest，CSS 使用 CSS 变量。让我开始实现：

        
            
toolName: todo_write
            
status: success
          
Todos updated: 8 items
          
让我创建核心逻辑模块和文件结构。首先创建默认配置和工具函数：

        
            
toolName: Write
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\theme-editor\themeConfig.js
          
changes: undefined
          
现在创建核心逻辑工具函数（localStorage 持久化、导入导出、CSS 变量应用等）：


        
            
toolName: Write
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\theme-editor\themeUtils.js
          
changes: undefined
          
现在创建主题状态管理 Hook：




        
            
toolName: Write
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\theme-editor\useThemeEditor.js
          
changes: undefined
          

        
            
toolName: todo_write
            
status: success
          
Todos updated: 8 items
          
现在创建左侧控制面板组件：



        
            
toolName: Write
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\theme-editor\ControlPanel.jsx
          
changes: undefined
          

        
            
toolName: todo_write
            
status: success
          
Todos updated: 8 items
          
现在创建右侧预览区组件：





        
            
toolName: Write
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\theme-editor\PreviewArea.jsx
          
changes: undefined
          
现在创建 CSS 样式文件和主页面组件：





        
            
toolName: todo_write
            
status: success
          
Todos updated: 8 items
          
现在创建主题编辑器的样式文件：






        
            
toolName: Write
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\theme-editor\theme-editor.css
          
changes: undefined
          
现在创建主题编辑器的主页面组件：







        
            
toolName: Write
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\theme-editor\index.jsx
          
changes: undefined
          

        
            
toolName: todo_write
            
status: success
          
Todos updated: 8 items
          
现在修改 App.jsx 和 main.jsx 来注册路由：









        
            
toolName: Write
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\App.jsx
          
changes: undefined
          
现在更新 App.css，给卡片链接添加样式：









        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\App.css
          
changes: undefined
          
Edit 出了问题，让我重新读取文件并修复：










        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\App.css
          
文件被破坏了，让我重写 App.css：










        
            
toolName: Write
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\App.css
          
changes: undefined
          

        
            
toolName: todo_write
            
status: success
          
Todos updated: 8 items
          
现在编写单元测试。先创建测试目录和测试文件：










        
            
toolName: Write
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\theme-editor\themeUtils.test.js
          
changes: undefined
          

        
            
toolName: todo_write
            
status: success
          
Todos updated: 8 items
          
现在运行单元测试和 Lint 检查：










        
            
toolName: run_command
            
status: success
          
command: pnpm test undefined
          
测试显示 localStorage 在 Node 环境下未定义。让我查看是否有 vitest 配置，然后修复环境配置：









        
            
toolName: file_search
            
status: success
          
file_pattern: vitest.config.*
          

        
            
toolName: view_folder
            
status: success
          
c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\tasks
          
让我看看其他已有的测试是如何处理这个问题的：











        
            
toolName: file_search
            
status: success
          
file_pattern: **/*.test.js
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\wizard\validation.test.js
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\wizard\storage.test.js
          
好的，我看到其他测试使用 `vi.stubGlobal` 来 mock localStorage。让我更新测试文件：












        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\theme-editor\themeUtils.test.js
          
changes: undefined
          
现在单独运行我们的测试文件：













        
            
toolName: run_command
            
status: success
          
command: pnpm vitest run src/pages/__tests__/theme-editor/themeUtils.test.js undefined
          
所有 33 个测试都通过了！现在运行 Lint 和构建检查：













        
            
toolName: run_command
            
status: success
          
command: pnpm lint undefined
          
这些 lint 错误都是其他页面的旧代码，与我们新增的代码无关。让我单独检查我们写的文件：















        
            
toolName: run_command
            
status: success
          
command: pnpm eslint src/pages/theme-editor src/pages/__tests__/theme-editor src/App.jsx src/App.css undefined
          
我们写的代码完全没有 Lint 错误！现在运行构建验证编译是否正常：

















        
            
toolName: run_command
            
status: success
          
command: pnpm build undefined
          
构建成功！让我做最后的诊断检查：

















        
            
toolName: GetDiagnostics
            
status: success
          
          

        
            
toolName: todo_write
            
status: success
          
Todos updated: 8 items
          
## 实现完成！「主题定制系统」页面已全部开发完毕。

### 文件结构

**核心页面代码**（`src/pages/theme-editor/`）：
- [index.jsx](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/theme-editor/index.jsx) — 页面主入口，组合控制面板与预览区
- [ControlPanel.jsx](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/theme-editor/ControlPanel.jsx) — 左侧控制面板
- [PreviewArea.jsx](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/theme-editor/PreviewArea.jsx) — 右侧实时预览区
- [themeConfig.js](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/theme-editor/themeConfig.js) — 默认配色方案与常量
- [themeUtils.js](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/theme-editor/themeUtils.js) — 纯函数工具（localStorage、JSON 导入导出、颜色验证、CSS 变量注入）
- [useThemeEditor.js](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/theme-editor/useThemeEditor.js) — 状态管理 Hook
- [theme-editor.css](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/theme-editor/theme-editor.css) — 完整样式与响应式布局

**单元测试**（`src/pages/__tests__/theme-editor/`）：
- [themeUtils.test.js](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/__tests__/theme-editor/themeUtils.test.js) — 33 个测试用例，全部通过

### 功能清单

| 功能 | 说明 |
|------|------|
| **左右双栏布局** | 左侧控制面板，右侧预览区，1440px 桌面端并排，375px 移动端堆叠 |
| **亮/暗色切换** | 一键切换按钮 + 分别选择按钮，切换时自动加载对应预设配色 |
| **颜色编辑器** | 10 种关键颜色（主色、背景、表面、文字、次要文字、边框、强调、成功、警告、错误），每个带颜色拾取器 + HEX 文本输入，修改即时生效 |
| **字体与间距** | 字体大小 12-24px、行高 1-3、段落间距 0-48px，滑块调节 |
| **导出 JSON** | 将全部配置导出为格式化 JSON 文件并触发浏览器下载 |
| **导入 JSON** | 选择本地 JSON 文件，解析校验后应用所有配置项，错误时给出提示 |
| **持久化存储** | 所有配置自动保存到 localStorage，刷新页面后自动恢复 |
| **恢复默认** | 一键重置为初始默认配置 |
| **预览区元素** | 按钮（8 种变体）、输入框/下拉/文本域/单选/复选、4 种提示信息、3 种卡片样式、数据表格（含状态徽章）、排版（H1-H3/段落/引用/代码/链接） |

### 路由集成

在 [App.jsx](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/App.jsx) 中：
- 用 `BrowserRouter` + `Routes` 注册了 `/` 和 `/theme-editor` 两个路由
- 首页第 6 张任务卡片已改为「主题定制系统」，点击可跳转
- 主题编辑器页面顶部有「← 返回首页」链接

### 验证结果

- ✅ **单元测试**：33/33 全部通过
- ✅ **ESLint**：新增代码 0 错误
- ✅ **Vite 构建**：构建成功（226KB JS / 13KB CSS）