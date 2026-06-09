toolName: todo_write
            
status: success
          
Todos updated: 4 items
          
让我先读取相关代码，了解需要修改的内容：

        
            
toolName: todo_write
            
status: success
          
Todos updated: 4 items
          

        
            
toolName: search_by_regex
            
status: success
          
query: function calculateMonthlyStats|export function calculateMonthlyStats
          

        
            
toolName: view_files
            
status: success
          
            
filePath: /Users/vincent/GoletaLab/solocoder-react/src/pages/points-mall/pointsMallUtils.js
          
找到了问题。让我修复 `calculateMonthlyStats` 函数：


        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: /Users/vincent/GoletaLab/solocoder-react/src/pages/points-mall/pointsMallUtils.js
          
changes: undefined
          
现在修复 PointsHistory 组件中的金额符号显示逻辑。让我先查看该组件：




        
            
toolName: todo_write
            
status: success
          
Todos updated: 4 items
          

        
            
toolName: search_by_regex
            
status: success
          
query: function PointsHistory
          

        
            
toolName: view_files
            
status: success
          
            
filePath: /Users/vincent/GoletaLab/solocoder-react/src/pages/points-mall/index.jsx
          
找到了问题！第 331 行符号显示逻辑基于 `balanceAfter > 0`，应该改为基于 `tx.amount` 的正负。让我修复：






        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: /Users/vincent/GoletaLab/solocoder-react/src/pages/points-mall/index.jsx
          
changes: undefined
          
现在修复第 3 个问题，用原生 SVG 替换 Recharts。先查看 TrendChart 组件：






        
            
toolName: todo_write
            
status: success
          
Todos updated: 4 items
          

        
            
toolName: search_by_regex
            
status: success
          
query: function TrendChart
          

        
            
toolName: view_files
            
status: success
          
            
filePath: /Users/vincent/GoletaLab/solocoder-react/src/pages/points-mall/index.jsx
          
现在用原生 SVG 替换 Recharts。让我先查看 buildTrendData 返回的数据结构：







        
            
toolName: search_by_regex
            
status: success
          
query: export function buildTrendData
          
现在用原生 SVG 重写 TrendChart 组件，并移除 Recharts 导入：









        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: /Users/vincent/GoletaLab/solocoder-react/src/pages/points-mall/index.jsx
          
changes: undefined
          
现在重写 TrendChart 组件，使用原生 SVG：












        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: /Users/vincent/GoletaLab/solocoder-react/src/pages/points-mall/index.jsx
          
changes: undefined
          
现在需要为 SVG 图表的 tooltip 添加 CSS 样式：













        
            
toolName: view_files
            
status: success
          
            
filePath: /Users/vincent/GoletaLab/solocoder-react/src/pages/points-mall/points-mall.css
          

        
            
toolName: search_by_regex
            
status: success
          
query: pm-chart
          

        
            
toolName: view_files
            
status: success
          
            
filePath: /Users/vincent/GoletaLab/solocoder-react/src/pages/points-mall/points-mall.css
          

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: /Users/vincent/GoletaLab/solocoder-react/src/pages/points-mall/points-mall.css
          
changes: undefined
          
现在运行测试验证所有修改：


















        
            
toolName: todo_write
            
status: success
          
Todos updated: 4 items
          

        
            
toolName: run_command
            
status: success
          
command: cd /Users/vincent/GoletaLab/solocoder-react && pnpm test src/pages/__tests__/points-mall/pointsMallUtils.test.js 2>&1 undefined
          
测试全部通过！再运行 lint 检查：



















        
            
toolName: run_command
            
status: success
          
command: cd /Users/vincent/GoletaLab/solocoder-react && npx eslint src/pages/points-mall/ src/pages/__tests__/points-mall/ --no-error-on-unmatched-pattern 2>&1 undefined
          
有 3 个 React Hooks 依赖警告，让我修复：


















        
            
toolName: view_files
            
status: success
          
            
filePath: /Users/vincent/GoletaLab/solocoder-react/src/pages/points-mall/index.jsx
          
我来重构一下，把常量移到组件外，并把坐标计算内联到 useMemo 中，消除依赖警告：


















        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: /Users/vincent/GoletaLab/solocoder-react/src/pages/points-mall/index.jsx
          
changes: undefined
          
现在更新 JSX 部分的坐标计算（内联计算替代 getX/getY）：




















        
            
