toolName: todo_write
            
status: success
          
Todos updated: 5 items
          
让我来分析并修复根本原因。问题在于：当处于"全部地域"视图时，`appendTrendPointToMap` 将同一个聚合数据点推入所有地域的独立趋势数组，污染了各地域的历史数据。

        
            
toolName: todo_write
            
status: success
          
Todos updated: 5 items
          
现在我将修复 `utils.js` 中的逻辑。核心思路是：每次刷新都为**每个地域**基于各自独立的指标生成独立的趋势数据点，`'all'` 则作为各地域的聚合平均值。

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\cloud-monitor\utils.js
          
现在我将通过创建一个新的 `fluctuateAllRegionTrendData` 函数来修复这个问题，该函数会基于每个地域各自独立的指标为所有地域生成独立的趋势点，并将 `'all'` 计算为所有地域的平均值。

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\cloud-monitor\utils.js
          
changes: undefined
          
现在更新 `index.jsx`，使用新的 `fluctuateAllRegionTrendData`，该函数会基于每个地域各自独立的指标为所有地域生成独立的趋势数据点：

        
            
toolName: todo_write
            
status: success
          
Todos updated: 5 items
          

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\cloud-monitor\index.jsx
          
changes: undefined
          
现在更新 `refreshAll` 回调，使用 `fluctuateAllRegionTrendData`，它会根据每个区域自己的指标独立更新所有区域的趋势数据：

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\cloud-monitor\index.jsx
          
changes: undefined
          

        
            
toolName: todo_write
            
status: success
          
Todos updated: 5 items
          
现在让我为新的和已修复的逻辑添加单元测试。我需要更新现有测试并添加新的测试：

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\cloud-monitor\utils.test.js
          

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\cloud-monitor\utils.test.js
          
changes: undefined
          
现在我需要更新现有的 `appendTrendPointToMap` 测试并添加新测试。让我找到这些测试：


        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\cloud-monitor\utils.test.js
          
现在我需要：
1. 修复 `appendTrendPointToMap: 全局视图更新所有地域` 测试 —— 新行为是 `all` 视图只更新 `map.all`，而不是所有地域
2. 为 `buildTrendPoint` 和 `fluctuateAllRegionTrendData` 添加新测试

让我来做这件事：



        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\cloud-monitor\utils.test.js
          
changes: undefined
          
现在在时间序列部分中添加针对 `buildTrendPoint` 和 `fluctuateAllRegionTrendData` 的新测试：




        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\cloud-monitor\utils.test.js
          
changes: undefined
          

        
            
toolName: todo_write
            
status: success
          
Todos updated: 5 items
          

        
            
toolName: run_command
            
status: success
          
command: cd c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react ; npx vitest run src/pages/__tests__/cloud-monitor/ undefined
          
所有 103 项测试均通过。现在进行 lint 和 build 检查：

        
            
toolName: run_command
            
status: success
          
command: cd c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react ; npx eslint src/pages/cloud-monitor/ undefined
          

        
            
toolName: run_command
            
status: success
          
command: cd c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react ; npx vite build undefined
          
所有检查均通过：lint（0 错误 0 警告）、103 个单元测试全部通过、构建成功。

        
            
toolName: todo_write
            
status: success
          
Todos updated: 5 items
          
全部修复完成，验证结果：**103 个测试通过**、**0 lint 错误**、**构建成功**。

---

## 问题根因

原 `appendTrendPointToMap` 函数在 `regionId === 'all'` 时，将同一个聚合数据点同时推入了 `all`、`east`、`north`、`south`、`west`、`overseas` 全部 6 个数组。长时间停留"全部地域"视图后，各独立地域的历史数据被完全覆盖为全局聚合数据，导致切换地域时看不到各自独立的趋势。

## 修复方案

### 1. 新增 `buildTrendPoint` 函数
在 [utils.js#L171-L178](file:///C:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/cloud-monitor/utils.js#L171-L178) — 基于给定的指标和时间戳，为单一地域生成一个带随机波动的趋势数据点。

### 2. 新增 `fluctuateAllRegionTrendData` 函数
在 [utils.js#L180-L225](file:///C:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/cloud-monitor/utils.js#L180-L225) — 每次刷新时：
- 遍历 5 个地域，基于**各自独立**的 `allMetrics[r.id]` 生成独立趋势点
- 各地域的点使用相同的时间戳（`now`），但 CPU/内存/磁盘值各自独立
- `'all'` 的数据点计算为 5 个地域数据的**平均值**
- 每个点追加后自动执行 30 分钟时间窗淘汰

### 3. 修复 `appendTrendPointToMap` 函数
在 [utils.js#L227-L242](file:///C:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/cloud-monitor/utils.js#L227-L242) — `all` 视图时只更新 `map.all`，不再污染各独立地域数组。

### 4. 更新 `index.jsx` 的 `refreshAll`
在 [index.jsx#L87](file:///C:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/cloud-monitor/index.jsx#L87) — 使用 `fluctuateAllRegionTrendData(prev, newAllMetrics)` 替代旧逻辑，确保每次刷新所有地域都获得独立数据点。

## 新增单元测试（8 个）

在 [utils.test.js](file:///C:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/__tests__/cloud-monitor/utils.test.js) 中新增：

| 测试 | 验证内容 |
|---|---|
| `buildTrendPoint 基于指标生成有效数据点` | 值在预期波动范围内、使用指定时间戳 |
| `buildTrendPoint 默认使用当前时间` | 未传 timestamp 时使用 Date.now() |
| `buildTrendPoint 结果值在 0-100 范围内` | 50 次随机验证边界 |
| `fluctuateAllRegionTrendData: 各地域生成独立的趋势数据点` | 每个地域数组被独立更新，all 为均值 |
| `fluctuateAllRegionTrendData: all 数据点是各地域的平均值` | 固定指标验证均值计算准确 |
| `fluctuateAllRegionTrendData: null trendMap 返回原值` | 空输入防御 |
| `fluctuateAllRegionTrendData: null allMetrics 返回原值` | 空输入防御 |
| `fluctuateAllRegionTrendData: 各地域新数据点时间戳一致` | 所有地域使用同一时刻的时间戳 |

同时修复了旧测试 `appendTrendPointToMap: all 视图只更新全局数据，不污染各地域独立数据` — 验证 `all` 视图只更新 `map.all`，各地域数组长度不变。