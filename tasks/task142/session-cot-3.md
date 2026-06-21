我来逐一修复这些问题。首先让我查看当前相关代码的实现。

        
            
toolName: todo_write
            
status: success
          
Todos updated: 3 items
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\group-buying\utils.js
          
好的，我明确了问题。现在开始修复：

### 问题分析：
1. `bestProgress`/`bestGroup` 遍历范围包含了已失败的团 → 应该只考虑进行中和成功的团
2. "已拼 X 人"使用最佳团的反推数字 → 应该使用所有进行中团的真实总参团人数
3. "X 个团进行中"标签 → 应该使用 `ongoingGroups`（只统计进行中），而不是 `totalGroups`



        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\group-buying\utils.js
          
changes: undefined
          
现在修复 index.jsx 中的展示逻辑，使用正确的字段。






        
            
toolName: todo_write
            
status: success
          
Todos updated: 3 items
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\group-buying\index.jsx
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\group-buying\index.jsx
          
现在修复：
1. "已拼 X 人" 改为使用 `activeJoinedPeople`（进行中团的真实总参团人数）
2. "X 个团进行中" 改为使用 `ongoingGroups`（只统计进行中）
3. 剩余名额改为显示所有进行中团聚合的剩余总名额




        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\group-buying\index.jsx
          
changes: undefined
          
现在修改进度条文字部分，使用正确的字段：






        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\group-buying\index.jsx
          
changes: undefined
          
现在更新任务状态，并补充单元测试。







        
            
toolName: todo_write
            
status: success
          
Todos updated: 3 items
          
现在让我更新测试文件，添加针对这三个修复的新测试用例。先读取测试文件中 getProductGroupStats 相关的测试：







        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\group-buying\utils.test.js
          
现在添加新的测试用例，覆盖这三个修复：
1. `activeJoinedPeople` 只统计进行中团的真实总人数
2. `bestProgress` / `bestGroup` 排除失败团
3. `ongoingGroups` 只统计进行中团的数量
4. 空输入时 `activeJoinedPeople` 为 0








        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\group-buying\utils.test.js
          
changes: undefined
          
现在运行测试验证修复是否正确：








        
            
toolName: run_command
            
status: success
          
command: pnpm test -- src/pages/__tests__/group-buying/utils.test.js undefined
          
所有 111 个测试通过了！现在检查 lint 错误。










        
            
toolName: run_command
            
status: success
          
command: pnpm eslint src/pages/group-buying/index.jsx src/pages/group-buying/utils.js src/pages/__tests__/group-buying/utils.test.js 2>&1 undefined
          
Lint 检查也通过了！现在更新任务状态。












        
            
toolName: todo_write
            
status: success
          
Todos updated: 3 items
          
三个问题全部修复完成！以下是修复内容总结：

## ✅ 修复内容总结

### 1. 「已拼 X 人」改为真实总参团人数

**问题**：使用单个最佳团的进度百分比反推人数，与真实数据不符。

**修复**：
- 在 [utils.js](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/group-buying/utils.js#L425-L428) 中新增 `activeJoinedPeople` 字段
  - 只统计所有**进行中**团的 `currentPeople` 之和
  - 排除已成功和已失败的团
- 在 [index.jsx](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/group-buying/index.jsx#L260) 中使用 `displayCurrentPeople = productStats.activeJoinedPeople` 展示真实总人数

### 2. 「X 个团进行中」标签只统计进行中团

**问题**：统计了全部团（包括成功/失败）数量，文字却说是"进行中"。

**修复**：
- 在 [index.jsx](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/group-buying/index.jsx#L333-L334) 中将 `productStats.totalGroups` 改为 `productStats.ongoingGroups`

### 3. 最佳进度排除失败团

**问题**：遍历查找 `bestProgress` / `bestGroup` 时包含失败团，如果失败团在超时前人数较高，会错误地成为"最佳"。

**修复**：
- 在 [utils.js](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/group-buying/utils.js#L442-L451) 中，遍历前先判断 `isGroupFailed(g, now)`，失败团直接跳过
- 最佳进度只从**进行中**和**已成功**的团中评选

---

## 🧪 新增单元测试（4 个）

在 [utils.test.js](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/__tests__/group-buying/utils.test.js) 中新增：

| 测试用例 | 验证点 |
|---|---|
| `activeJoinedPeople only sums ongoing groups and excludes success/failed` | 只累计进行中团的人数 |
| `ongoingGroups count only includes ongoing groups, not success or failed` | ongoingGroups 不包含成功/失败团 |
| `bestProgress and bestGroup exclude failed groups even if they had higher percentage` | 失败团高进度不参与评选 |
| `bestProgress considers both ongoing and success groups, but not failed` | 进行中+成功团都参与，失败团排除 |

同时还为原有测试补充了 `activeJoinedPeople` 的断言。

**最终结果：111 个测试全部通过 ✅，Lint 检查无错误 ✅**