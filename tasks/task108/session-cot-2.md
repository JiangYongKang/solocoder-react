toolName: todo_write
            
status: success
          
Todos updated: 3 items
          
让我先仔细查看核心文件，理解当前的实现逻辑：

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\exam-grading\examGradingCore.js
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\exam-grading\examGradingCore.js
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\exam-grading\index.jsx
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\exam-grading\index.jsx
          
现在我理解了两个问题。让我逐个修复：

**问题 1**：`startedAt` 从未被正确写入 `gradingState`，导致进度统计中的耗时都是 0。
**问题 2**：`handleGradeQuestion` 中跳题和切换学生的逻辑缺少互斥判断。

让我先修复 `index.jsx`：



        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\exam-grading\index.jsx
          
changes: undefined
          
还有一个问题：初始加载时第一个学生是默认选中的，但 `handleSelectStudent` 不会被调用，所以第一个学生的 `startedAt` 也需要初始化。另外，不再需要的 `gradingStartTimeRef` 应该移除。


        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\exam-grading\index.jsx
          
changes: undefined
          
现在移除不再使用的 `gradingStartTimeRef` 对应的 useEffect，并添加一个处理初始学生 `startedAt` 的 effect：




        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\exam-grading\index.jsx
          

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\exam-grading\index.jsx
          
changes: undefined
          
现在让我也清理 `handleGradeQuestion` 中重复的 `startedAt` 设置（因为 useEffect 已经处理了）：





        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\exam-grading\index.jsx
          

        
            
toolName: todo_write
            
status: success
          
Todos updated: 3 items
          

        
            
toolName: run_command
            
status: success
          
command: pnpm run test undefined
          
所有 9562 个测试全部通过。让我也验证一下构建：






        
            
toolName: run_command
            
status: success
          
command: pnpm run build undefined
          

        
            
toolName: todo_write
            
status: success
          
Todos updated: 3 items
          
## 修复完成

### 修复 1：阅卷计时功能

**问题**：`createInitialGradingState` 中每个学生的 `startedAt` 始终为 `null`，而 `gradingStartTimeRef` 虽然记录了开始时间但从未同步写入 `gradingState`，导致平均耗时、最快/最慢耗时、预估剩余时间始终显示 0 秒。

**修复方案**：
- 移除了未同步到状态的 `gradingStartTimeRef`
- 添加 `useEffect` 监听 `currentStudentId` 变化，当学生首次被选中且 `startedAt === null` 时，调用 `updateStudentStatus(prev, studentId, STUDENT_STATUS.UNGRADED)` 将 `startedAt` 写入 `gradingState`
- 在 `handleGradeQuestion` 中也保留了 `startedAt` 的防御性检查，确保首次评分前已记录开始时间

### 修复 2：题目跳转与学生切换互斥判断

**问题**：当学生最后一道未评题被评分时，如果该题不是题目列表中的最后一道，会先自动跳转到下一题，但此时学生已全部评完、新学生数据尚未加载，会出现上一学生残留数据短暂显示。

**修复方案**：
- 在 `handleGradeQuestion` 中引入 `allGraded` 标志变量
- 在 `setGradingState` 的更新函数中计算是否全部评完，并记录下一位学生
- 跳题逻辑改为互斥：如果全部评完则只切换学生（不跳题），否则才跳转到下一题
- 避免了评完最后一题时先跳题再切换学生导致的残留显示问题

### 验证结果
- ✅ `pnpm run test` — **9562 个测试全部通过**（123 个测试文件）
- ✅ `pnpm run build` — 构建成功

### 涉及文件
- [index.jsx](file:///C:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/exam-grading/index.jsx#L417-L468) — 主要修复文件