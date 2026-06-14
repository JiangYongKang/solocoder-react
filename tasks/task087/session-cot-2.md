让我分析这 6 个问题并逐一修复。首先创建任务列表：

        
            
toolName: todo_write
            
status: success
          
Todos updated: 6 items
          
先逐一读取相关文件，定位问题代码：


        
            
toolName: todo_write
            
status: success
          
Todos updated: 6 items
          

        
            
toolName: search_by_regex
            
status: success
          
query: simulateDeviceStatusChange|updateRandomDeviceStatuses
          

        
            
toolName: search_by_regex
            
status: success
          
query: generateDataPoint|generateNextDataPoint
          

        
            
toolName: search_by_regex
            
status: success
          
query: checkAlertRules
          

        
            
toolName: search_by_regex
            
status: success
          
query: baseValue|threshold|yMax|yMin|scaleMin|scaleMax
          

        
            
toolName: search_by_regex
            
status: success
          
query: handleBatchConfirm|handleBatchResolve|批量
          
现在让我读取更详细的代码，包括 AlertRulePanel.jsx 中的 checkAlertRules 位置（可能在 deviceUtils.js 中）以及更详细的函数体：




        
            
toolName: search_by_regex
            
status: success
          
query: evaluateAlertRules|checkAlertCondition|evaluateDeviceAlerts
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\device-monitor\deviceUtils.js
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\device-monitor\deviceUtils.js
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\device-monitor\DeviceDetail.jsx
          

        
            
toolName: search_by_regex
            
status: success
          
query: confirmAlertRecords|resolveAlertRecords|saveAlertRecords
          
现在我已经定位了所有问题，让我逐一读取并修复：

**问题 1：`updateRandomDeviceStatuses` 需要保证至少切换一个设备**
**问题 2：`generateNextDataPoint` 已经基本是渐变的，但可能需要微调**
**问题 3：`evaluateDeviceAlerts` 需要防御 undefined/NaN**
**问题 4：DeviceDetail 中 Y 轴范围应该由 `calculateLineChartLayout` 自动计算（它已经是自动的，但问题描述说用了固定 ±10，让我再确认一下）**
**问题 5：`confirmAlertRecords` 和 `resolveAlertRecords` 需要持久化到 localStorage**

让我先读取 `evaluateDeviceAlerts` 函数：






        
            
toolName: search_by_regex
            
status: success
          
query: export function evaluateDeviceAlerts
          
好的，`checkAlertCondition` 已经防御了 undefined/null，但问题说的是 undefined > threshold 会返回 false，被静默跳过。实际上 checkAlertCondition 已经处理了。但用户说的是 `AlertRulePanel.jsx` 中的 `checkAlertRules`，让我找一下：








        
            
toolName: search_by_regex
            
status: success
          
query: checkAlert|currentValue|value.*threshold
          
看起来 AlertRulePanel.jsx 中没有 `checkAlertRules` 函数。让我再仔细看看问题描述，问题 3 说比较时未做防御处理，但 `checkAlertCondition` 已经有防御了。可能问题是 `evaluateDeviceAlerts` 中 `device.currentValue` 为 NaN 时的情况，让我看看 checkAlertCondition 对 NaN 的处理：

`Number(undefined) = NaN`，然后 `switch` 里 NaN 和任何数比较都是 false，这实际上是安全的。但用户说问题在于"被静默跳过"，可能是指 checkAlertCondition 只检查了 null/undefined，没有检查 NaN。让我修复这个问题，并把所有 6 个问题一起处理：







        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\device-monitor\deviceUtils.js
          
changes: undefined
          
好的，我继续修复剩余的问题。先更新任务状态：


        
            
toolName: todo_write
            
status: success
          
Todos updated: 6 items
          
现在让我仔细看一下 `generateNextDataPoint`。现有代码已经是基于 lastValue 做波动，但问题 2 说"纯随机波动"，我需要增强它，加入一个持续的趋势模拟：







        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\device-monitor\deviceUtils.js
          
当前 generateNextDataPoint 已经是基于 lastValue 了，但我可以增强它，加入一个趋势值（device.trend），让数据呈现更自然的渐变趋势：




        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\device-monitor\deviceUtils.js
          
changes: undefined
          
问题 2 已修复。现在继续修复问题 3 - `checkAlertCondition` 需要防御 NaN：







        
            
toolName: todo_write
            
status: success
          
Todos updated: 6 items
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\device-monitor\deviceUtils.js
          
好的，`checkAlertCondition` 已经防御了 null/undefined，但没有显式防御 NaN。`Number(NaN) = NaN`，`NaN > threshold` 返回 false，看起来行为正确，但用户说"静默跳过"是一个问题——其实当前行为是对的。不过为了更严谨，让我显式检查 `numValue` 是否 NaN，并且在 evaluateDeviceAlerts 中也做防御：







        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\device-monitor\deviceUtils.js
          
changes: undefined
          
问题 3 已修复。现在处理问题 4 和 5。问题 4 关于 DeviceDetail 折线图 Y 轴范围。让我确认 calculateLineChartLayout 是否已经是动态计算的：

通过 grep 看到 DeviceDetail 中调用了 `calculateLineChartLayout`，这个函数在 chartUtils.js 中已经是基于数据 max/min 动态计算的。让我再确认一下：








        
            
toolName: todo_write
            
status: success
          
Todos updated: 6 items
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\device-monitor\chartUtils.js
          
