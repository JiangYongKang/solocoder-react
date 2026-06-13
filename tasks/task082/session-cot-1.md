我来帮你实现这个成绩管理系统。首先让我了解一下项目结构和现有代码规范。
        
            
toolName: todo_write
            
status: success
          
Todos updated: 8 items
          

        
            
toolName: view_folder
            
status: success
          
c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src
          

        
            
toolName: view_folder
            
status: success
          
c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\package.json
          
让我查看现有的 grade-manager 目录结构和文件内容，以及其他类似页面的代码风格。

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\grade-manager\gradeCore.js
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\grade-manager\index.jsx
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\grade-manager\grade-manager.css
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\grade-manager\gradeCore.test.js
          
我看到 grade-manager 目录下已经有了完整的实现！让我检查一下路由配置，确保页面可以正常访问。



        
            
toolName: todo_write
            
status: success
          
Todos updated: 4 items
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\App.jsx
          
太好了！成绩管理系统已经完全实现，路由也已经配置好了（在 [App.jsx](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/App.jsx#L29) 和 [App.jsx](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/App.jsx#L244)）。让我运行测试来验证功能完整性。


        
            
toolName: todo_write
            
status: success
          
Todos updated: 4 items
          

        
            
toolName: run_command
            
status: success
          
command: npm test -- src/pages/__tests__/grade-manager/gradeCore.test.js undefined
          
有两个测试失败了，我来修复它们。第一个是测试数据的总分计算有误，第二个是粘贴解析的空姓名检测逻辑。



        
            
toolName: todo_write
            
status: success
          
Todos updated: 4 items
          
我来分析并修复这两个问题：

1. **排名测试失败**：mock 数据中王五总分 256（92+79+85）是最高的，测试期望错误
2. **空姓名检测失败**：`line.trim()` 会去掉开头的 tab，导致 `\t85\t92\t78` 变成 `85\t92\t78`，姓名被识别为 `85`

让我修复代码逻辑：

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\grade-manager\gradeCore.js
          
changes: undefined
          
现在修正测试中的排名期望：



        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\grade-manager\gradeCore.test.js
          
changes: undefined
          
现在重新运行测试验证修复：



        
            
toolName: run_command
            
status: success
          
command: npm test -- src/pages/__tests__/grade-manager/gradeCore.test.js undefined
          
我发现问题了！`text.trim().split('\n')` 会把整个文本首尾的空白（包括第一行开头的 tab）去掉，导致 `'\t85\t92\t78'` 变成 `'85\t92\t78'`。让我修复：





        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\grade-manager\gradeCore.js
          
changes: undefined
          

        
            
toolName: run_command
            
status: success
          
command: npm test -- src/pages/__tests__/grade-manager/gradeCore.test.js undefined
          
所有测试都通过了！现在让我运行 lint 检查代码质量。





        
            
toolName: todo_write
            
status: success
          
Todos updated: 4 items
          

        
            
toolName: run_command
            
status: success
          
command: npm run lint -- --quiet src/pages/grade-manager/ src/pages/__tests__/grade-manager/ undefined
          

        
          
项目中已经有完整的成绩管理系统实现了！让我单独检查 grade-manager 相关文件的 lint 状态，然后给你一个完整的总结。


        
            
toolName: todo_write
            
status: success
          
Todos updated: 4 items
          

        
            
toolName: GetDiagnostics
            
status: success
          
          

        
            
toolName: GetDiagnostics
            
status: success
          
          
grade-manager 相关文件都没有 lint 错误！让我完成最后的状态更新并给你一个完整总结。





        
            
toolName: todo_write
            
status: success
          
Todos updated: 4 items
          
成绩管理系统已经完整实现并通过了所有测试！以下是实现总结：

## 📁 代码结构

| 文件 | 说明 |
|------|------|
| [gradeCore.js](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/grade-manager/gradeCore.js) | 核心逻辑模块，60+ 纯 JS 函数 |
| [index.jsx](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/grade-manager/index.jsx) | React 页面组件 |
| [grade-manager.css](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/grade-manager/grade-manager.css) | 完整样式 |
| [gradeCore.test.js](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/__tests__/grade-manager/gradeCore.test.js) | 65 个单元测试 |

## ✅ 已实现功能

### 1. **成绩表录入
- ✅ 学生/科目双视图表格，首行固定，支持横向纵向滚动
- ✅ 逐格编辑：点击单元格修改，失焦/回车确认，0-150 分校验
- ✅ 批量粘贴：支持制表符/逗号分隔数据，自动解析校验
- ✅ 表格底部显示总分和平均分汇总

### 2. **双视图切换
- ✅ 学生视图（行=学生，列=科目）
- ✅ 科目视图（行=科目，列=学生）
- ✅ 共享数据源，切换不丢失数据

### 3. **统计分析
- ✅ 均分、最高分、最低分、中位数、标准差
- ✅ 中位数处理偶数个成绩取中间两数平均
- ✅ 总体标准差公式
- ✅ 保留两位小数

### 4. **直方图**
- ✅ 6 个分数段（不及格/及格/中等/良好/优秀/异常
- ✅ 纯 CSS 柱状图，柱子上方标注人数
- ✅ 科目切换查看不同科目分布

### 5. **排名**
- ✅ 按总分降序，同分同名次（跳过后续名次）
- ✅ 支持按单科成绩切换排名
- ✅ 排名变化箭头标注（与上次对比）

### 6. **CSV 导出**
- ✅ 导出 CSV 文件，文件名带时间戳
- ✅ 包含姓名、各科成绩、总分、平均分

### 7. **数据持久化
- ✅ localStorage 自动保存/加载
- ✅ 保存历史数据用于排名变化对比

## 🔧 修复的问题

1. **`parsePastedData` 函数修复：先 `text.trim()` 会去掉了第一行开头的制表符，导致空姓名检测失效，改为逐行 trim

2. **测试用例修复：修正了排名测试中 mock 数据的总分计算错误

## 🧪 测试结果

- **65 个测试全部通过** ✅
- **lint 无错误 ✅
- 路由已配置，可通过 `/grade-manager` 访问

页面已在 [App.jsx](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/App.jsx#L244) 中配置路由，并在首页任务列表第 69 项注册。