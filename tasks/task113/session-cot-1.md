我来帮你实现这个答题竞赛系统。首先让我了解一下当前项目的结构和技术栈。
        
            
toolName: todo_write
            
status: success
          
Todos updated: 9 items
          

        
            
toolName: view_folder
            
status: success
          
c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\package.json
          
让我查看一下现有的 exam 页面（可能与答题功能类似）和测试目录结构，了解代码风格。

        
            
toolName: view_folder
            
status: success
          
c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\exam
          

        
            
toolName: file_search
            
status: success
          
file_pattern: **/__tests__/**
          
让我查看 exam 模块的核心逻辑和一个测试文件，了解代码风格。


        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\exam\examCore.js
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\exam\examCore.test.js
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\exam\index.jsx
          
现在我了解了项目结构和代码风格。让我开始实现答题竞赛系统。


        
            
toolName: todo_write
            
status: success
          
Todos updated: 8 items
          
首先创建核心逻辑模块 `quizCore.js`，包含所有纯函数逻辑：




        
            
toolName: Write
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\quiz-competition\quizCore.js
          
changes: undefined
          
核心逻辑模块已创建。现在创建题库管理组件：



        
            
toolName: todo_write
            
status: success
          
Todos updated: 8 items
          

        
            
toolName: Write
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\quiz-competition\QuestionBank.jsx
          
changes: undefined
          
现在创建答题主界面组件：

        
            
toolName: Write
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\quiz-competition\QuizGame.jsx
          
changes: undefined
          
现在创建排行榜组件：


        
            
toolName: todo_write
            
status: success
          
Todos updated: 8 items
          

        
            
toolName: Write
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\quiz-competition\Leaderboard.jsx
          
changes: undefined
          
现在创建道具商店组件和主入口页面：


        
            
toolName: Write
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\quiz-competition\ItemShop.jsx
          
changes: undefined
          
现在创建主入口页面：





        
            
toolName: todo_write
            
status: success
          
Todos updated: 8 items
          

        
            
toolName: Write
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\quiz-competition\index.jsx
          
changes: undefined
          
现在创建样式文件：




        
            
toolName: Write
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\quiz-competition\quiz.css
          
changes: undefined
          
现在创建单元测试文件：









        
            
toolName: todo_write
            
status: success
          
Todos updated: 8 items
          

        
            
toolName: Write
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\quiz-competition\quizCore.test.js
          
changes: undefined
          
现在运行测试验证功能：





        
            
toolName: todo_write
            
status: success
          
Todos updated: 8 items
          

        
            
toolName: run_command
            
status: success
          
command: cd c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react ; npx vitest run src/pages/__tests__/quiz-competition/quizCore.test.js undefined
          
测试全部通过！95 个测试用例全部成功。让我再运行 lint 检查一下代码质量：







        
            
toolName: run_command
            
status: success
          
command: cd c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react ; npx eslint src/pages/quiz-competition/ --max-warnings=0 undefined
          
有一些 lint 错误需要修复。让我逐一解决这些问题：









        
            
toolName: todo_write
            
status: success
          
Todos updated: 9 items
          
让我先看看其他页面是如何处理这些 lint 问题的：




        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\exam\QuestionBank.jsx
          
我看到了其他文件的处理方式。需要修复以下问题：
1. 未使用的导入
2. `useItem` 被误认为是 React Hook（需重命名）
3. 用 `useState` 初始值函数代替 effect 中的 setState
4. 函数声明顺序问题
5. 不纯函数调用

让我逐一修复：






        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\quiz-competition\quizCore.js
          
changes: undefined
          
现在修复 QuizGame.jsx：



        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\quiz-competition\QuizGame.jsx
          
让我重写 QuizGame.jsx 修复所有 lint 问题：



        
            
toolName: Write
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\quiz-competition\QuizGame.jsx
          
changes: undefined
          
现在修复其他组件的 lint 问题：






        
            
toolName: Write
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\quiz-competition\QuestionBank.jsx
          
changes: undefined
          
现在修复 Leaderboard.jsx、ItemShop.jsx 和 index.jsx：






        
            
toolName: Write
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\quiz-competition\Leaderboard.jsx
          
changes: undefined
          
我发现 Leaderboard.jsx 有个语法错误，让我修复它，同时修复其他文件：









        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\quiz-competition\Leaderboard.jsx
          
changes: undefined
          
现在修复 ItemShop.jsx：







        
            
toolName: Write
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\quiz-competition\ItemShop.jsx
          
changes: undefined
          
现在修复主入口文件 index.jsx：










        
            
toolName: Write
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\quiz-competition\index.jsx
          
changes: undefined
          
现在更新测试文件中的函数名引用：









        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\quiz-competition\quizCore.test.js
          
changes: undefined
          

        
            
toolName: search_by_regex
            
status: success
          
query: useItem
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\quiz-competition\quizCore.test.js
          

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\quiz-competition\quizCore.test.js
          
changes: undefined
          
现在再次运行测试和 lint 检查：










        
            
toolName: run_command
            
status: success
          
command: cd c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react ; npx vitest run src/pages/__tests__/quiz-competition/quizCore.test.js undefined
          
测试全部通过！现在运行 lint 检查：










        
            
toolName: run_command
            
status: success
          
command: cd c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react ; npx eslint src/pages/quiz-competition/ --max-warnings=0 undefined
          
还有两个 lint 错误，让我修复：











        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\quiz-competition\QuizGame.jsx
          

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\quiz-competition\QuizGame.jsx
          
changes: undefined
          
等等，`Date.now()` 仍然在渲染期间调用。让我用 `useEffect` 来初始化开始时间：









        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\quiz-competition\QuizGame.jsx
          

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\quiz-competition\QuizGame.jsx
          
changes: undefined
          
现在添加一个 useEffect 来初始化 startTime：










        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\quiz-competition\QuizGame.jsx
          

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\quiz-competition\QuizGame.jsx
          
changes: undefined
          
再次运行 lint 检查：











        
            
toolName: run_command
            
status: success
          
command: cd c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react ; npx eslint src/pages/quiz-competition/ --max-warnings=0 undefined
          
lint 全部通过！现在运行 build 确保编译正常：













        
            
toolName: run_command
            
status: success
          
command: cd c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react ; npx vite build undefined
          
构建成功！所有任务都完成了。让我更新 todo 列表：
        
            
toolName: todo_write
            
status: success
          
Todos updated: 9 items
          
答题竞赛系统页面已全部实现完成！🎉

## 项目文件结构

```
src/pages/quiz-competition/
├── quizCore.js          # 核心逻辑模块（纯函数，便于单元测试）
├── index.jsx            # 主入口页面（首页、导航）
├── QuestionBank.jsx     # 题库管理组件
├── QuizGame.jsx         # 答题主界面组件
├── Leaderboard.jsx      # 排行榜组件
├── ItemShop.jsx         # 道具商店组件
└── quiz.css             # 样式文件

src/pages/__tests__/quiz-competition/
└── quizCore.test.js     # 单元测试（95个测试用例）
```

## 功能概览

### 1. 题库管理
- 内置 **25 道预置题目**（涵盖常识、科学、历史、地理、文学、体育等分类）
- 支持新增、编辑、删除题目
- 按分类标签筛选
- 每题显示内容摘要、题型、正确答案标记、分类标签

### 2. 倒计时限时答题
- 圆形 SVG 进度环展示倒计时（默认 15 秒）
- 每轮随机抽取 10 道题
- 答题进度条显示当前题号（如"第 3/10 题"）
- 倒计时归零视为答错，自动进入下一题

### 3. 答对得分/答错扣分动画
- 答对：选项变绿色 + "+10" 飘字上升动画
- 答错：选项变红色 + 正确答案高亮 + "-5" 飘字下降动画
- 超时："-5" 飘字提示
- 1 秒后自动进入下一题

### 4. 排行榜
- 显示历史所有竞赛记录（时间、得分、答对/答错/超时题数、正确率）
- 按总分降序排列
- 前三名金银铜牌显示
- 支持分页（每页 10 条）
- 玩家昵称关联

### 5. 多轮对战
- 支持"再来一局"连续多轮竞赛
- 轮间小结卡片（得分、正确率、用时）
- 累计总分、总轮数展示

### 6. 金币积分与道具系统
- 答对一题得 5 金币，满分额外奖励 20 金币
- 三种道具：
  - **跳过**（30 金币）：跳过当前题视为答对但不加分
  - **加时**（20 金币）：当前题倒计时延长 10 秒
  - **双倍**（40 金币）：下一题答对得分翻倍

## 技术特点

- **核心逻辑与 UI 分离**：所有业务逻辑在 `quizCore.js` 中以纯函数实现
- **localStorage 持久化**：题库、金币、道具背包、排行榜均自动保存
- **95 个单元测试全部通过**：覆盖随机抽题、得分计算、金币系统、道具效果、排行榜排序分页等
- **ESLint 零错误**：遵循 React 最佳实践
- **Vite 构建成功**：生产环境编译通过
- **紫色渐变主题**：响应式布局，移动端适配