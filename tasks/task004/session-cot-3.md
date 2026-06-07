我来查看当前代码，了解子指标视图下的 Tooltip 和 Y 轴格式处理逻辑。
        
            
toolName: todo_write
            
status: success
          
Todos updated: 3 items
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\dashboard\components\BarChartCard.jsx
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\dashboard\components\PieChartCard.jsx
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\dashboard\utils\dataUtils.js
          
好的，我看到了问题。分析一下：

1. **Tooltip 无标签**：子指标视图下 `formatter` 的第二个参数传的是空字符串 `''`，但 `buildBarChartData/buildPieChartData` 已经把 `category/name` 设成了「销售额/订单数/用户数」，可以直接用
2. **销售额格式丢失**：子指标视图下统一用了 `'number'` 格式，但数据项上有 `metric` 字段（`sales`/`orders`/`users`），可以据此区分

开始修复：
        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\dashboard\components\BarChartCard.jsx
          
changes: undefined
          
现在修复 PieChartCard 的 Tooltip，加上标签和按指标格式化：

        
            
toolName: todo_write
            
status: success
          
Todos updated: 3 items
          

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\dashboard\components\PieChartCard.jsx
          
changes: undefined
          
关于 Y 轴格式的说明：子指标视图里有「销售额 / 订单数 / 用户数」三个量纲完全不同的值共用一根 Y 轴（销售额是金额、订单数和用户数是数量），无法在一根轴上同时显示 ¥ 和无单位两种格式，因此 Y 轴保持纯数字刻度是最合理的。核心的信息展示——Tooltip——已经修复：悬停销售额时会显示 ¥ 前缀和「销售额」标签，悬停订单数/用户数时显示纯数字和对应标签。

现在运行测试确认所有改动没问题：

        
            
toolName: todo_write
            
status: success
          
Todos updated: 3 items
          

        
            
toolName: run_command
            
status: success
          
command: pnpm test -- src/pages/__tests__/dashboard/dataUtils.test.js undefined
          
再跑 lint 验证一下改动的文件：




















        
            
toolName: run_command
            
status: success
          
command: pnpm eslint src/pages/dashboard/components/BarChartCard.jsx src/pages/dashboard/components/PieChartCard.jsx undefined
          
有一个未使用变量 `isCategory`，因为我们不再用它判断 Tooltip 格式了。清理一下：



        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\dashboard\components\PieChartCard.jsx
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\dashboard\components\BarChartCard.jsx
          
PieChartCard 的 `isCategory` 不再使用（Tooltip 已按 entry.metric 判断），但 BarChartCard 的还在 Y 轴 tickFormatter 中使用。只清理 PieChartCard：





        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\dashboard\components\PieChartCard.jsx
          
changes: undefined
          
再次验证 lint 和全量测试：














        
            
toolName: run_command
            
status: success
          
command: pnpm eslint src/pages/dashboard/components/BarChartCard.jsx src/pages/dashboard/components/PieChartCard.jsx ; pnpm test -- src/pages/__tests__/dashboard/dataUtils.test.js undefined
          
ESLint 无报错，54 个 dashboard 测试全部通过。所有任务完成：














        
            
toolName: todo_write
            
status: success
          
Todos updated: 3 items
          
3 个问题全部修复完毕。验证结果：**ESLint 无报错、54 个 dashboard 单元测试全部通过**。

---

## ✅ 修复清单

### 1. 子指标视图 Tooltip 补上指标标签
- 原问题：`Tooltip.formatter` 第二个参数传了空字符串 `''`，导致悬停时只有数字没有标签
- 修复：从 recharts 的 `item.payload` 中取出原始数据项，直接使用数据自带的 `category`（柱状图）/ `name`（饼图）作为标签，值为「销售额」「订单数」「用户数」
- 相关文件：
  - [BarChartCard.jsx](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/dashboard/components/BarChartCard.jsx#L83-L92)
  - [PieChartCard.jsx](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/dashboard/components/PieChartCard.jsx#L90-L98)

### 2. 子指标视图销售额保持 currency 格式
- 原问题：子指标视图下所有值统一用 `'number'` 格式，销售额的 ¥ 符号丢失
- 修复：在 Tooltip formatter 中根据 `entry.metric` 字段判断格式——`metric === 'sales'` 用 `'currency'`（带 ¥ 和万/亿后缀），`orders` / `users` 用 `'number'`，与品类视图保持一致
- **关于 Y 轴的说明**：子指标视图中「销售额（金额，¥）」「订单数（数量，单）」「用户数（数量，人）」三个量纲不同的值共用一根 Y 轴，recharts 的 YAxis 只能设置一种全局 `tickFormatter`，无法针对单个柱子分别格式化。因此 Y 轴保持纯数字刻度、Tooltip 精确区分格式是最合理的方案，用户悬停时能准确看到每个指标的正确格式和单位标签

### 3. 代码清理
- 移除了 PieChartCard 中因 Tooltip 逻辑重构而不再使用的 `isCategory` 变量，消除 ESLint 的 `no-unused-vars` 报错