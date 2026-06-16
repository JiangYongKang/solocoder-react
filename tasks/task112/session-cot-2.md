好的，我来修复这些问题。让我逐一处理。
        
            
toolName: todo_write
            
status: success
          
Todos updated: 5 items
          
首先，我来实现语法高亮功能。在核心逻辑中添加语法高亮函数：


        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\modal-generator\modalGeneratorCore.js
          
现在我来逐步修复这些问题。首先修改核心逻辑文件：

1. 添加语法高亮函数
2. 修复 Info 类型的颜色字段问题
3. 修改表单弹窗默认 content 为引导性文字



        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\modal-generator\modalGeneratorCore.js
          
changes: undefined
          
现在修复 `generateCallCode` 函数，对 Info 类型跳过按钮颜色字段，同时修改表单弹窗默认 content：





        
            
toolName: edit_file_search_replace
            
status: failed
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\modal-generator\modalGeneratorCore.js
          
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\modal-generator\modalGeneratorCore.js
          

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\modal-generator\modalGeneratorCore.js
          
changes: undefined
          
现在修复 `generateCallCode` 函数中 Info 类型的颜色字段问题：









        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\modal-generator\modalGeneratorCore.js
          
changes: undefined
          
现在更新 ModalPreview 组件，让表单弹窗也显示正文内容：







        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\modal-generator\ModalPreview.jsx
          

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\modal-generator\ModalPreview.jsx
          
changes: undefined
          
现在更新 ConfigPanel 组件，恢复按需生成代码、添加表单正文输入、实现语法高亮：












        
            
toolName: todo_write
            
status: success
          
Todos updated: 5 items
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\modal-generator\ConfigPanel.jsx
          
现在更新 ConfigPanel 组件，实现所有修复：













        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\modal-generator\ConfigPanel.jsx
          
changes: undefined
          

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\modal-generator\ConfigPanel.jsx
          
changes: undefined
          

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\modal-generator\ConfigPanel.jsx
          
changes: undefined
          
现在修复表单弹窗也要显示正文内容输入框：















        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\modal-generator\ConfigPanel.jsx
          
changes: undefined
          
现在更新代码展示区域，使用语法高亮：

















        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\modal-generator\ConfigPanel.jsx
          
changes: undefined
          
现在更新主页面 index.jsx，恢复 generatedCode state：

















        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\modal-generator\index.jsx
          

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\modal-generator\index.jsx
          
changes: undefined
          

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\modal-generator\index.jsx
          
changes: undefined
          
现在添加语法高亮的 CSS 样式：
















        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\modal-generator\modal-generator.css
          
changes: undefined
          
现在更新测试文件，添加新函数的测试并修复已有测试：


















        
            
toolName: todo_write
            
status: success
          
Todos updated: 5 items
          
先运行测试看看有哪些需要修复：

















        
            
toolName: run_command
            
status: success
          
command: pnpm vitest run src/pages/__tests__/modal-generator/modalGeneratorCore.test.js undefined
          
现有测试都通过了。现在添加新函数的测试用例（highlightSyntax、hasButtonColor）以及验证 Info 类型不包含颜色字段的测试：




















        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\modal-generator\modalGeneratorCore.test.js
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\modal-generator\modalGeneratorCore.test.js
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\modal-generator\modalGeneratorCore.test.js
          
现在添加新的测试用例：





















        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\modal-generator\modalGeneratorCore.test.js
          
changes: undefined
          
现在在文件末尾添加新测试：























        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\modal-generator\modalGeneratorCore.test.js
          
changes: undefined
          
现在运行所有测试：

























        
            
toolName: run_command
            
status: success
          
command: pnpm vitest run src/pages/__tests__/modal-generator/modalGeneratorCore.test.js undefined
          
所有 103 个测试都通过了！现在运行 lint 检查：



























        
            
toolName: run_command
            
status: success
          
command: pnpm eslint src/pages/modal-generator/ src/pages/__tests__/modal-generator/ undefined
          
有一个未使用的变量，修复一下：


























        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\modal-generator\modalGeneratorCore.js
          
changes: undefined
          
重新运行 lint 和测试确认：




























        
            
toolName: run_command
            
status: success
          
command: pnpm eslint src/pages/modal-generator/ src/pages/__tests__/modal-generator/ ; pnpm vitest run src/pages/__tests__/modal-generator/modalGeneratorCore.test.js undefined
          

        
            
toolName: todo_write
            
status: success
          
Todos updated: 5 items
          
所有 5 个问题已全部修复完成！

## 修复内容总结

### 1. 语法高亮效果
在 [modalGeneratorCore.js](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/modal-generator/modalGeneratorCore.js#L260-L343) 中新增了 `highlightSyntax` 函数，实现了词法分析的语法高亮，支持以下 token 类型着色：
- **字符串**（蓝色 `#0550ae`）- 单引号和双引号字符串，支持转义字符
- **数字**（绿色 `#098658`）- 整数和小数
- **关键字**（红色 `#cf222e`）- `true` / `false` / `null` / `undefined`
- **属性名**（棕色 `#953800`）- 对象属性后跟冒号的标识符
- **函数名**（紫色 `#6639ba`）- 首字母大写的标识符
- **标点符号**（中灰色）- 大括号、逗号等
- **注释**（斜体灰色）- 单行注释

### 2. 恢复按需生成代码
- 代码面板初始显示 `点击"生成代码"按钮生成` 占位提示
- 点击「生成代码」按钮后才生成并显示代码
- 主页面使用 `useState` 管理 `generatedCode` 状态，而非自动派生

### 3. 表单弹窗正文内容
- [ConfigPanel.jsx](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/modal-generator/ConfigPanel.jsx) 中所有弹窗类型都显示正文内容输入框
- [ModalPreview.jsx](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/modal-generator/ModalPreview.jsx) 中表单弹窗的正文内容显示在输入框上方
- 表单弹窗默认 content 为「请填写以下信息：」

### 4. Info 类型跳过按钮颜色
- 新增 `hasButtonColor` 函数判断类型是否需要颜色配置
- `generateCallCode` 中只有有按钮的类型才输出 `confirmColor` / `cancelColor`
- Alert 类型只输出 `confirmColor`，不输出 `cancelColor`

### 5. 测试全部通过
- 单元测试从 83 个增加到 **103 个**，全部通过
- 新增测试：`highlightSyntax`（12个）、`hasButtonColor`（4个）、`generateCallCode - info type color fields`（3个）、`createConfigByType - form type content`（1个）
- ESLint 检查 0 错误