我来分析这两个问题并进行修复。首先让我查看相关代码。
        
            
toolName: todo_write
            
status: success
          
Todos updated: 3 items
          
让我先查看相关代码。


        
            
toolName: search_by_regex
            
status: success
          
query: resampleData|interpolateLayout
          

        
            
toolName: search_by_regex
            
status: success
          
query: handleSwap
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\currency-converter\TrendChart.jsx
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\currency-converter\index.jsx
          
现在我理解了两个问题。让我开始修复。

**问题1分析**：`resampleData` 函数只拷贝了 `date` 和 `value`，没有保留 `x`、`y` 等坐标属性，导致插值时 `fromPt.y` 为 `undefined`，产生 `NaN`。

**问题2分析**：`handleSwap` 直接交换了 `baseAmount` 和 `targetAmount`，但当用户手动修改过目标金额时，应该用旧的目标金额作为新基准金额，然后根据新货币对重新换算目标金额。

        
            
toolName: todo_write
            
status: success
          
Todos updated: 3 items
          
先修复 `resampleData` 函数，使其插值所有数值属性，包括 `x`、`y`、`value`：



        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\currency-converter\TrendChart.jsx
          
changes: undefined
          
现在修复 `handleSwap`。当点击互换时，应该用旧的目标金额作为新的基准金额，然后根据新货币对重新计算目标金额：





        
            
toolName: todo_write
            
status: success
          
Todos updated: 3 items
          

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\currency-converter\index.jsx
          
changes: undefined
          
现在运行 lint 检查和测试：







        
            
toolName: todo_write
            
status: success
          
Todos updated: 3 items
          

        
            
toolName: run_command
            
status: success
          
command: cd c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react ; npx eslint src/pages/currency-converter/ src/pages/__tests__/currency-converter/ undefined
          

        
            
toolName: run_command
            
status: success
          
command: cd c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react ; pnpm run test undefined
          
所有测试通过！让我更新任务列表。









        
            
toolName: todo_write
            
status: success
          
Todos updated: 3 items
          
所有问题已修复，测试全部通过！以下是修复总结：

### 修复内容

**1. 走势折线图切换时消失问题** ([TrendChart.jsx](file:///C:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/currency-converter/TrendChart.jsx#L11-L38))

- **问题**：`resampleData` 函数在上采样时只拷贝了 `date` 和 `value` 属性，丢失了 `x`、`y` 等坐标信息，导致 `interpolateLayout` 计算时 `fromPt.y` 为 `undefined`，产生 `NaN` 使折线在动画期间不可见。

- **修复**：重构 `resampleData` 函数，对所有数值属性进行插值计算：
  ```javascript
  const point = { ...curr }
  for (const key of Object.keys(curr)) {
    if (typeof curr[key] === 'number' && typeof next[key] === 'number') {
      point[key] = curr[key] + (next[key] - curr[key]) * frac
    }
  }
  ```
  这样 `x`、`y`、`value` 等所有数值属性都会被正确插值保留。

**2. 互换按钮金额计算错误** ([index.jsx](file:///C:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/currency-converter/index.jsx#L33-L49))

- **问题**：`handleSwap` 只是简单交换 `baseAmount` 和 `targetAmount`，当用户手动修改过目标金额（偏离自动换算值）时，交换后显示错误。

- **修复**：重写 `handleSwap` 逻辑：
  1. 交换货币对（`baseCode` ↔ `targetCode`）
  2. 用旧的 `targetAmount` 作为新的 `baseAmount`
  3. **根据新货币对和新基准金额重新调用 `convertCurrency` 计算目标金额**

### 验证结果
- ✅ ESLint 检查通过（0 错误）
- ✅ 所有 77 个测试文件、5540 个测试用例全部通过