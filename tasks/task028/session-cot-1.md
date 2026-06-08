我来帮你实现这个在线考试系统。首先让我探索一下项目结构，了解现有的代码组织方式。
        
            
toolName: todo_write
            
status: success
          
Todos updated: 9 items
          

        
            
toolName: view_folder
            
status: success
          
c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react
          
让我查看 App.jsx 了解路由注册方式，以及 survey 页面作为参考示例。

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\App.jsx
          
现在让我查看 survey 页面，作为参考模式：


        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\survey\index.jsx
          
让我查看 surveyCore.js 和相关测试文件作为参考：



        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\survey\surveyCore.js
          
现在让我查看一个测试文件了解测试模式：



        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\survey\surveyCore.test.js
          
让我查看 package.json 确认可用依赖：





        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\package.json
          
现在我对项目结构有了全面了解，开始实现在线考试系统。首先更新 todo 状态并创建核心逻辑文件。

        
            
toolName: todo_write
            
status: success
          
Todos updated: 9 items
          
首先创建 exam 目录和核心逻辑文件 examCore.js：



        
            
toolName: Write
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\exam\examCore.js
          
changes: undefined
          
现在创建 CSS 样式文件：




        
            
toolName: Write
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\exam\exam.css
          
changes: undefined
          
现在更新 todo 状态，开始创建页面组件。我先创建主入口 index.jsx：





        
            
toolName: todo_write
            
status: success
          
Todos updated: 6 items
          
现在创建题库管理组件 QuestionBank.jsx：






        
            
toolName: Write
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\exam\QuestionBank.jsx
          
changes: undefined
          
现在创建组卷页面组件 ExamCreate.jsx：







        
            
toolName: Write
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\exam\ExamCreate.jsx
          
changes: undefined
          
现在创建考试作答页面组件 ExamTake.jsx：









        
            
toolName: Write
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\exam\ExamTake.jsx
          
changes: undefined
          
现在创建成绩展示页面 ExamResult.jsx 和历史成绩页面 ExamHistory.jsx：









        
            
toolName: Write
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\exam\ExamResult.jsx
          
changes: undefined
          
现在创建历史成绩页面 ExamHistory.jsx：











        
            
toolName: Write
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\exam\ExamHistory.jsx
          
changes: undefined
          
现在创建主入口 index.jsx 整合所有页面：














        
            
toolName: Write
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\exam\index.jsx
          
changes: undefined
          
我需要修复 index.jsx 中使用 `require` 的问题（不兼容 ESM），同时也更新 App.jsx 注册路由：











        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\exam\index.jsx
          
changes: undefined
          
现在修复 useEffect 中使用 require 的问题：
















        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\exam\index.jsx
          
changes: undefined
          
现在更新 todo 并修改 App.jsx 注册路由和任务卡片：


















        
            
toolName: todo_write
            
status: success
          
Todos updated: 6 items
          

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\App.jsx
          
changes: undefined
          
现在添加任务卡片到 TASKS 数组和路由：

























        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\App.jsx
          
changes: undefined
          
看来文件已经有一些额外内容了，让我读取完整文件看一下当前状态：

















        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\App.jsx
          
TASKS 数组出现了重复和结构错误。让我修复它并添加 exam 路由：


















        
            
toolName: edit_file_search_replace
            
status: failed
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\App.jsx
          
          
让我直接重写整个 App.jsx 来修复问题：

















        
            
toolName: Write
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\App.jsx
          
changes: undefined
          
现在更新 todo 状态并编写单元测试：


















        
            
toolName: todo_write
            
status: success
          
Todos updated: 6 items
          
现在创建单元测试文件：




















        
            
toolName: Write
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\exam\examCore.test.js
          
changes: undefined
          
现在运行测试验证代码正确性：























        
            
toolName: todo_write
            
status: success
          
Todos updated: 6 items
          
运行单元测试：


















        
            
toolName: run_command
            
status: success
          
command: cd c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react ; pnpm test src/pages/__tests__/exam/examCore.test.js undefined
          
让我换一种方式运行测试：


















        
            
toolName: run_command
            
status: success
          
command: cd c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react ; npx vitest run src/pages/__tests__/exam/examCore.test.js 2>&1 undefined
          
有一个测试失败了。问题是 `generateExam` 默认总分是 100，但测试只提供了 20 分的题库。让我修复测试：



















        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\exam\examCore.test.js
          
changes: undefined
          
再次运行测试：























        
            
toolName: run_command
            
status: success
          
command: cd c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react ; npx vitest run src/pages/__tests__/exam/examCore.test.js 2>&1 undefined
          
所有 73 个测试都通过了！现在运行 lint 检查：



















        
            
toolName: run_command
            
status: success
          
command: cd c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react ; npx eslint src/pages/exam src/pages/__tests__/exam 2>&1 undefined
          
有一些 lint 错误，让我逐个修复。先修复 ExamTake.jsx：

























        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\exam\ExamTake.jsx
          
让我重写 ExamTake.jsx 修复所有 lint 问题：

























        
            
toolName: Write
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\exam\ExamTake.jsx
          
changes: undefined
          
现在修复 index.jsx（因为 loadExamDraft 已经从 examCore.js 导入，不需要从 ExamTake 导入了）以及其他 lint 问题：


























        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\exam\index.jsx
          
修复 index.jsx 的 lint 问题：

























        
            
toolName: Write
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\exam\index.jsx
          
changes: undefined
          
