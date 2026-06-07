让我先仔细阅读现有代码，分析每个问题，然后逐一修复。

        
            
toolName: todo_write
            
status: success
          
Todos updated: 7 items
          
先读取所有相关文件：




        
            
toolName: todo_write
            
status: success
          
Todos updated: 7 items
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\calendar\calendarUtils.js
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\calendar\DayView.jsx
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\calendar\WeekView.jsx
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\calendar\constants.js
          
现在我对所有问题有了清晰的理解。让我先修复 calendarUtils.js：
1. 修复 snapTimeToSlot 的边界 BUG
2. 新增跨日事件裁剪定位的纯函数
3. 新增像素/分钟换算的纯函数（统一比例）





        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\calendar\calendarUtils.js
          
changes: undefined
          

        
            
toolName: todo_write
            
status: success
          
Todos updated: 7 items
          
现在重写 DayView.jsx，同时修复跨日事件显示和拖拽闭包/比例问题：





        
            
toolName: Write
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\calendar\DayView.jsx
          
changes: undefined
          

        
            
toolName: todo_write
            
status: success
          
Todos updated: 7 items
          
现在重写 WeekView.jsx，修复所有问题：







        
            
toolName: Write
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\calendar\WeekView.jsx
          
changes: undefined
          
现在补充单元测试。先读取现有测试文件：







        
            
toolName: todo_write
            
status: success
          
Todos updated: 7 items
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\calendar\calendarUtils.test.js
          
现在在测试文件中补充新增函数和边界情况的测试：









        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\calendar\calendarUtils.test.js
          
changes: undefined
          

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\calendar\calendarUtils.test.js
          
changes: undefined
          
我注意到 `pixelsToPixels` 辅助函数放在两个 describe 之间位置不太好，需要移到顶部的辅助函数区域：












        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\calendar\calendarUtils.test.js
          
changes: undefined
          
现在移除文件底部重复的 `pixelsToPixels` 函数：














        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\calendar\calendarUtils.test.js
          
changes: undefined
          
现在运行所有日历单元测试：

















        
            
toolName: todo_write
            
status: success
          
Todos updated: 7 items
          

        
            
toolName: run_command
            
status: success
          
command: pnpm test -- src/pages/__tests__/calendar/ 2>&1 undefined
          
两个测试失败了。让我修复：

1. `pixelsToPixels` 辅助函数没有正确传递 `hourHeight` 参数
2. 跨日全天事件高度有浮点精度问题（endOfDay 是 23:59:59.999，比 24 小时少 1ms）

先修复 `getDayViewEventPosition` 函数，使用次日 00:00 作为上界（更精确）：


















        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\calendar\calendarUtils.js
          
changes: undefined
          
现在修复测试中的 `pixelsToPixels` 辅助函数：


















        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\calendar\calendarUtils.test.js
          
changes: undefined
          
现在重新运行测试：





















        
            
toolName: run_command
            
status: success
          
command: pnpm test -- src/pages/__tests__/calendar/ 2>&1 undefined
          
测试期望写错了——`pixelsToPixels` 是一个往返校验（像素→分钟→像素），结果应该等于输入的 30。让我修正测试：




















        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\calendar\calendarUtils.test.js
          
changes: undefined
          

        
            
toolName: run_command
            
status: success
          
command: pnpm test -- src/pages/__tests__/calendar/ 2>&1 undefined
          
全部 66 个测试通过！现在检查所有日历文件的诊断，确保没有 lint 错误：


















        
            
toolName: todo_write
            
status: success
          
Todos updated: 7 items
          

        
            
toolName: GetDiagnostics
            
status: success
          
          

        
            
toolName: GetDiagnostics
            
status: success
          
          

        
            
toolName: GetDiagnostics
            
status: success
          
          

        
            
toolName: GetDiagnostics
            
status: success
          
          

        
            
toolName: GetDiagnostics
            
status: success
          
          

        
            
toolName: GetDiagnostics
            
status: success
          
          
所有日历文件都没有 lint 错误。让我检查一下 CSS 的响应式部分，确保 375px 移动端布局没问题：

















        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\calendar\calendar.css
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\calendar\calendar.css
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\calendar\calendar.css
          
响应式布局看起来没问题。让我运行所有测试，确保整个项目测试都通过：


















        
            
toolName: run_command
            
status: success
          
command: pnpm test 2>&1 undefined
          
让我查看 package.json 的 scripts 配置：




















        
            
toolName: search_by_regex
            
status: success
          
query: scripts
          
测试命令运行了错误的 lint。让我直接运行 vitest：





















        
            
