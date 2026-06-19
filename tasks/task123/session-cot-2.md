好的，我来逐一修复这 4 个问题。
        
            
toolName: todo_write
            
status: success
          
Todos updated: 4 items
          
先统一标签数据格式为 `{ text, color }` 对象，更新工具函数：


        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\flashcard\flashcardUtils.js
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\flashcard\flashcardUtils.js
          
现在修改工具函数中的标签相关逻辑，统一为 `{ text, color }` 对象格式：





        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\flashcard\flashcardUtils.js
          
changes: undefined
          

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\flashcard\flashcardUtils.js
          
changes: undefined
          
现在更新 CardList.jsx，使用标签的 color 属性而不是硬编码灰色：





        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\flashcard\CardList.jsx
          

        
            
toolName: Write
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\flashcard\CardList.jsx
          
changes: undefined
          

        
            
toolName: todo_write
            
status: success
          
Todos updated: 4 items
          
现在修复问题2：StudyMode 最后一张卡片重复调用 recordStudySession 的问题。移除 handleAnswer 中对 onFinish 的调用，让 finished 界面作为唯一出口：







        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\flashcard\StudyMode.jsx
          

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\flashcard\StudyMode.jsx
          
changes: undefined
          

        
            
toolName: todo_write
            
status: success
          
Todos updated: 4 items
          
现在修复问题3：热力图需要根据每日学习量显示不同颜色深度。先更新 buildHeatmapData 函数，增加从 stats 对象获取每日学习数量的能力：








        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\flashcard\flashcardUtils.js
          

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\flashcard\flashcardUtils.js
          
changes: undefined
          
现在更新 StatsPanel 组件，传入 stats 对象并使用 count 显示热力图深浅：










        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\flashcard\StatsPanel.jsx
          

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\flashcard\StatsPanel.jsx
          
changes: undefined
          

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\flashcard\StatsPanel.jsx
          
changes: undefined
          

        
            
toolName: todo_write
            
status: success
          
Todos updated: 4 items
          
现在补充单元测试，覆盖修复的逻辑。先看现有测试的相关部分：







        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\flashcard\flashcardUtils.test.js
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\flashcard\flashcardUtils.test.js
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\flashcard\flashcardUtils.test.js
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\flashcard\flashcardUtils.test.js
          
现在补充单元测试。在现有测试基础上添加标签对象格式和热力图 stats 对象的测试：










        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\flashcard\flashcardUtils.test.js
          
changes: undefined
          
现在添加热力图 stats 对象的测试和 recordStudySession 不重复累加的测试：










        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\flashcard\flashcardUtils.test.js
          
changes: undefined
          
现在运行测试验证所有修复是否正确：












        
            
toolName: run_command
            
status: success
          
command: cd "c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react" ; npm run test -- src/pages/__tests__/flashcard/ undefined
          
92 个测试全部通过！再运行 eslint 确认代码没有问题：









        
            
toolName: run_command
            
status: success
          
command: cd "c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react" ; npx eslint src/pages/flashcard/ undefined
          
修复 buildHeatmapData 中无用赋值的 lint 错误：












        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\flashcard\flashcardUtils.js
          
changes: undefined
          
其实更好的做法是把 Set 创建提到循环外面，优化性能。让我重构一下：















        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\flashcard\flashcardUtils.js
          
changes: undefined
          

        
            
toolName: run_command
            
status: success
          
command: cd "c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react" ; npx eslint src/pages/flashcard/ undefined
          

        
            
toolName: run_command
            
status: success
          
command: npx eslint src/pages/flashcard/ undefined
          
ESLint 检查通过！再运行一次测试确认全部通过：














        
            
toolName: run_command
            
status: success
          
command: npm run test -- src/pages/__tests__/flashcard/ undefined
          

        
            
toolName: todo_write
            
status: success
          
Todos updated: 4 items
          
4 个问题全部修复完成！以下是修复详情：

---

### 1. 标签数据格式不一致 ✅

**问题**：`CardEditModal.jsx` 中标签存为 `{ text, color }` 对象，但工具函数按纯字符串处理，导致显示 `[object Object]`、筛选失效、颜色硬编码。

**修复**：
- 新增内部辅助函数 `getTagText()` 统一处理两种格式
- [flashcardUtils.js](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/flashcard/flashcardUtils.js#L183-L197) 中 `filterCardsByTags` 支持字符串/对象混合筛选
- [flashcardUtils.js](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/flashcard/flashcardUtils.js#L199-L214) 中 `getUniqueTags` 返回 `{ text, color }` 对象，首次出现的颜色被保留
- [CardList.jsx](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/flashcard/CardList.jsx) 中标签使用 `tag.color` 显示真实颜色，筛选 chip 激活时也使用对应颜色

---

### 2. StudyMode 重复调用 recordStudySession ✅

**问题**：最后一张卡片答题时，`handleAnswer` 内立即调用 `onFinish(results)` 用了旧值；用户点击「返回」时又调用一次 `onFinish(results)` 用了新值，导致重复累加。

**修复**：
- [StudyMode.jsx](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/flashcard/StudyMode.jsx#L31-L47) 中 `handleAnswer` 只设置 `finished=true` 和更新 `results`，不再调用 `onFinish`
- finished 结算界面的「返回」按钮作为唯一出口，确保只调用一次 `onFinish(results)` 且数据完整

---

### 3. 热力图 count 始终为 0 ✅

**问题**：`StatsPanel` 只传日期数组给 `buildHeatmapData`，`getHeatmapCellColor` 收不到 count，所有学习日都是同一种浅绿色。

**修复**：
- [flashcardUtils.js](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/flashcard/flashcardUtils.js#L254-L290) 中 `buildHeatmapData` 同时支持 `日期数组` 和 `stats 对象` 两种输入；传 stats 时从 `dayStats.total` 读取每日学习数
- [StatsPanel.jsx](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/flashcard/StatsPanel.jsx#L13) 直接传入 `stats` 对象，`getHeatmapCellColor` 调用传入 `cell.count`
- 热力图 tooltip 显示每日学习张数

---

### 4. 补充单元测试 ✅

新增测试 7 个，共 **92 个测试全部通过**：

- `filterCardsByTags`：对象格式筛选、混合格式筛选
- `getUniqueTags`：对象格式返回带 color、同 text 去重保留首次 color、字符串转默认 color 对象
- `buildHeatmapData`：日期数组 count=1、stats 对象 count=total、无记录 count=0
- `getHeatmapCellColor`：四级颜色分级更详细的边界测试