我来帮你实现这个「表单构建器」页面。首先让我了解一下项目的现有结构。
        
            
toolName: todo_write
            
status: success
          
Todos updated: 12 items
          

        
            
toolName: view_folder
            
status: success
          
c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react
          

        
            
toolName: view_folder
            
status: success
          
c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\App.jsx
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\main.jsx
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\index.css
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\App.css
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\package.json
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\jsconfig.json
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\vite.config.js
          
现在我对项目结构有了清晰的了解。项目使用 React 19 + Vite，已安装 react-router-dom 和 vitest。让我开始实现表单构建器。

        
            
toolName: todo_write
            
status: success
          
Todos updated: 12 items
          
现在我开始创建核心逻辑模块和目录结构。


        
            
toolName: run_command
            
status: success
          
command: mkdir -p src/pages/form-builder src/pages/__tests__/form-builder undefined
          

        
            
toolName: run_command
            
status: success
          
command: New-Item -ItemType Directory -Force -Path "src/pages/form-builder", "src/pages/__tests__/form-builder" undefined
          
目录已创建。现在创建核心逻辑模块：

        
            
toolName: Write
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\form-builder\formBuilderCore.js
          
changes: undefined
          

        
            
toolName: todo_write
            
status: success
          
Todos updated: 12 items
          
现在创建各个React组件。让我并行创建左侧面板、画布中的表单字段组件、属性面板、画布组件和主页面组件：


        
            
toolName: Write
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\form-builder\FieldPanel.jsx
          
changes: undefined
          

        
            
toolName: Write
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\form-builder\FormField.jsx
          
changes: undefined
          

        
            
toolName: Write
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\form-builder\PropertyPanel.jsx
          
changes: undefined
          

        
            
toolName: Write
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\form-builder\FormCanvas.jsx
          
changes: undefined
          
现在创建主页面组件、CSS 和测试：



        
            
toolName: Write
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\form-builder\FormBuilder.jsx
          
changes: undefined
          

        
            
toolName: Write
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\form-builder\form-builder.css
          
changes: undefined
          
现在让我更新 todo 并创建单元测试和更新 App.jsx：





        
            
toolName: todo_write
            
status: success
          
Todos updated: 12 items
          

        
            
toolName: Write
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\form-builder\formBuilderCore.test.js
          
changes: undefined
          
现在更新 App.jsx，添加路由和首页卡片跳转：





        
            
toolName: todo_write
            
status: success
          
Todos updated: 12 items
          

        
            
toolName: Write
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\App.jsx
          
changes: undefined
          
现在更新 App.css，添加 Link 样式和表单构建器的全宽支持：




        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\App.css
          
changes: undefined
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\App.css
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\App.css
          
我看到 `.task` 类已经包含了链接样式。现在让我检查并修复 `index.css` 中 `#root` 的固定宽度问题，以确保表单构建器页面能使用全宽：

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\index.css
          
`#root` 已经设置了 `width: 100%` 和 `max-width: 1126px`，这对响应式布局是合适的。现在让我运行测试来验证：



        
            
toolName: todo_write
            
status: success
          
Todos updated: 12 items
          

        
            
toolName: run_command
            
status: success
          
command: npm test undefined
          
我看到有 2 个测试失败 - 是因为 vitest 在 Node 环境中运行，没有 localStorage。其他文件的失败是项目中已存在的问题。让我修复我的测试文件，为 localStorage 添加 mock：


        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\form-builder\formBuilderCore.test.js
          

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\form-builder\formBuilderCore.test.js
          
changes: undefined
          
现在让我只运行我的测试文件验证：






        
            
toolName: run_command
            
status: success
          
command: npx vitest run src/pages/__tests__/form-builder/formBuilderCore.test.js undefined
          
所有 52 个测试都通过了！现在让我验证项目能够正常构建：






        
            
toolName: run_command
            
status: success
          
command: npm run build undefined
          
构建成功！现在让我也运行 lint 检查：









        
            
