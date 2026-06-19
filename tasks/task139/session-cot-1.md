我来帮你实现这个「文本差异统计工具」页面。首先让我了解一下项目的结构和技术栈。
        
            
toolName: todo_write
            
status: success
          
Todos updated: 6 items
          

        
            
toolName: view_folder
            
status: success
          
c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react
          

        
            
toolName: file_search
            
status: success
          
file_pattern: **/package.json
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\package.json
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\text-diff\index.jsx
          

        
            
toolName: file_search
            
status: success
          
file_pattern: **/__tests__/**/*.test.*
          
让我查看现有的 diffUtils 工具和测试文件，以及参考页面结构：

        
            
toolName: file_search
            
status: success
          
file_pattern: *
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\text-diff\diffUtils.test.js
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\text-diff\diffUtils.js
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\App.jsx
          
好的，我已经了解了项目结构。现有 text-diff 页面只有基础的 diff 对比功能，需要实现一个功能更丰富的「文本差异统计工具」。让我开始实现。

        
            
toolName: todo_write
            
status: success
          
Todos updated: 7 items
          
现在让我创建核心算法工具函数。我会在 `text-diff` 目录下新建一个统计相关的工具文件：



        
            
toolName: Write
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\text-diff\textDiffStats.js
          
changes: undefined
          
现在让我创建 localStorage 持久化存储模块：




        
            
toolName: todo_write
            
status: success
          
Todos updated: 7 items
          

        
            
toolName: Write
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\text-diff\storage.js
          
changes: undefined
          
现在让我编写核心算法的单元测试：





        
            
toolName: todo_write
            
status: success
          
Todos updated: 7 items
          

        
            
toolName: Write
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\text-diff\textDiffStats.test.js
          
changes: undefined
          
让我先运行一下测试，看看核心算法是否正确：







        
            
toolName: run_command
            
status: success
          
command: cd c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react ; npx vitest run src/pages/__tests__/text-diff/textDiffStats.test.js undefined
          
太好了！71 个测试全部通过。现在让我实现页面组件。先看一下现有的 CSS：







        
            
toolName: todo_write
            
status: success
          
Todos updated: 7 items
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\text-diff\text-diff.css
          
现在让我实现文本差异统计工具的页面组件。这是一个比较复杂的页面，我会重写整个组件：


        
            
toolName: Write
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\text-diff\index.jsx
          
changes: undefined
          
现在让我更新页面样式。由于这是一个全新的页面布局，我会重写 CSS 文件：










        
            
toolName: todo_write
            
status: success
          
Todos updated: 7 items
          

        
            
toolName: Write
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\text-diff\text-diff.css
          
changes: undefined
          
现在让我运行所有测试来验证实现：









        
            
toolName: todo_write
            
status: success
          
Todos updated: 7 items
          

        
            
toolName: run_command
            
status: success
          
command: cd c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react ; npx vitest run src/pages/__tests__/text-diff/ undefined
          
所有测试都通过了！2 个测试文件，130 个测试全部通过。让我再运行一下构建来确保没有编译错误：





        
            
toolName: run_command
            
status: success
          
command: cd c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react ; npx vite build undefined
          
构建成功！现在让我启动开发服务器来验证页面是否正常工作：









        
            
toolName: run_command
            
status: running
          
command: cd c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react ; npx vite --port 5173 --host undefined
          

        
            
toolName: check_command_status
            
status: success
          
          
开发服务器启动成功！让我再运行一下 lint 检查确保代码质量：







        
            
toolName: run_command
            
status: success
          
command: cd c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react ; npx eslint src/pages/text-diff/ src/pages/__tests__/text-diff/ undefined
          
有几个 lint 错误需要修复，让我来处理一下：







        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\text-diff\index.jsx
          
让我修复这些 lint 错误：









        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\text-diff\index.jsx
          
changes: undefined
          
现在修复 useEffect 中的 setState 问题和未使用的变量：









        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\text-diff\index.jsx
          

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\text-diff\index.jsx
          
changes: undefined
          
现在修复未使用的变量：









        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\text-diff\index.jsx
          

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\text-diff\index.jsx
          
changes: undefined
          
现在让我再运行一次 lint 检查：










        
            
toolName: run_command
            
status: success
          