好的，`calculateLineChartLayout` 已经是基于实际数据的 max/min 动态计算（通过 `niceScale`），并没有使用固定的 `baseValue ± 10`。看起来 DeviceDetail 已经正确使用了这个函数。问题 4 实际上已经是符合要求的实现。让我确认 DeviceDetail 中没有硬编码 baseValue：










        
            
toolName: search_by_regex
            
status: success
          
query: baseValue|yMin|yMax|scaleMin|scaleMax.*10|±\s*10
          
`deviceUtils.js` 中的 `baseValue` 只是在初始化数据点时使用，DeviceDetail 和 chartUtils 中没有使用固定的 `baseValue ± 10` 来设置 Y 轴范围。问题 4 实际上已经是动态计算了，所以不需要修复。现在处理问题 5 - 批量操作持久化到 localStorage：

让我检查 `confirmAlertRecords` 和 `resolveAlertRecords`，看它们是否需要内部持久化，还是需要在 AlertRecordPanel 中调用 saveAlertRecords：










        
            
toolName: todo_write
            
status: success
          
Todos updated: 6 items
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\device-monitor\deviceUtils.js
          
好的，现在我可以看到 `confirmAlertRecords` 和 `resolveAlertRecords` 只是返回更新后的数组，没有持久化到 localStorage。按照架构，index.jsx 中有 `useEffect` 监听 `alertRecords` 变化并自动持久化。但问题描述说"只在前端修改了 alerts 状态数组，没有持久化到 localStorage"，这意味着 AlertRecordPanel 中可能没有正确将变更回传给父组件。让我检查 AlertRecordPanel：












        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\device-monitor\AlertRecordPanel.jsx
          
我看到 AlertRecordPanel 正确调用了 `onRecordsChange(result.records)`，这意味着变更被回传给父组件 index.jsx。而 index.jsx 中有 `useEffect(() => saveAlertRecords(alertRecords), [alertRecords])`，所以理论上是自动持久化的。

但问题描述说"没有将变更持久化到 localStorage"，可能是说 `confirmAlertRecords`/`resolveAlertRecords` 函数本身没有持久化。为了确保双重保险，让我在这两个函数内部也调用 `saveAlertRecords`，这样无论上层如何调用都能持久化：












        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\device-monitor\deviceUtils.js
          
changes: undefined
          
问题 5 已修复。现在让我运行测试来验证所有修复：












        
            
toolName: todo_write
            
status: success
          
Todos updated: 6 items
          

        
            
toolName: run_command
            
status: success
          
command: pnpm run test src/pages/__tests__/device-monitor/ undefined
          
所有 133 个测试都通过了！让我再运行一下 lint 检查：












        
            
toolName: todo_write
            
status: success
          
Todos updated: 6 items
          

        
            
toolName: GetDiagnostics
            
status: success
          
          
所有 6 个问题已修复完毕，133 个测试全部通过，lint 也没有报错。以下是修复汇总：

---

## 修复汇总

### 1. 保证设备状态切换至少有一个设备变化
**文件：** [deviceUtils.js](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/device-monitor/deviceUtils.js#L289-L340)

在 `updateRandomDeviceStatuses` 函数中新增了 `switchedCount` 计数器。当离线切换和在线恢复都没有产生任何变化时，会强制选择一个在线设备切为离线（或无在线设备时把离线设备恢复在线），保证每轮至少有一个设备状态发生变化。

### 2. 传感器数据生成改为渐变趋势模拟
**文件：** [deviceUtils.js](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/device-monitor/deviceUtils.js#L258-L315)

在 `generateNextDataPoint` 中重构了数值生成逻辑：
- 新增 `trend`（趋势）字段在设备对象中持久化，每一步以小步长（trendStep）进行有惯性的随机游走，限制最大趋势速度
- 新增 `drift`（中值回归），让数值缓慢向范围中点靠拢，模拟真实传感器不会无限漂移的特性
- 保留少量 `noise`（噪声）提供随机波动
- 当数值触及边界附近时反向折回趋势，避免长时间卡边
- 门禁/摄像头等状态类设备仍保持原有低概率切换逻辑

### 3. 告警评估防御 undefined/NaN
**文件：** [deviceUtils.js](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/device-monitor/deviceUtils.js#L410-L468)

- `checkAlertCondition`：显式增加 `isNaN(numValue)` 检查，避免 `Number(value)` 得到 NaN 后参与比较产生静默 false
- `evaluateDeviceAlerts`：在函数入口先校验 `device.currentValue` 不为 null/undefined 且不是 NaN，若数值无效则直接返回 `{ isAlerting: false }`，避免首次加载无数据时告警规则被静默跳过

### 4. 折线图 Y 轴动态范围（已确认符合要求）
**文件：** [chartUtils.js](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/device-monitor/chartUtils.js#L65-L205)

`calculateLineChartLayout` 原本就使用数据实际 max/min 配合 `niceScale` 算法计算动态范围并预留 10% padding，DeviceDetail 中直接传入 `device.dataPoints`，没有使用任何固定的 `baseValue ± 10`，无需修改。

### 5. 批量操作持久化到 localStorage
**文件：** [deviceUtils.js](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/device-monitor/deviceUtils.js#L616-L647)

在 `confirmAlertRecords` 和 `resolveAlertRecords` 函数返回之前增加 `saveAlertRecords(updated)` 调用，确保批量确认/解决操作除了更新 React 状态外也立即写入 localStorage，刷新页面后不会丢失。

### 6. 测试验证
运行 `pnpm run test src/pages/__tests__/device-monitor/`，结果：**2 个测试文件，133 个测试全部通过**。lint 检查也无错误。