toolName: run_command
            
status: success
          
command: npm run lint undefined
          
大多数 lint 错误是项目其他文件的已有问题。我需要修复我的代码中两个问题：
1. FormBuilder.jsx 中 useEffect 内同步调用 setState
2. FormField.jsx 中 case 块内的词法声明

让我修复这两个问题：









        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\form-builder\FormBuilder.jsx
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\form-builder\FormField.jsx
          
现在修复这两个 lint 问题：










        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\form-builder\FormBuilder.jsx
          
changes: undefined
          

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\form-builder\FormField.jsx
          
changes: undefined
          
现在再次验证我的文件的 lint 和构建：












        
            
toolName: run_command
            
status: success
          
command: npx eslint src/pages/form-builder/ src/pages/__tests__/form-builder/ undefined
          
我的代码 lint 没有错误了。让我再运行完整的构建和测试验证：










        
            
toolName: run_command
            
status: success
          
command: npm run build ; npx vitest run src/pages/__tests__/form-builder/formBuilderCore.test.js undefined
          
构建成功，所有 52 个测试通过！让我标记任务完成：
















        
            
toolName: todo_write
            
status: success
          
Todos updated: 12 items
          
「表单构建器」页面已全部实现完成！以下是实现概览：

## 📁 项目文件结构

**核心逻辑（纯 JS 函数，可测试）：**
- [formBuilderCore.js](file:///C:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/form-builder/formBuilderCore.js) - 字段类型定义、CRUD、localStorage 持久化、JSON Schema 导出、选项操作

**React 组件：**
- [FormBuilder.jsx](file:///C:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/form-builder/FormBuilder.jsx) - 主页面容器，状态管理和顶层布局
- [FieldPanel.jsx](file:///C:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/form-builder/FieldPanel.jsx) - 左侧 8 种字段类型拖拽面板
- [FormCanvas.jsx](file:///C:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/form-builder/FormCanvas.jsx) - 中间画布区，支持拖放添加/排序、选中、删除
- [FormField.jsx](file:///C:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/form-builder/FormField.jsx) - 单个表单字段的设计态和预览态渲染
- [PropertyPanel.jsx](file:///C:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/form-builder/PropertyPanel.jsx) - 右侧属性配置面板
- [form-builder.css](file:///C:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/form-builder/form-builder.css) - 完整样式和响应式断点

**单元测试：**
- [formBuilderCore.test.js](file:///C:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/__tests__/form-builder/formBuilderCore.test.js) - 52 个测试用例全部通过 ✅

**路由注册：**
- [App.jsx](file:///C:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/App.jsx) - 首页添加了「表单构建器」卡片（id:7），点击跳转至 `/form-builder`

## ✨ 功能清单

| 需求 | 实现 |
|------|------|
| 左侧字段面板 | 8 种字段：单行文本、多行文本、下拉、单选、多选、日期、数字、开关 |
| 拖拽添加字段 | HTML5 原生 Drag & Drop API，从面板拖到画布即可添加 |
| 画布字段排序 | 画布内字段互相拖拽即可调整顺序 |
| 字段删除 | 每个字段右上角有删除按钮 ✕ |
| 属性面板 | 点击字段后右侧显示：标签、必填、占位符；下拉/单选/多选可编辑选项列表；数字可设最大最小值 |
| 预览模式 | 顶部「👁 预览」按钮切换，画布变成真实可交互表单 |
| JSON Schema 导出 | 顶部「⬇ 导出 JSON」按钮，按 JSON Schema 规范生成并触发浏览器下载 |
| localStorage 持久化 | 字段变动自动保存，刷新页面不丢失 |
| 响应式布局 | 桌面(≥1440px)三栏 260/1fr/320；平板三栏 200/1fr/240；移动端(≤768px)单栏堆叠 |

## ✅ 验证结果

- **测试**：`52 passed (52)` 全部通过
- **构建**：`vite build` 成功（226KB JS, 13KB CSS）
- **Lint**：新增文件 0 错误