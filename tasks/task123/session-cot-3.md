好的，我来逐一修复这 4 个问题。

        
            
toolName: todo_write
            
status: success
          
Todos updated: 4 items
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\flashcard\flashcardUtils.js
          
现在一次性修改 flashcardUtils.js 中的三个函数：修复 getUniqueTags 的 color 兜底、拆分 buildHeatmapData、用对数尺度改进 getHeatmapCellColor：


        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\flashcard\flashcardUtils.js
          
changes: undefined
          

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\flashcard\flashcardUtils.js
          
changes: undefined
          
现在更新 StatsPanel.jsx，使用新的拆分函数，并补充测试：



        
            
toolName: todo_write
            
status: success
          
Todos updated: 4 items
          

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\flashcard\StatsPanel.jsx
          
changes: undefined
          
现在更新测试文件，补充和修正测试：





        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\flashcard\flashcardUtils.test.js
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\flashcard\flashcardUtils.test.js
          

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\flashcard\flashcardUtils.test.js
          
changes: undefined
          
现在修正 getUniqueTags 的测试，添加对象缺 color 的测试；修正热力图和颜色分级的测试：







        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\flashcard\flashcardUtils.test.js
          
changes: undefined
          
现在修正 buildHeatmapData 和 getHeatmapCellColor 的测试，增加拆分函数和对数分级的测试：

















        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\flashcard\flashcardUtils.test.js
          
changes: undefined
          
现在运行测试验证所有修复：









        
            
toolName: run_command
            
status: success
          
command: npm run test -- src/pages/__tests__/flashcard/ undefined
          
104 个测试全部通过！再运行 ESLint 检查：








        
            
toolName: run_command
            
status: success
          
command: npx eslint src/pages/flashcard/ undefined
          
color-toolkit 的测试失败是其他页面原有的问题，和我们的 flashcard 无关。再确认 flashcard 的 eslint：







        
            
toolName: run_command
            
status: success
          
command: npx eslint --no-eslintrc --config .eslintrc.cjs src/pages/flashcard/ 2>&1 | Out-String undefined
          

        
            
toolName: GetDiagnostics
            
status: success
          
          

        
            
toolName: GetDiagnostics
            
status: success
          
          

        
            
toolName: todo_write
            
status: success
          
Todos updated: 4 items
          
4 个问题全部修复完成！以下是修复详情：

---

### 1. 对数尺度改进热力图分级 ✅

**问题**：原 `count>=3` 就全部是最深绿，3 张和 50 张无法区分。

**修复**（[flashcardUtils.js](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/flashcard/flashcardUtils.js#L312-L325)）：
- 新增 `getHeatmapLevel(count)` 函数，用自然对数 `Math.log(count+1)` 映射到 4 级等级
- 颜色分级对照表（4 级绿色）：
  | count 范围 | 等级 | 颜色 |
  |---|---|---|
  | 0 | 0 | `#9be9a8`（最浅）|
  | 1~2 | 0~1 | `#9be9a8` / `#40c463` |
  | 3~6 | 1 | `#40c463` |
  | 7~19 | 2 | `#30a14e` |
  | ≥20 | 3 | `#216e39`（最深）|
- 测试断言：`3张(等级1)` 与 `50张(等级3)` **颜色不同**

---

### 2. getUniqueTags color 兜底 ✅

**问题**：对象格式缺 color 属性时返回 `{ text, color: undefined }`。

**修复**（[flashcardUtils.js](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/flashcard/flashcardUtils.js#L199-L217)）：
- 严格检查：`typeof tag.color === 'string' && tag.color.trim() !== ''`
- 不满足时统一兜底为默认值 `#6b7280`
- 新增测试覆盖：无 color、color 空串、color 为 null 三种异常情况

---

### 3. 拆分 buildHeatmapData ✅

**问题**：同一函数通过运行时类型判断承担两种职责，耦合严重。

**修复**（[flashcardUtils.js](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/flashcard/flashcardUtils.js#L257-L310)）：
- 拆分为两个职责单一的函数：
  - `buildHeatmapFromDates(studyDates, days)` — 接收日期数组，count 取 0/1
  - `buildHeatmapFromStats(studyStats, days)` — 接收 stats 对象，count 取每日 total
- 保留 `buildHeatmapData` 作为兼容入口，根据类型委托调用
- [StatsPanel.jsx](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/flashcard/StatsPanel.jsx#L4) 改为直接调用 `buildHeatmapFromStats`

---

### 4. 补充单元测试 ✅

新增/修正测试 12 个，总计 **104 个测试全部通过**：

| 新增测试用例 | 覆盖点 |
|---|---|
| `getUniqueTags` 对象缺 color 兜底 | 3 种异常格式返回默认色 |
| `buildHeatmapFromDates` | 数组输入、count=0/1、Set 逻辑 |
| `buildHeatmapFromStats` | 对象输入、count=total、null/undefined 容错 |
| `buildHeatmapData` 兼容入口 | 数组→FromDates、对象→FromStats 委托正确 |
| `getHeatmapLevel`（全新）| 对数分级、边界值、3 张≠50 张 |
| `getHeatmapCellColor` | 对数等级颜色、3 张≠50 张同色回归测试 |