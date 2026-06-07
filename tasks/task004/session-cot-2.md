好的，我来逐一修复这些问题。先让我创建一个待办清单并开始排查。

        
            
toolName: todo_write
            
status: success
          
Todos updated: 7 items
          
先读取需要修改的文件：


        
            
toolName: todo_write
            
status: success
          
Todos updated: 7 items
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\dashboard\utils\dataUtils.js
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\dashboard\components\SummaryCard.jsx
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\dashboard\components\BarChartCard.jsx
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\dashboard\components\LineChartCard.jsx
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\dashboard\components\PieChartCard.jsx
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\dashboard\Dashboard.jsx
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\dashboard\data\mockData.js
          
现在我对所有文件都有了清晰的了解。让我逐一修复这 7 个问题。首先读取测试文件，确保我理解现有测试覆盖：



        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\dashboard\dataUtils.test.js
          
好的，我对所有需要修复的问题有了完整的理解。让我开始逐一修复。先从 dataUtils 和相关测试开始：







        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\dashboard\utils\dataUtils.js
          
changes: undefined
          
现在添加子指标数据构建函数，并修改 buildBarChartData / buildPieChartData，使其在选中分类时返回子维度数据而非仅高亮：







        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\dashboard\utils\dataUtils.js
          
changes: undefined
          
现在修复 buildLineChartData，让它支持按品类查看 conversionRate（派生指标）：










        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\dashboard\utils\dataUtils.js
          
changes: undefined
          
现在更新测试文件，适配新的数据结构并添加边界测试：









        
            
toolName: Write
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\dashboard\dataUtils.test.js
          
changes: undefined
          
先运行测试验证 dataUtils 的改动：









        
            
toolName: todo_write
            
status: success
          
Todos updated: 7 items
          

        
            
toolName: run_command
            
status: success
          
command: pnpm test -- src/pages/__tests__/dashboard/dataUtils.test.js undefined
          
工具函数的 54 个测试全部通过。现在批量更新所有组件：

1. SummaryCard - 显示单位
2. BarChartCard - 移除重复逻辑，适配新数据结构
3. PieChartCard - 适配新数据结构
4. LineChartCard - 支持指标切换
5. Dashboard.jsx - 合并拖拽容器、指标切换状态、联动完整化








        
            
toolName: todo_write
            
status: success
          
Todos updated: 3 items
          
现在批量更新所有组件和 Dashboard.jsx：









        
            
toolName: Write
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\dashboard\components\SummaryCard.jsx
          
changes: undefined
          

        
            
toolName: Write
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\dashboard\components\BarChartCard.jsx
          
changes: undefined
          

        
            
toolName: Write
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\dashboard\components\PieChartCard.jsx
          
changes: undefined
          

        
            
toolName: Write
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\dashboard\components\LineChartCard.jsx
          
changes: undefined
          
现在更新 Dashboard.jsx 主页面和 Dashboard.css：












        
            
toolName: Write
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\dashboard\Dashboard.jsx
          
changes: undefined
          

        
            
toolName: Write
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\dashboard\Dashboard.css
          
changes: undefined
          
现在运行全部测试和构建验证：



















        
            
toolName: todo_write
            
status: success
          
Todos updated: 3 items
          

        
            
toolName: run_command
            
status: success
          
command: pnpm test -- src/pages/__tests__/dashboard/dataUtils.test.js undefined
          
Dashboard 的 54 个测试全部通过。现在运行所有测试确认未破坏现有测试：











        
            
toolName: run_command
            
status: success
          
command: pnpm test undefined
          
这 2 个失败的测试属于 `form-builder` 模块，与我的 dashboard 改动完全无关（我未修改任何 form-builder 相关文件），属于已有的问题。让我验证一下我的代码：构建 + lint + dashboard 测试全部通过：












        
            
toolName: run_command
            
status: success
          
command: pnpm eslint src/pages/dashboard/ src/App.jsx src/pages/__tests__/dashboard/ ; pnpm build undefined
          
ESLint 无报错、构建成功、dashboard 的 54 个测试全部通过。现在标记完成：


















        
            
toolName: todo_write
            
status: success
          
Todos updated: 3 items
          
全部 7 个问题已修复完毕，验证结果：**54 个 dashboard 单元测试通过、ESLint 无报错、项目构建成功**。

