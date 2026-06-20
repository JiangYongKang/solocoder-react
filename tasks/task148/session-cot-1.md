我需要先了解当前项目的结构和技术栈，然后规划实现方案。让我先探索项目。
        
            
toolName: view_folder
            
status: success
          
c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react
          

        
            
toolName: file_search
            
status: success
          
file_pattern: src/pages/**/*
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\package.json
          
让我查看几个已有的页面实现，以了解项目的代码风格和模式。

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\text-diff\index.jsx
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\text-diff\diffUtils.test.js
          

        
            
toolName: file_search
            
status: success
          
file_pattern: src/pages/__tests__/terms-generator/*
          

        
            
toolName: view_folder
            
status: success
          
c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages
          
让我查看 markdown-notes 页面作为 Markdown 处理的参考，以及 text-diff 下的 diffUtils.js：

        
            
toolName: view_folder
            
status: success
          
c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\markdown-notes
          

        
            
toolName: view_folder
            
status: success
          
c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\text-diff
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\markdown-notes\noteUtils.js
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\text-diff\diffUtils.js
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\text-diff\storage.js
          
现在我对项目结构和代码风格有了充分了解。让我创建一个详细的任务计划来实现协议条款生成器页面。


        
            
toolName: todo_write
            
status: success
          
Todos updated: 7 items
          

        
            
toolName: todo_write
            
status: success
          
Todos updated: 7 items
          
现在创建 constants.js 文件，包含预设模板和通用变量定义：



        
            
toolName: Write
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\terms-generator\constants.js
          
changes: undefined
          

        
            
toolName: todo_write
            
status: success
          
Todos updated: 7 items
          

        
            
toolName: Write
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\terms-generator\storage.js
          
changes: undefined
          

        
            
toolName: todo_write
            
status: success
          
Todos updated: 7 items
          
现在创建核心纯函数 utils.js：





        
            
toolName: Write
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\terms-generator\utils.js
          
changes: undefined
          

        
            
toolName: todo_write
            
status: success
          
Todos updated: 7 items
          
现在创建样式文件 terms-generator.css：





        
            
toolName: Write
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\terms-generator\terms-generator.css
          
changes: undefined
          

        
            
toolName: todo_write
            
status: success
          
Todos updated: 7 items
          
现在创建主页面组件 index.jsx：





        
            
toolName: Write
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\terms-generator\index.jsx
          
changes: undefined
          

        
            
toolName: todo_write
            
status: success
          
Todos updated: 7 items
          
现在创建单元测试文件 utils.test.js：







        
            
toolName: Write
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\terms-generator\utils.test.js
          
changes: undefined
          

        
            
toolName: todo_write
            
status: success
          
Todos updated: 7 items
          
现在运行测试和 lint 验证：



        
            
toolName: run_command
            
status: success
          
command: npm test -- src/pages/__tests__/terms-generator/utils.test.js 2>&1 undefined
          
测试文件有语法错误。让我读取并修复它：




        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\terms-generator\utils.test.js
          
我看到有几行 `it` 调用缺少了括号。让我修复整个测试文件：







        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\terms-generator\utils.test.js
          
changes: undefined
          

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\terms-generator\utils.test.js
          
changes: undefined
          
让我再次运行测试看看是否还有其他语法错误：







        
            
toolName: run_command
            
status: success
          
command: npm test -- src/pages/__tests__/terms-generator/utils.test.js 2>&1 undefined
          
有 3 个测试失败了，需要修复 utils.js 中的函数逻辑：









        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\terms-generator\utils.js
          
changes: undefined
          
现在修复 formatTimestamp，0 是有效的时间戳应该可以正确格式化：










        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\terms-generator\utils.js
          
changes: undefined
          
再次运行测试：









        
            
toolName: run_command
            
status: success
          
command: npm test -- src/pages/__tests__/terms-generator/utils.test.js 2>&1 undefined
          
所有 63 个测试全部通过！现在运行 lint 检查：











        
            
toolName: run_command
            
status: success
          
command: npm run lint -- src/pages/terms-generator/ 2>&1 undefined
          
我看到 lint 检查出 terms-generator/index.jsx 有两个问题需要修复：在 useEffect 中同步调用 setState，以及缺少依赖。让我修复：












        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\terms-generator\index.jsx
          
让我重构代码，把模板切换逻辑从 useEffect 移到事件处理函数中，避免在 effect 中同步调用 setState：













        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\terms-generator\index.jsx
          
changes: undefined
          
我发现有重复声明 `variables` 的问题。让我修复它，同时更新 handleTemplateSelect 来加载模板内容：

















        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\terms-generator\index.jsx
          
让我修复重复声明并更新 handleTemplateSelect：

















        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\terms-generator\index.jsx
          
changes: undefined
          
现在更新 handleTemplateSelect 来正确处理模板切换：


















        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\terms-generator\index.jsx
          
changes: undefined
          
现在专门针对我们的目录运行 lint：


















        
            
toolName: run_command
            
status: success
          
command: npx eslint src/pages/terms-generator/ src/pages/__tests__/terms-generator/ 2>&1 undefined
          
Lint 检查全部通过！让我再次运行测试确认所有功能正常：



















        
            
toolName: run_command
            
status: success
          
command: npm test -- src/pages/__tests__/terms-generator/utils.test.js 2>&1 undefined
          
所有测试通过！让我标记最后一个任务完成：




















        
            
toolName: todo_write
            
status: success
          
Todos updated: 7 items
          
「协议条款生成器」页面已全部实现完成！所有 **63 个单元测试全部通过**，ESLint 检查零错误。

## 创建的文件结构

### 页面代码（`src/pages/terms-generator/`）

| 文件 | 说明 |
|------|------|
| [constants.js](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/terms-generator/constants.js) | 常量定义：3 个预设模板（隐私政策、用户协议、免责声明）、通用变量、视图模式、存储键 |
| [storage.js](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/terms-generator/storage.js) | localStorage 持久化：变量、版本快照（最多 20 个）、自定义模板的存取 |
| [utils.js](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/terms-generator/utils.js) | 核心纯函数：变量替换解析、Markdown→HTML 转换、LCS diff 算法、模板校验、导出 HTML 拼接 |
| [terms-generator.css](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/terms-generator/terms-generator.css) | 完整的页面样式，兼容分栏/纯编辑/纯预览三种视图 |
| [index.jsx](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/terms-generator/index.jsx) | 主页面组件，整合所有功能 |

### 测试代码（`src/pages/__tests__/terms-generator/`）

| 文件 | 说明 |
|------|------|
| [utils.test.js](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/__tests__/terms-generator/utils.test.js) | 63 个纯 JS 函数单元测试，覆盖所有核心算法 |

## 实现的功能要点

1. **条款模板选择**：3 种预设模板 + 自定义模板创建，卡片显示名称、描述和前 3 个章节预览
2. **变量替换**：顶部表单配置变量（含 `{变量名}` 标签提示），实时替换预览，localStorage 记忆
3. **Markdown 预览**：支持 h1-h4 标题、有序/无序列表、加粗斜体、链接、代码块，三种视图切换
4. **版本管理**：保存快照（可选备注）、加载恢复、两版本 diff 对比（绿增红删）、上限 20 个提示
5. **导出 HTML**：内联样式 + 文档标题 + 生成日期 + 版权页脚，导出前 iframe 预览确认；另支持一键复制 Markdown 源码