command: cd c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react ; npx eslint src/pages/text-diff/ src/pages/__tests__/text-diff/ undefined
          
还有一个未使用的 useEffect 导入，让我修复：








        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\text-diff\index.jsx
          
changes: undefined
          
再运行一次 lint 检查和测试，确保一切正常：










        
            
toolName: run_command
            
status: success
          
command: cd c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react ; npx eslint src/pages/text-diff/ src/pages/__tests__/text-diff/ ; npx vitest run src/pages/__tests__/text-diff/ undefined
          
让我分开运行这两个命令：










        
            
toolName: run_command
            
status: success
          
command: cd c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react ; npx eslint src/pages/text-diff/ src/pages/__tests__/text-diff/ undefined
          
Lint 通过了！现在运行测试：












        
            
toolName: run_command
            
status: success
          
command: cd c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react ; npx vitest run src/pages/__tests__/text-diff/ undefined
          
太好了！所有 lint 检查和测试都通过了。让我打开预览页面，然后更新 todo 列表：











        
            
toolName: todo_write
            
status: success
          
Todos updated: 7 items
          

        
            
toolName: open_preview
            
status: success
          
预览
          
「文本差异统计工具」页面已经实现完成！以下是实现的完整功能总结：

## 已实现功能

### 1. 左右输入对比
- 左右两栏文本输入区，每栏顶部有可编辑的标题输入框（默认为"文本 A"和"文本 B"）
- 支持直接输入和粘贴文本
- 底部工具栏提供「清空」「从文件加载」「使用示例文本」按钮
- 两侧输入任意一侧变化时自动实时重新对比

### 2. 字符/单词/行计数差异
- 统计摘要栏展示三个维度的差异计数
- 字符差异数：逐字符对比，包含不同字符和一端多出的字符
- 单词差异数：按空格拆分后对比，包含不同单词和一端多出的单词  
- 行差异数：按换行拆分后对比，包含不同行和一端多出的行
- 差异数量以红色数字高亮显示

### 3. 相似度百分比
- 基于字符、单词、行三个维度分别计算相似度百分比
- 公式：相似度 = (最长公共子序列长度 / 两端较大总数) × 100%
- 圆形进度环展示，颜色从红色（低相似度）渐变到绿色（高相似度）
- 鼠标悬停显示具体数值，三个维度并排展示

### 4. 差异高亮
- 逐行差异对比视图，两侧文本并排显示
- 行内差异使用字符级红色/绿色背景高亮标记
- 完全相同的行显示为正常背景
- 一边有而另一边没有的行以整行背景色标注
- 提供「仅显示差异行」复选框，可隐藏相同行

### 5. 词频统计表格
- 分别统计文本 A 和文本 B 的词频（按空格分词，忽略大小写和标点）
- 表格展示：排名、词语、出现次数、在文本 A 中的占比、在文本 B 中的占比
- 默认展示 Top 20，支持切换 Top 50 或全部
- 按出现次数降序排列
- 提供「只显示差异词语」开关

### 6. 双栏同步滚动
- 左右两侧输入区支持同步滚动
- 差异对比视图支持同步滚动
- 提供「锁定同步滚动」开关，关闭后可独立滚动

### 7. localStorage 历史持久化
- 点击「保存」按钮可保存当前输入到历史记录
- 「历史记录」面板可查看、加载、删除历史记录
- 最多保存 10 条历史记录，自动去重

## 文件结构

**核心代码**（位于 `src/pages/text-diff/`）：
- [index.jsx](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/text-diff/index.jsx) - 页面主组件
- [textDiffStats.js](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/text-diff/textDiffStats.js) - 纯 JS 算法工具函数
- [storage.js](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/text-diff/storage.js) - localStorage 持久化模块
- [text-diff.css](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/text-diff/text-diff.css) - 页面样式

**测试代码**（位于 `src/pages/__tests__/text-diff/`）：
- [textDiffStats.test.js](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/__tests__/text-diff/textDiffStats.test.js) - 新增 71 个单元测试

## 验证结果
- ✅ **130 个单元测试全部通过**（原有 59 个 + 新增 71 个）
- ✅ ESLint 检查通过
- ✅ 生产构建成功
- ✅ 开发服务器运行正常

页面已在 `http://localhost:5173/#/text-diff` 运行，你可以直接预览效果。