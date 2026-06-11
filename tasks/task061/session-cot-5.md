让我读取 `index.jsx` 查看 `handleSelectFavorite` 的当前实现。
        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\currency-converter\index.jsx
          
现在修复 `handleSelectFavorite`，使其与 `handleSwap` 保持一致的逻辑。

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\currency-converter\index.jsx
          
changes: undefined
          
现在运行 lint 和测试验证。








        
            
toolName: run_command
            
status: success
          
command: cd c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react ; npx eslint src/pages/currency-converter/ src/pages/__tests__/currency-converter/ undefined
          

        
            
toolName: run_command
            
status: success
          
command: cd c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react ; pnpm run test undefined
          
全部通过！以下是修复总结：

### 修复内容

**修复文件**：[index.jsx](file:///C:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/currency-converter/index.jsx#L64-L74)

`handleSelectFavorite` 函数逻辑与 `handleSwap` 保持完全一致：

```js
// 修复前：const num = parseFloat(baseAmount) || 0;  if (num > 0) ...
// 修复后：
const num = parseFloat(baseAmount)
if (!isNaN(num) && num >= 0) {
  const converted = convertCurrency(num, base, target)
  setTargetAmount(converted !== null ? String(converted) : '')
} else {
  setTargetAmount('')
}
```

**修正问题**：
- 去掉 `|| 0` 错误兜底，避免 NaN 输入被伪装成 0
- 使用 `num >= 0` 支持零值金额正确换算（0 元也应得到 0 而非不触发换算）
- 添加 else 分支，非法输入时清空目标金额，与 `handleSwap` 行为完全统一

### 验证结果
- ✅ **ESLint**：0 错误 0 警告
- ✅ **pnpm run test**：78 个测试文件，**5576 个测试用例全部通过**