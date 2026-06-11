toolName: todo_write
            
status: success
          
Todos updated: 2 items
          
问题根源在于 `groupByWeek` 中 `dayGroups` 的 key 只用了日期的"日"部分（如"01"），导致标签计算时无法获取正确的月份。修复方案：将 `dayGroups` 的 key 改为完整日期字符串，标签直接从实际日期提取月份。
        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\event-timeline\timelineUtils.js
          

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\event-timeline\timelineUtils.js
          
changes: undefined
          
现在修复 [index.jsx](file:///C:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/event-timeline/index.jsx) 中的 `getSubGroupLabel`，让周级别的标签直接从实际日期字符串提取月份：
        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\event-timeline\index.jsx
          

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\event-timeline\index.jsx
          
changes: undefined
          
现在更新测试中 `groupByWeek` 相关用例，因为 dayGroups 的 key 已经从日号改为完整日期：
        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\event-timeline\timelineUtils.test.js
          
现在添加一个专门测试跨月周分组的用例：
        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\event-timeline\timelineUtils.test.js
          
changes: undefined
          

        
            
toolName: todo_write
            
status: success
          
Todos updated: 2 items
          

        
            
toolName: run_command
            
status: success
          
command: cd c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react ; pnpm test src/pages/__tests__/event-timeline/timelineUtils.test.js undefined
          
83 个测试全部通过。再跑一下 lint 确认无回归：
        
            
toolName: run_command
            
status: success
          
command: cd c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react ; pnpm eslint src/pages/event-timeline/ 2>&1 undefined
          

        
            
toolName: todo_write
            
status: success
          
Todos updated: 2 items
          
修复完成！✅

## 问题分析与修复

**根因**：[groupByWeek](file:///C:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/event-timeline/timelineUtils.js#L430) 中 `dayGroups` 的 key 只取了日期的"日"部分（`evt.date.slice(8, 10)`，如 `"01"`），导致 [getSubGroupLabel](file:///C:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/event-timeline/index.jsx#L198) 中计算月份时只能靠 `weekStart + 偏移量` 推算，跨月周（如 weekStart=5月27日，含6月1日事件）就会显示"5月1日"而非正确的"6月1日"。

**修复**（2处改动）：

1. [timelineUtils.js#L449](file:///C:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/event-timeline/timelineUtils.js#L449) — `dayGroups` 的 key 从日号 `"01"` 改为完整日期 `"2024-06-01"`，保留完整的月份信息
2. [index.jsx#L212-L213](file:///C:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/event-timeline/index.jsx#L212-L213) — 周级别标签直接用 `formatDayLabelWithMonth(subKey)` 从实际日期提取月日，不再用 weekStart 偏移推算

新增跨月周分组测试用例验证修复正确性，**83 个测试全部通过**，ESLint 0 错误。