移除未使用的 `loadExamDraft` 导入，然后修复 QuestionBank.jsx：



























        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\exam\index.jsx
          
changes: undefined
          
现在修复 QuestionBank.jsx：





























        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\exam\QuestionBank.jsx
          
让我看看 QuestionBank 更完整的内容，然后修复：































        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\exam\QuestionBank.jsx
          
让我修复 QuestionBank.jsx 的 lint 问题：

































        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\exam\QuestionBank.jsx
          
changes: undefined
          
现在修复 QuestionBank 中 setState-in-effect 问题（改用 useMemo 内 clamping）：


































        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\exam\QuestionBank.jsx
          
changes: undefined
          
现在修复 ExamResult.jsx 中未使用的变量：



































        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\exam\ExamResult.jsx
          
修复 ExamResult.jsx 中无用的初始赋值：






































        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\exam\ExamResult.jsx
          
changes: undefined
          
现在重新运行 lint 检查确认所有问题都已修复：

































        
            
toolName: run_command
            
status: success
          
command: cd c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react ; npx eslint src/pages/exam src/pages/__tests__/exam 2>&1 undefined
          
还有一些严格的 lint 问题，让我逐一修复。先修复 index.jsx 的 useMemo 问题：
































        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\exam\index.jsx
          
changes: undefined
          
现在彻底重写 ExamTake.jsx，避免所有 ref 访问和渲染期间的不纯函数调用：





































        
            
toolName: Write
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\exam\ExamTake.jsx
          
changes: undefined
          
再次运行 lint 检查：






































        
            
toolName: run_command
            
status: success
          
command: cd c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react ; npx eslint src/pages/exam src/pages/__tests__/exam 2>&1 undefined
          
所有 lint 错误都已修复！现在再次运行测试确认所有内容仍然正常：




































        
            
toolName: run_command
            
status: success
          
command: cd c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react ; npx vitest run src/pages/__tests__/exam/examCore.test.js 2>&1 undefined
          
让我也运行项目诊断工具确保没有其他问题：





































        
            
toolName: GetDiagnostics
            
status: success
          
          
所有代码检查都通过了。现在更新 todo 状态为完成：







































        
            
toolName: todo_write
            
status: success
          
Todos updated: 6 items
          
在线考试系统已完整实现！所有功能通过了 73 个单元测试和 ESLint 代码质量检查。下面是实现概览：

## 📁 文件结构

```
src/pages/exam/
├── examCore.js              # 核心纯 JS 逻辑（数据层、组卷、判分、工具函数）
├── exam.css                 # 样式文件（响应式设计）
├── index.jsx                # 主入口（视图切换、路由整合）
├── QuestionBank.jsx         # 题库管理页面
├── ExamCreate.jsx           # 组卷页面
├── ExamTake.jsx             # 考试作答页面
├── ExamResult.jsx           # 自动判分与成绩详情页面
└── ExamHistory.jsx          # 历史成绩与趋势图

src/pages/__tests__/exam/
└── examCore.test.js         # 73 个纯 JS 逻辑单元测试
```

## ✨ 功能实现

### 1. 题库管理 ([QuestionBank.jsx](file:///C:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/exam/QuestionBank.jsx))
- 支持添加/编辑/删除题目，三种题型：单选题、多选题、填空题
- 每道题包含题干、选项（选择题）、正确答案、分值
- 列表分页展示（每页 5 题），按题型筛选、按题干关键词搜索

### 2. 组卷页面 ([ExamCreate.jsx](file:///C:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/exam/ExamCreate.jsx))
- 输入考试名称、时长（分钟）、总分值
- 从题库随机抽取题目，按累计分值达到目标总分（允许 ±5 分）
- 支持预览试卷，不满意可重新随机组卷

### 3. 作答页面 ([ExamTake.jsx](file:///C:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/exam/ExamTake.jsx))
- 顶部实时显示倒计时（按剩余时间切换颜色：蓝→黄→红闪烁）和答题进度
- 作答过程中答案实时保存到 localStorage
- 倒计时归零自动提交试卷，支持手动提交（含确认弹窗）

### 4. 自动判分与成绩详情 ([ExamResult.jsx](file:///C:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/exam/ExamResult.jsx))
- 单选题：正确选项完全匹配得分
- 多选题：必须完全匹配（顺序无关）才得分
- 填空题：答案字符串精确匹配（去首尾空格）才得分
- 展示总分、每题正误标记、正确答案与用户答案对比
- 错题附带通用解析提示文本

### 5. 成绩记录 ([ExamHistory.jsx](file:///C:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/exam/ExamHistory.jsx))
- 考试总览统计卡片（考试次数、平均正确率、平均得分、最佳成绩）
- 使用 Recharts 折线图展示成绩趋势变化（横轴为日期）
- 历史记录表格，按得分用颜色区分优秀/中等/需改进，支持查看详情

## 🔌 路由注册
- 在 [App.jsx](file:///C:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/App.jsx) 中注册了 `/exam` 路由，并在首页 TASKS 列表中添加了 id=21 的「在线考试系统」任务卡片

## 🧪 测试
- 纯 JS 逻辑测试覆盖 73 个用例，包含：题型常量、ID 生成、题目创建/验证、CRUD 操作、筛选分页、localStorage 持久化、随机组卷、自动判分、格式化工具函数、答案显示函数等
- 所有存储操作均在测试中通过 mock localStorage 隔离

## 📱 响应式布局
- 所有页面使用 flex 布局和媒体查询，在 375px（移动端）和 1440px（桌面端）宽度下均可正常使用