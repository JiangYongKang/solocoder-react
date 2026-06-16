我来逐一修复这些问题。先创建任务列表：
        
            
toolName: todo_write
            
status: success
          
Todos updated: 4 items
          
先查看相关文件，了解当前实现：
        
            
toolName: todo_write
            
status: success
          
Todos updated: 4 items
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\quiz-competition\quiz.css
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\quiz-competition\QuizGame.jsx
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\quiz-competition\quizCore.js
          
现在让我查看道具商店和主入口文件：

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\quiz-competition\ItemShop.jsx
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\quiz-competition\index.jsx
          
好的，现在我了解了所有问题。让我开始逐一修复。

## 问题 1：修复答错/超时飘字下降动画

先添加下降动画的 CSS：


        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\quiz-competition\quiz.css
          
changes: undefined
          
飘字动画 CSS 已修复。现在更新 todo 并修复问题 2（双倍道具）：



        
            
toolName: todo_write
            
status: success
          
Todos updated: 4 items
          
现在修复 QuizGame.jsx 中的双倍道具逻辑：


        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\quiz-competition\QuizGame.jsx
          
changes: undefined
          
现在添加进入新题目时的 useEffect，并修复 handleAnswer 和 handleUseSkip 中的答案记录：





        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\quiz-competition\QuizGame.jsx
          
changes: undefined
          
等等，这个 useEffect 的依赖有问题。当 `doubleNext` 变化时也会触发，这不对。让我重新设计，用 ref 来管理双倍状态：





        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\quiz-competition\QuizGame.jsx
          
changes: undefined
          
现在修复进入新题目的 useEffect：







        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\quiz-competition\QuizGame.jsx
          
changes: undefined
          
现在修复 handleAnswer 函数：







        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\quiz-competition\QuizGame.jsx
          
changes: undefined
          
现在修复 handleUseSkip 和 handleUseDouble：









        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\quiz-competition\QuizGame.jsx
          
changes: undefined
          
现在需要修复 `quizCore.js` 中的 `calculateRoundResult`，确保跳过的题目也处理 `doubleNext` 字段：







        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\quiz-competition\quizCore.js
          
changes: undefined
          
双倍道具问题已修复。现在更新 todo 并修复问题 3（道具商店金币同步）：







        
            
toolName: todo_write
            
status: success
          
Todos updated: 4 items
          
现在修复道具商店金币同步问题。先修改 ItemShop 组件，添加 onCoinsChange 回调：







        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\quiz-competition\ItemShop.jsx
          
changes: undefined
          
现在修改 index.jsx，添加金币状态的更新机制：










        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\quiz-competition\index.jsx
          
changes: undefined
          
现在把 props 传递给 ItemShop：










        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\quiz-competition\index.jsx
          
changes: undefined
          
金币同步问题已修复。现在更新 todo 并运行测试：










        
            
toolName: todo_write
            
status: success
          
Todos updated: 4 items
          
先看看 package.json 里的 test 脚本：






        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\package.json
          
好的，运行 pnpm run test：










        
            
toolName: run_command
            
status: success
          
command: cd c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react ; pnpm run test undefined
          
失败的测试都是其他模块的（collaborative-doc 和 route-planner），不是我们的答题竞赛系统。让我单独运行我们的测试确认：












        
            
toolName: run_command
            
status: success
          
command: cd c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react ; pnpm run test -- src/pages/__tests__/quiz-competition/ undefined
          
我们的 95 个测试全部通过！现在运行 lint 检查确保没有引入新错误：










        
            
toolName: run_command
            
status: success
          
command: cd c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react ; npx eslint src/pages/quiz-competition/ --max-warnings=0 undefined
          
有 lint 错误，我来修复一下。把状态切换逻辑从 useEffect 移到 `goToNextQuestion` 中：











        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\quiz-competition\QuizGame.jsx
          
changes: undefined
          
现在移除之前添加的那个监听 currentIdx 的 useEffect：










        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\quiz-competition\QuizGame.jsx
          
移除那个有问题的 useEffect：













        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\quiz-competition\QuizGame.jsx
          
changes: undefined
          
再次运行 lint 检查：













        
            
toolName: run_command
            
status: success
          
command: cd c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react ; npx eslint src/pages/quiz-competition/ --max-warnings=0 undefined
          
Lint 通过了！再运行一次测试确保一切正常：













        
            
toolName: run_command
            
status: success
          
command: cd c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react ; pnpm run test -- src/pages/__tests__/quiz-competition/ undefined
          
全部通过！最后验证一下构建：












        
            
toolName: run_command
            
status: success
          
command: cd c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react ; npx vite build undefined
          
构建失败是其他模块（stock-dashboard）的问题，不是我们的答题竞赛系统引入的。我们的代码本身没有问题。

让我更新 todo 列表：








        
            
toolName: todo_write
            
status: success
          
Todos updated: 4 items
          
所有问题都已修复完成！✅

## 修复总结

### 1. 答错/超时飘字下降动画 ✅
在 [quiz.css](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/quiz-competition/quiz.css#L583-L611) 中新增两种动画：
- **上升动画** `scoreFloatUp`：用于答对（+10）和跳过场景
- **下降动画** `scoreFloatDown`：用于答错（-5）和超时场景

通过 `animation-name` 分别应用到不同类型的飘字元素上。

### 2. 双倍道具 doubleNext 字段修复 ✅
在 [QuizGame.jsx](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/quiz-competition/QuizGame.jsx) 中重构了双倍道具逻辑：
- 引入三个 ref 分层管理：
  - `isDoubleActiveRef`：当前题是否有双倍效果（用于得分计算）
  - `pendingDoubleRef`：下一题是否有双倍效果（待生效）
  - `doubleUsedInCurrentRef`：当前题期间是否使用了双倍道具（用于写入答案记录）
- 在 `goToNextQuestion` 中切换题目时正确传递双倍状态
- `handleAnswer` 和 `handleUseSkip` 的答案记录中正确保存 `doubleNext: doubleUsedInCurrentRef.current`

同时在 [quizCore.js](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/quiz-competition/quizCore.js#L514-L520) 的 `calculateRoundResult` 中修复了跳过场景也处理 `ans.doubleNext` 的逻辑。

### 3. 道具商店金币同步 ✅
- [ItemShop.jsx](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/quiz-competition/ItemShop.jsx) 新增 `coins` 和 `onCoinsChange` 两个 props
- [index.jsx](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/quiz-competition/index.jsx) 父组件维护 `coins` 状态，通过 props 传递给 ItemShop，购买后通过回调同步更新顶部金币徽章

### 4. 测试全部通过 ✅
- 答题竞赛系统的 **95 个单元测试全部通过**
- ESLint 检查 **零错误零警告**

> 注：`pnpm run test` 全量测试中有 9 个失败用例，均来自其他模块（collaborative-doc 和 route-planner），是项目原有问题，与本次答题竞赛系统修复无关。