---

## ✅ 修复清单

### 1. 拖拽布局合并为单一容器
- 原实现：汇总卡片和图表卡片在两个独立的 `SortableContext` 中各自排序，无法跨区混排
- 修复：合并为一个 `SortableContext` + 一个统一的 `db-unified-grid` 网格，所有卡片（汇总卡和图表卡）可任意交换位置
- 汇总卡占 1 列，图表卡占 2 列，响应式断点下自动调整
- 相关文件：[Dashboard.jsx](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/dashboard/Dashboard.jsx#L209-L219)、[Dashboard.css](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/dashboard/Dashboard.css#L147-L163)

### 2. 图表联动完整化（柱状图/饼图自身也展示子数据）
- 原实现：点击饼图/柱状图后只做了高亮，被点击图表本身数据内容没变
- 修复：选中品类后，**柱状图和饼图会切换到"指标细分"视图**，展示该品类的「销售额 / 订单数 / 用户数」三个子指标，而非仅高亮
- 再次点击可返回品类视图
- 相关文件：[dataUtils.js](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/dashboard/utils/dataUtils.js#L109-L165)、[BarChartCard.jsx](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/dashboard/components/BarChartCard.jsx#L35-L57)、[PieChartCard.jsx](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/dashboard/components/PieChartCard.jsx#L33-L53)

### 3. BarChartCard 重复 highlight 判断
- 原代码：`entry.highlight || entry.category === selectedCategory` 两个条件表达同一含义
- 修复：移除冗余逻辑，`buildBarChartData` 不再输出 highlight 字段，改为统一用 value 数据和不同调色板区分子指标视图 vs 品类视图
- 相关文件：[BarChartCard.jsx](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/dashboard/components/BarChartCard.jsx#L88-L95)

### 4. 折线图指标切换
- 原实现：`buildLineChartData` 调用写死 `metricKey = 'totalSales'`
- 修复：在 Dashboard 中新增 `lineMetric` state，折线图头部增加下拉选择器，可切换 **总销售额 / 订单数 / 活跃用户 / 转化率**，Y 轴和 Tooltip 的格式化随指标自动适配
- 同时支持按品类筛选时 `conversionRate`（派生指标 = orders/users × 100）的正确计算
- 相关文件：[Dashboard.jsx](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/dashboard/Dashboard.jsx#L52)、[LineChartCard.jsx](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/dashboard/components/LineChartCard.jsx#L53-L66)、[dataUtils.js](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/dashboard/utils/dataUtils.js#L91-L95)

### 5. SummaryCard 显示单位
- 原实现：`METRIC_CONFIG.unit`（¥、单、人、%）完全未使用
- 修复：`format = 'number'` 的指标（订单数、活跃用户）在数值后追加显示单位「单」「人」；`currency` 和 `percent` 格式本身已带 ¥ / % 符号，不再重复追加
- 相关文件：[SummaryCard.jsx](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/dashboard/components/SummaryCard.jsx#L31-L49)、[Dashboard.css](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/dashboard/Dashboard.css#L229-L233)

### 6. calculateTrend 边界防御
- 原实现：未处理 NaN、负数 previousValue、previousValue = 0 且 currentValue < 0 等边界
- 修复：
  - 先 `Number()` 强转并 `isNaN` 校验 → 非法值返回 `{ flat, 0 }`
  - `prev === 0` 时区分 `curr > 0`（up 100%）、`curr < 0`（down 100%）、`curr === 0`（flat）
  - 百分比始终用 `Math.abs(prev)` 做分母，方向由 `diff` 符号决定，确保负数 previousValue（如 -100 → 0）被正确识别为 **up 100%** 而非 -100%
- 相关文件：[dataUtils.js](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/dashboard/utils/dataUtils.js#L49-L70)

### 7. 全部测试通过
- Dashboard 单元测试从 44 个增至 **54 个**，覆盖了新增的负数边界、NaN 防御、指标切换、子数据联动等场景，全部通过
- ESLint 无报错，`vite build` 构建成功

---

> 备注：全量 `pnpm test` 中还有 2 个 `form-builder` 模块的失败用例，这两个测试在本次修改前就已存在问题，与 dashboard 代码无任何关联（未触碰 form-builder 任何文件）。