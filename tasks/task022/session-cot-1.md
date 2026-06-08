我来帮你实现文本差异对比工具。首先让我探索一下当前项目的结构，了解代码组织方式。
        
            
toolName: view_folder
            
status: success
          
c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\package.json
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\App.jsx
          
让我再看看一些现有页面的代码风格和测试文件结构，以便保持一致。

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\rich-editor\index.jsx
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\rich-editor\editorUtils.js
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\rich-editor\editorUtils.test.js
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\App.css
          
让我再看一下CSS样式文件。</think_never_used_51bce0c785ca2f68081bfa7d91973934>让我再看一下一个页面的CSS样式，了解项目的样式规范。
        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\rich-editor\rich-editor.css
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\index.css
          
现在我已经了解了项目结构，让我开始创建这个文本差异对比工具。我会按照需求逐步实现。

        
            
toolName: todo_write
            
status: success
          
Todos updated: 6 items
          
现在开始创建核心的 diff 工具函数：


        
            
toolName: Write
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\text-diff\diffUtils.js
          
changes: undefined
          
让我先修复 extractChangeBlocks 函数中的一个逻辑错误：



        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\text-diff\diffUtils.js
          
changes: undefined
          

        
            
toolName: todo_write
            
status: success
          
Todos updated: 6 items
          
现在创建样式文件：





        
            
toolName: Write
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\text-diff\text-diff.css
          
changes: undefined
          

        
            
toolName: todo_write
            
status: success
          
Todos updated: 6 items
          
现在创建主页面组件：







        
            
toolName: Write
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\text-diff\index.jsx
          
changes: undefined
          
现在我注意到左右分栏视图下同步滚动需要两个独立的滚动容器，让我修复一下这个问题，同时先更新任务列表，然后继续创建测试文件：


        
            
toolName: todo_write
            
status: success
          
Todos updated: 6 items
          
实际上在左右对比视图中，我们使用的是单个网格布局容器，滚动本身就是同步的。让我简化一下同步滚动逻辑，然后创建测试文件：



        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\text-diff\index.jsx
          
changes: undefined
          

        
            
toolName: edit_file_search_replace
            
status: failed
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\text-diff\index.jsx
          
          
让我重新读取文件内容：





        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\text-diff\index.jsx
          

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\text-diff\index.jsx
          
changes: undefined
          

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\text-diff\index.jsx
          
changes: undefined
          
现在让我检查文件中还有哪些地方引用了旧的 ref，并更新 diffContentRef：






        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\text-diff\index.jsx
          

        
            
toolName: search_by_regex
            
status: failed
          
