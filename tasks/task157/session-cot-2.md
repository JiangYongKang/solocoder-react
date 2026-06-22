toolName: todo_write
            
status: success
          
Todos updated: 5 items
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\ab-test\abTestCore.js
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\ab-test\constants.js
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\ab-test\index.jsx
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\ab-test\abTestCore.test.js
          

        
            
toolName: search_by_regex
            
status: success
          
query: METRIC_KEYS
          

        
            
toolName: search_by_regex
            
status: success
          
query: gammaLn|regularizedIncompleteBeta|betaCF
          

        
            
toolName: search_by_regex
            
status: success
          
query: METRIC_KEYS
          
现在所有信息都已收集完毕，开始逐一修复。
        
            
toolName: todo_write
            
status: success
          
Todos updated: 6 items
          

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\ab-test\abTestCore.js
          
changes: undefined
          

        
            
toolName: todo_write
            
status: success
          
Todos updated: 6 items
          
现在修复 `updateTimeSeriesData`，让它追加新数据点而不是替换最后一天：
        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\ab-test\abTestCore.js
          
changes: undefined
          

        
            
toolName: todo_write
            
status: success
          
Todos updated: 6 items
          

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\ab-test\constants.js
          
changes: undefined
          

        
            
toolName: todo_write
            
status: success
          
Todos updated: 6 items
          
现在修复第4个问题——移除多余的 prop→state 同步 useEffect。这需要重构两个组件：

1. **`ExperimentDetail`**：移除 `useEffect(() => { setCurrentExperiment(experiment) }, [experiment])`，改用 `key` 属性强制重新挂载
2. **`ABTestPage`**：将 `viewingExperiment` 从 state+useEffect 同步改为从 `experiments` 直接计算
        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\ab-test\index.jsx
          
changes: undefined
          
现在更新父组件 `ABTestPage`，将 `viewingExperiment` 从状态同步改为派生计算，并给 `ExperimentDetail` 加上 `key` 属性：
        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\ab-test\index.jsx
          
changes: undefined
          
现在更新 `handleBackToList`，移除 `setViewingExperiment` 调用：
        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\ab-test\index.jsx
          
changes: undefined
          
现在给 `ExperimentDetail` 加上 `key` 属性，确保切换实验时组件重新挂载：
        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\ab-test\index.jsx
          
changes: undefined
          
现在移除不再需要的 `useEffect` 导入（如果页面不再使用它的话），让我先检查一下：
        
            
toolName: search_by_regex
            
status: success
          
query: useEffect
          
`useEffect` 仍在 `ExperimentDetail` 中使用（定时器），所以保留。现在更新测试文件：
        
            
toolName: todo_write
            
status: success
          
Todos updated: 6 items
          

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\ab-test\abTestCore.test.js
          
changes: undefined
          
现在删除 `gammaLn` 的测试用例：
        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\ab-test\abTestCore.test.js
          
changes: undefined
          
现在更新 `updateTimeSeriesData` 的测试，验证它追加新数据点而非替换：
        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\ab-test\abTestCore.test.js
          
changes: undefined
          

        
            
toolName: todo_write
            
status: success
          
Todos updated: 6 items
          

        
            
toolName: run_command
            
status: success
          
command: npm test -- src/pages/__tests__/ab-test/abTestCore.test.js undefined
          

        
            
toolName: run_command
            
status: success
          
command: npx eslint src/pages/ab-test/abTestCore.js src/pages/ab-test/constants.js src/pages/ab-test/storage.js src/pages/ab-test/index.jsx src/pages/__tests__/ab-test/abTestCore.test.js undefined
          

        
            
toolName: todo_write
            
status: success
          
Todos updated: 6 items
          
全部四个问题已修复完成。测试 71 passed（新增 2 个测试），lint 零错误。以下是各修复的详细说明：

---

### 修复 1：删除约 100 行死代码

从 [abTestCore.js](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/ab-test/abTestCore.js) 中移除了三个互相调用但从未被业务代码使用的统计学函数：
- `regularizedIncompleteBeta` — 正则化不完全 Beta 函数
- `gammaLn` — Gamma 函数对数
- `betaCF` — Beta 连分数展开

这些函数是早期实现 p 值计算时的产物，后来被分段线性近似的 `calculatePValue` 替代，但遗留在代码中形成了约 100 行的死代码及其内部调用链。

---

### 修复 2：折线图数据追加而非替换

[updateTimeSeriesData](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/ab-test/abTestCore.js#L190-L223) 的核心变更：

- **之前**：`newTimeSeriesData[metricKey] = [...currentData.slice(0, -1), lastEntry]` — 用修改后的 `lastEntry` 替换最后一天的数据，数据点数量不变
- **现在**：`newTimeSeriesData[metricKey] = [...currentData, newEntry]` — 在末尾追加一个新数据点，日期为最后一天的次日，值基于最后一天加随机扰动

这样定时器每次触发都会让图表多一个数据点，真实呈现数据随时间增长的动态过程。

---

### 修复 3：删除未引用的派生变量

从 [constants.js](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/ab-test/constants.js) 中移除了 `export const METRIC_KEYS = METRICS.map((m) => m.key)` — 这个派生变量在整个项目中没有任何地方导入使用。

---

### 修复 4：移除多余的 prop→state 同步 useEffect

**[ExperimentDetail](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/ab-test/index.jsx#L527-L529)**：
- 移除了 `useEffect(() => { setCurrentExperiment(experiment) }, [experiment])`
- 改用 `key={viewingExperiment.id}` 属性（[第 717 行](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/ab-test/index.jsx#L717)），当切换不同实验时组件整体重新挂载，`useState(experiment)` 自然获取新的初始值

**[ABTestPage](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/ab-test/index.jsx#L664-L666)**：
- 将 `viewingExperiment` 从 `useState(null)` + `useEffect` 同步改为直接派生计算：`const viewingExperiment = experimentId ? getExperimentById(experiments, experimentId) : null`
- 简化了 `handleStartExperiment` 和 `handleStopExperiment` 回调，不再需要手动维护 `viewingExperiment` 状态——`experiments` 更新后 `viewingExperiment` 自动重新计算

---

### 测试结果

- **71 tests passed**（原 70 个，删除 `gammaLn` 测试 1 个，新增 `updateTimeSeriesData` 测试 2 个，净增 1 个）
- **ESLint 0 errors**，所有 ab-test 相关文件均通过 lint 检查