toolName: run_command
            
status: success
          
command: npx vitest run 2>&1 undefined
          
所有日历相关测试全部通过（66/66）！唯一失败的是 `map-area` 模块的一个预存测试，与我的日历修复无关。现在启动开发服务器验证：



















        
            
toolName: run_command
            
status: running
          
command: pnpm run dev undefined
          
开发服务器已启动成功。让我把预览地址给你：



















        
            
toolName: open_preview
            
status: success
          
预览
          

        
            
toolName: todo_write
            
status: success
          
Todos updated: 7 items
          
所有问题已修复完毕！以下是修复总结：

---

## 🔧 修复的问题汇总

### 1. `snapTimeToSlot` 边界 BUG 修复
**文件**: [calendarUtils.js](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/calendar/calendarUtils.js#L350-L357)

**原问题**: `setMinutes(60)` 已自动让小时进位，但代码又额外执行了一次 `setHours(getHours()+1)`，导致 9:53 → 11:00（应该是 10:00）。

**修复方案**: 改用总分钟数计算并一次性设置时间，避免分步操作的进位冲突。

---

### 2. 跨日事件显示位置裁剪
**新增函数**: [getDayViewEventPosition](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/calendar/calendarUtils.js#L369-L388) 和 [getWeekViewEventPosition](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/calendar/calendarUtils.js#L390-L392)

**原问题**: 昨晚 22:00 开始、今天凌晨 2:00 结束的事件，top = 22×60 = 1320px，完全超出可视区。

**修复方案**: 将事件的 startTime 和 endTime 裁剪到当天 [00:00, 次日00:00) 范围内再计算 top 和 height。使用次日 00:00（而非 endOfDay=23:59:59.999）作为上界，避免浮点精度问题。

---

### 3. 日视图拖拽：闭包 + 比例问题
**文件**: [DayView.jsx](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/calendar/DayView.jsx)

**原问题 A（闭包）**: `handleMove` 在 `handleEventMouseDown` 内创建，引用了当时 render 闭包中的 `dragging` state（恒为 null），后续 setState 后的新值拿不到。

**修复**: 用 `useRef`（`dragStateRef`）存储拖拽状态，`handleMove` 通过 ref 读取最新值，而不是读闭包中的旧 state。

**原问题 B（比例不一致）**: 渲染用 60px/hour = 1px/min，但拖拽硬编码了 `PIXELS_PER_MINUTE = 1.2`。

**修复**: 抽出纯函数 [pixelsToMinutes / minutesToPixels](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/calendar/calendarUtils.js#L359-L367)，统一以 `hourHeight / 60` 作为比例，渲染和拖拽共用同一换算逻辑。

---

### 4. 周视图拖拽：闭包 + 比例 + 硬编码列宽
**文件**: [WeekView.jsx](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/calendar/WeekView.jsx)

**修复内容**:
- 同 DayView：改用 `dragStateRef` 存拖拽状态，统一用 `pixelsToMinutes` 换算时间
- **动态列宽**: 在 `handleEventMouseDown` 时通过 `columnsContainerRef` 测量实际列宽 `getColumnWidth()`，记录进拖拽状态，替代硬编码的 180px，保证移动端和桌面端跨日拖拽跳数一致
- 修复了 `weekEvents` 过滤逻辑：原来按 `isSameDay(startTime, dayDate)` 过滤，跨日事件会丢失；现在改为判断事件时间范围与当天是否相交

---

### 5. 新增纯逻辑单元测试
**文件**: [calendarUtils.test.js](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/__tests__/calendar/calendarUtils.test.js)

新增测试用例 12 个，覆盖：
| 分组 | 用例数 | 测试点 |
|---|---|---|
| snapTimeToSlot | 4 | 正常吸附、**进位不加倍**、跨天吸附(23:53→00:00)、自定义 slot 分钟 |
| 像素/分钟换算 | 3 | 比例为 1.0、正反运算互逆、不同 hourHeight 一致性 |
| 跨日事件裁剪 | 6 | 同日正常、起始跨日(top=0)、结束跨日、全天跨日、最短高度兜底、WeekView 委托一致性 |

---

## ✅ 验证结果

- **日历单测**: 66/66 通过
- **全量单测**: 1177/1178 通过（唯一失败是 `map-area` 模块预存问题，与日历无关）
- **Lint 诊断**: 7 个日历相关文件全部 0 error
- **开发服务器**: 已在 http://localhost:5175/#/calendar 运行，可手动验证 375px 移动端和 1440px 桌面端布局