我来分析并修复这些问题。首先让我读取当前的相关文件，了解代码结构。
        
            
toolName: todo_write
            
status: success
          
Todos updated: 5 items
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\currency-converter\TrendChart.jsx
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\currency-converter\index.jsx
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\currency-converter\currencyUtils.js
          
现在我了解了代码结构。让我开始修复。


        
            
toolName: todo_write
            
status: success
          
Todos updated: 5 items
          
首先创建独立的图表工具模块 `chartUtils.js`，修复 `resampleData` 并导出三个纯函数。


        
            
toolName: Write
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\currency-converter\chartUtils.js
          
changes: undefined
          
现在更新 `TrendChart.jsx`，从新模块导入函数，删除内联定义。





        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\currency-converter\TrendChart.jsx
          
changes: undefined
          
现在让我读取 `ConversionPanel.jsx` 来确认互换逻辑是否有问题，同时开始编写 chartUtils 的单元测试。







        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\currency-converter\ConversionPanel.jsx
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\currency-converter\currencyUtils.test.js
          
我先创建 chartUtils 的单元测试，覆盖正常路径和边界情况。同时再分析一下互换按钮的逻辑。






        
            
toolName: todo_write
            
status: success
          
Todos updated: 5 items
          
现在创建 chartUtils 的单元测试文件。








        
            
toolName: Write
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\currency-converter\chartUtils.test.js
          
changes: undefined
          
现在让我先运行 lint 检查和单元测试，看看当前状态。







        
            
toolName: run_command
            
status: success
          
command: cd c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react ; npx eslint src/pages/currency-converter/ src/pages/__tests__/currency-converter/ undefined
          
修复 lint 错误。

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\currency-converter\chartUtils.test.js
          

        
            
toolName: edit_file_search_replace
            
status: failed
          
            
filePath: 
          
          

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\currency-converter\chartUtils.test.js
          
changes: undefined
          

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\currency-converter\chartUtils.test.js
          
changes: undefined
          
现在移除 TrendChart.jsx 中未使用的导入。









        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\currency-converter\TrendChart.jsx
          
changes: undefined
          
现在再次运行 lint 和测试。







        
            
toolName: run_command
            
status: success
          
command: cd c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react ; npx eslint src/pages/currency-converter/ src/pages/__tests__/currency-converter/ undefined
          
Lint 通过了。现在让我先运行测试，看看当前状态。








        
            
toolName: run_command
            
status: success
          
command: cd c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react ; pnpm run test undefined
          
现在让我仔细分析一下互换按钮的逻辑。我发现 `handleSwap` 中对 `0` 值的处理与 `ConversionPanel` 中的双向联动逻辑不一致——当金额为 0 时，ConversionPanel 会正确换算出 0，但 handleSwap 会直接清空 targetAmount。另外 parseFloat 的处理也不一致。让我修复 `handleSwap` 使其与 ConversionPanel 的处理逻辑保持一致。

        
            
toolName: todo_write
            
status: success
          
Todos updated: 5 items
          
让我统一 `handleSwap` 的逻辑，使其与 `ConversionPanel` 中的处理方式完全一致，确保边界情况处理正确。







        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\currency-converter\index.jsx
          
changes: undefined
          
现在运行 lint 和测试，确保所有修改都正确。









        
            
toolName: todo_write
            
status: success
          
Todos updated: 5 items
          

        
            
toolName: run_command
            
status: success
          
command: cd c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react ; npx eslint src/pages/currency-converter/ src/pages/__tests__/currency-converter/ undefined
          

        
            
toolName: run_command
            
status: success
          
command: cd c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react ; pnpm run test undefined
          
全部通过！Lint 检查 0 错误，78 个测试文件、5576 个测试用例全部成功。








        
            
toolName: todo_write
            
status: success
          
Todos updated: 5 items
          
所有问题已修复完成，测试全部通过！以下是详细的修复总结：

---

### 修复总结

#### 1. 走势图切换动画修复 & 函数模块化
**新增模块**：[chartUtils.js](file:///C:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/currency-converter/chartUtils.js)

- **`resampleData` 修复**：使用白名单 `INTERPOLATABLE_KEYS = ['x', 'y', 'value']`，**只对连续量属性插值**，排除 `index` 等离散属性。首末元素通过浅拷贝 `{ ...curr }` 保留所有字段（含 `y`、`date`），避免上采样时丢失坐标信息导致 NaN。
- **`interpolateLayout` 加固**：对 `fromPt.y`、`fromPt.value`、`fromT.y` 等所有插值源增加 `typeof === 'number'` 防御性检查，使用降级值（`to.y`、`to.value`）彻底杜绝 undefined 传播到 SVG path。
- **`easeOutCubic`**：独立导出便于测试。

#### 2. 单元测试覆盖
**新增测试文件**：[chartUtils.test.js](file:///C:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/__tests__/currency-converter/chartUtils.test.js)（新增 36 个测试用例）

| 函数 | 测试覆盖范围 |
|---|---|
| `easeOutCubic` | t=0/1 边界、中间值、单调递增性、范围约束 |
| `resampleData` | 空数组、等长拷贝、单点输入、上采样(7→30/90)首尾一致、下采样(30→7)、index 保持整数不插值、白名单属性控制、y 值范围约束 |
| `interpolateLayout` | fromLayout=null/空、progress=0/1 边界、点数相同时插值准确性、点数不同(7→30, 90→7)无 NaN、pathD 合法性（M 开头无 NaN）、yTicks/gridLines 有限性、hoverAreas 引用正确、progress>1 直通 |

#### 3. 互换按钮逻辑统一
**修复文件**：[index.jsx](file:///C:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/currency-converter/index.jsx#L33-L49)

统一为与 `ConversionPanel` 完全一致的数值处理：
```js
// 修复前：const num = parseFloat(newBaseAmount) || 0;  if (num > 0) ...
// 修复后：
const num = parseFloat(newBaseAmount)
if (!isNaN(num) && num >= 0) {
  const converted = convertCurrency(num, newBaseCode, newTargetCode)
  setTargetAmount(converted !== null ? String(converted) : '')
} else {
  setTargetAmount('')
}
```

**修正问题**：
- 去掉 `|| 0` 错误兜底（会把合法 `NaN` 输入伪装成 0）
- 使用 `num >= 0` 支持零值金额正确换算（0 元也应得到 0 而非空字符串）
- 明确使用 `convertCurrency` 按新货币对和新基准金额**重新换算目标金额**，而非仅依赖交换旧值

#### 验证结果
- ✅ **ESLint**：0 错误 0 警告
- ✅ **pnpm run test**：78 个测试文件，**5576 个测试用例全部通过**（新增 36 个 chartUtils 测试全部绿灯）