query: (leftPaneRef|rightPaneRef|diffContentRef|onScroll.*handleScrollSync
          

        
            
toolName: search_by_regex
            
status: success
          
query: leftPaneRef|rightPaneRef|diffContentRef|handleScrollSync
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\text-diff\index.jsx
          

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\text-diff\index.jsx
          
changes: undefined
          

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\text-diff\index.jsx
          
changes: undefined
          

        
            
toolName: todo_write
            
status: success
          
Todos updated: 6 items
          
现在创建单元测试文件：





        
            
toolName: Write
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\text-diff\diffUtils.test.js
          
changes: undefined
          
现在更新任务列表并在 App.jsx 中注册路由：






        
            
toolName: todo_write
            
status: success
          
Todos updated: 6 items
          

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\App.jsx
          
changes: undefined
          
让我重新读取完整的 App.jsx 文件，看看实际内容：








        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\App.jsx
          
我看到 App.jsx 有一些语法问题，让我先检查哪些页面存在：








        
            
toolName: file_search
            
status: success
          
file_pattern: src/pages/*/index.jsx
          

        
            
toolName: file_search
            
status: success
          
file_pattern: src/pages/*/*.jsx
          
我看到 App.jsx 有语法问题，让我修复它并正确添加 text-diff 页面的路由和任务卡片：








        
            
toolName: Write
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\App.jsx
          
changes: undefined
          

        
            
toolName: todo_write
            
status: success
          
Todos updated: 6 items
          
现在运行测试来验证代码：







        
            
toolName: run_command
            
status: success
          
command: cd c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react ; npm run test -- src/pages/__tests__/text-diff/diffUtils.test.js undefined
          
发现一个语法错误，在 computeCharDiff 函数中少了一个 `]`，让我修复：







        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\text-diff\diffUtils.js
          
changes: undefined
          
现在再次运行测试：









        
            
toolName: run_command
            
status: success
          
command: cd c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react ; npm run test -- src/pages/__tests__/text-diff/diffUtils.test.js undefined
          
让我读取该文件检查具体的语法问题：








        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\text-diff\diffUtils.js
          
我看到了问题，第 114 行多了一个 `}]`。让我修复：










        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\text-diff\diffUtils.js
          
changes: undefined
          
现在再次运行测试：











        
            
toolName: run_command
            
status: success
          
command: cd c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react ; npm run test -- src/pages/__tests__/text-diff/diffUtils.test.js undefined
          
所有 52 个测试都通过了！现在让我运行 lint 检查：










        
            
toolName: run_command
            
status: success
          
command: cd c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react ; npm run lint undefined
          
Lint 检查有很多错误，但这些都是其他页面的问题。让我专门检查我们 text-diff 相关的文件：









        
            
toolName: search_by_regex
            
status: success
          
query: text-diff
          
让我专门针对 text-diff 相关文件运行 lint：










        
            
toolName: run_command
            
status: success
          
command: cd c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react ; npx eslint src/pages/text-diff/ src/pages/__tests__/text-diff/ undefined
          
让我修复测试文件中的 lint 错误。先看看其他测试文件如何处理这些问题：









        
            
toolName: search_by_regex
            
status: success
          
query: FileReader|global\.
          
我看到其他测试文件也使用 `global`，这是 eslint 配置的问题。让我先移除未使用的 `beforeEach` 导入：











        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\text-diff\diffUtils.test.js
          
changes: undefined
          
现在把 `global.` 替换为 `globalThis.` 以解决 no-undef 错误：













        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\text-diff\diffUtils.test.js
          
changes: undefined
          
现在再次验证 lint 和测试：











        
            
toolName: run_command
            
status: success
          
command: cd c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react ; npx eslint src/pages/text-diff/ src/pages/__tests__/text-diff/ undefined
          
完美！Lint 检查通过了，让我再次运行测试确保一切正常：

















        
            
toolName: run_command
            
status: success
          
command: cd c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react ; npm run test -- src/pages/__tests__/text-diff/diffUtils.test.js undefined
          
所有测试通过且 lint 检查无错误！让我最后确认一下所有文件：

















        
            
toolName: view_folder
            
status: success
          
c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\text-diff
          

        
            
toolName: view_folder
            
status: success
          
c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\text-diff
          

        
            
toolName: todo_write
            
status: success
          
Todos updated: 6 items
          
文本差异对比工具已实现完成！以下是实现的功能总结：

## 📁 创建的文件

### 核心代码
- [diffUtils.js](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/text-diff/diffUtils.js) - 纯 JS diff 算法工具函数
- [index.jsx](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/text-diff/index.jsx) - 页面主组件
- [text-diff.css](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/text-diff/text-diff.css) - 页面样式

### 测试代码
- [diffUtils.test.js](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/__tests__/text-diff/diffUtils.test.js) - 纯 JS 函数单元测试（52 个测试用例全部通过）

### 路由注册
- 已在 [App.jsx](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/App.jsx) 中注册 `/text-diff` 路由并添加首页任务卡片（id:21）

## ✨ 实现的功能

1. **左右分栏对比视图** - 左侧原始文本、右侧修改后文本，同一滚动容器自动同步滚动，行号对齐显示
2. **双视图切换** - 支持"左右对比"和"统一 diff"（Git diff 风格，带 + / - 前缀）两种视图模式
3. **双重差异高亮**
   - 行级高亮：绿色（新增）、红色（删除）、黄色（修改）
   - 字符级高亮：同一行内不同字符用不同深浅背景色标记
4. **三种文本输入方式**
   - 直接在左右两侧 textarea 粘贴/编辑
   - 上传本地 .txt / .md 文件读取
   - 一键从剪贴板粘贴
5. **变更块导航面板** - 右侧列出所有变更块（显示位置、类型、内容预览），点击快速滚动跳转
6. **工具栏功能** - 交换左右内容、清空、加载示例、视图切换
7. **统计显示** - 顶部显示新增/删除/修改行数统计
8. **响应式布局** - 适配 375px、768px、1024px、1440px 等各种屏幕尺寸
9. **深色模式支持** - 自动适配系统主题

## 🧪 测试结果

- **52 个测试用例全部通过** ✅
- **ESLint 检查无错误** ✅