toolName: view_files
            
status: success
          
            
filePath: /Users/vincent/GoletaLab/solocoder-react/src/pages/points-mall/index.jsx
          

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: /Users/vincent/GoletaLab/solocoder-react/src/pages/points-mall/index.jsx
          
changes: undefined
          
更简洁的做法是把常量移到组件外部（模块级常量），然后在 JSX 中内联计算。让我重构一下，彻底消除警告：


















        
            
toolName: view_files
            
status: success
          
            
filePath: /Users/vincent/GoletaLab/solocoder-react/src/pages/points-mall/index.jsx
          

        
            
toolName: view_files
            
status: success
          
            
filePath: /Users/vincent/GoletaLab/solocoder-react/src/pages/points-mall/index.jsx
          

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: /Users/vincent/GoletaLab/solocoder-react/src/pages/points-mall/index.jsx
          
changes: undefined
          
现在简化 TrendChart 组件，使用模块级常量并内联坐标计算：





















        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: /Users/vincent/GoletaLab/solocoder-react/src/pages/points-mall/index.jsx
          
changes: undefined
          
现在运行 lint 和测试验证：























        
            
toolName: run_command
            
status: success
          
command: cd /Users/vincent/GoletaLab/solocoder-react && npx eslint src/pages/points-mall/ src/pages/__tests__/points-mall/ --no-error-on-unmatched-pattern 2>&1 undefined
          
还有 2 个警告，直接把坐标计算内联到 useMemo 中：
























        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: /Users/vincent/GoletaLab/solocoder-react/src/pages/points-mall/index.jsx
          
changes: undefined
          

        
            
toolName: run_command
            
status: success
          
command: cd /Users/vincent/GoletaLab/solocoder-react && npx eslint src/pages/points-mall/ src/pages/__tests__/points-mall/ --no-error-on-unmatched-pattern 2>&1 undefined
          
Lint 完美通过！现在运行测试：


























        
            
toolName: run_command
            
status: success
          
command: cd /Users/vincent/GoletaLab/solocoder-react && pnpm test src/pages/__tests__/points-mall/pointsMallUtils.test.js 2>&1 undefined
          

        
            
toolName: todo_write
            
status: success
          
Todos updated: 4 items
          
所有问题已修复完毕，以下是修复详情：

## ✅ 修复内容

### 1. ADJUST 交易统计方向判断错误
**文件**：[pointsMallUtils.js](file:///Users/vincent/GoletaLab/solocoder-react/src/pages/points-mall/pointsMallUtils.js#L507-L524)

修改前：`ADJUST` 交易通过 `balanceAfter > 0` 判断是否计入获取积分，导致扣减后余额仍为正数时被错误统计。

修改后：直接基于 `tx.amount` 正负判断：
- `amount > 0` → 计入 `earned`（本月获取）
- `amount < 0` → 绝对值计入 `spent`（本月消费）

---

### 2. PointsHistory 金额符号显示逻辑
**文件**：[index.jsx](file:///Users/vincent/GoletaLab/solocoder-react/src/pages/points-mall/index.jsx#L330-L333)

修改前：符号判断同样基于 `balanceAfter > 0`，导致扣减积分显示为 `+200` 而非 `-200`。

修改后：
- `tx.amount > 0`（或 EARN 类型）→ 显示 `+` 号
- 其他情况 → 显示 `-` 号
- ADJUST 类型的负数取绝对值显示，避免出现 `--200`

---

### 3. 用原生 SVG 替换 Recharts
**文件**：[index.jsx](file:///Users/vincent/GoletaLab/solocoder-react/src/pages/points-mall/index.jsx#L403-L566) + [points-mall.css](file:///Users/vincent/GoletaLab/solocoder-react/src/pages/points-mall/points-mall.css#L498-L510)

已移除 Recharts 依赖，改用原生 SVG 实现，功能包括：
- 5 条 Y 轴网格虚线 + 左侧刻度标签
- X 轴 7 个时间点标签（均匀分布）
- 紫色渐变面积填充 + 折线曲线
- 鼠标悬停显示垂直虚线指示 + 数据点放大 + Tooltip 提示（日期 + 余额）
- 响应式 viewBox 自适应容器宽度

---

### 4. 验证结果

| 验证项 | 结果 |
|---|---|
| 单元测试 | **93 passed (93)** ✅ |
| ESLint | **0 errors, 0 warnings** ✅ |