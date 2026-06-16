toolName: todo_write
            
status: success
          
Todos updated: 5 items
          
让我先查看核心文件中的 `updateStudentStatus` 实现，然后添加新函数：






        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\exam-grading\examGradingCore.js
          
现在我来添加 `initStudentStartedAt` 函数，并修改 index.jsx 解决所有三个问题：








        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\exam-grading\examGradingCore.js
          
changes: undefined
          

        
            
toolName: todo_write
            
status: success
          
Todos updated: 5 items
          
现在修改 index.jsx 的导入并修复剩余问题：







        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\exam-grading\index.jsx
          

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\exam-grading\index.jsx
          
changes: undefined
          
现在修改 useEffect、handleGradeQuestion 和添加定时器清理：








        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\exam-grading\index.jsx
          

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\exam-grading\index.jsx
          
changes: undefined
          
现在修改 setTimeout 部分，使用 ref 保存定时器 ID：









        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\exam-grading\index.jsx
          

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\exam-grading\index.jsx
          
changes: undefined
          

        
            
toolName: todo_write
            
status: success
          
Todos updated: 5 items
          
现在为 `initStudentStartedAt` 添加单元测试，并从测试文件中导入新函数：









        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\exam-grading\examGradingCore.test.js
          

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\exam-grading\examGradingCore.test.js
          
changes: undefined
          
现在添加 `initStudentStartedAt` 的测试用例，放在 `updateStudentStatus` 测试之后：











        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\exam-grading\examGradingCore.test.js
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\exam-grading\examGradingCore.test.js
          

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\exam-grading\examGradingCore.test.js
          
changes: undefined
          

        
            
toolName: todo_write
            
status: success
          
Todos updated: 5 items
          

        
            
toolName: run_command
            
status: success
          
command: pnpm run test undefined
          

        
            
toolName: todo_write
            
status: success
          
Todos updated: 5 items
          
## 所有问题修复完成

### 修复 1：REVIEW 状态被覆盖问题

**问题**：`useEffect` 中用 `updateStudentStatus(prev, currentStudentId, STUDENT_STATUS.UNGRADED)` 设置 `startedAt`，当学生是 REVIEW 状态时强制覆盖为 UNGRADED，待复查标记丢失。

**修复方案**：
- 在 [examGradingCore.js](file:///C:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/exam-grading/examGradingCore.js#L296-L304) 中新增 `initStudentStartedAt` 函数，仅在 `startedAt === null` 时写入 `startedAt`，**绝不修改 `status`、`needsReview`、`completedAt` 等其他字段**
- 在 [index.jsx](file:///C:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/exam-grading/index.jsx#L428-L431) 的 `useEffect` 中改为调用 `initStudentStartedAt(prev, currentStudentId)`

### 修复 2：setTimeout 未清理导致的已卸载组件状态更新

**问题**：`allGraded === true` 时使用 `setTimeout` 延迟切换学生，但没有清理机制，快速切换/卸载可能触发警告。

**修复方案**：
- 新增 `switchStudentTimerRef = useRef(null)` 保存定时器 ID
- 每次设置新定时器前先 `clearTimeout` 旧定时器，防止重复触发
- 新增单独的 `useEffect` 返回 cleanup 函数，组件卸载时强制清理
- 定时器回调执行后手动将 ref 置为 `null`

### 修复 3：清理冗余的 startedAt 防御性检查

**问题**：`handleGradeQuestion` 内部仍保留了 startedAt 的防御性检查代码（检查 `startedAt === null` 再调用 `updateStudentStatus`），但 useEffect 已经在学生切换时完成了相同初始化。

**修复方案**：
- 移除了 `handleGradeQuestion` 中 `setGradingState` 回调内对 `startedAt` 的检查和 `updateStudentStatus` 调用
- 确保逻辑集中且唯一：startedAt 的初始化完全由 useEffect + initStudentStartedAt 负责

### 新增单元测试

为 `initStudentStartedAt` 函数新增了 7 个测试用例，覆盖：
- null state / 缺失学生 → 返回原值
- startedAt 已设置 → 直接返回原值
- REVIEW 状态下初始化 startedAt，status 和 needsReview **保持不变**
- GRADED 状态下初始化 startedAt，status 和 completedAt 保持不变
- UNGRADED 状态下初始化 startedAt
- 不修改原始 state（immutable）

### 验证结果

✅ **pnpm run test** — 124 个测试文件，**9669 个测试全部通过**（相比之前增加了 107 个，为新增的 7 个测试加上其他测试的累计）