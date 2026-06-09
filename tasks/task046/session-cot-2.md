好的，我来修复这个边界条件问题。首先让我读取相关文件确认当前逻辑。

        
            
toolName: todo_write
            
status: success
          
Todos updated: 3 items
          

        
            
toolName: view_files
            
status: success
          
            
filePath: /Users/vincent/GoletaLab/solocoder-react/src/pages/flash-sale/flashSaleUtils.js
          

        
            
toolName: view_files
            
status: success
          
            
filePath: /Users/vincent/GoletaLab/solocoder-react/src/pages/__tests__/flash-sale/flashSaleUtils.test.js
          
好的，我来修复边界条件。需要把 `>= 0.5` 改为 `> 0.5`，这样 50% 就会落到橙色区间。同时保持 20% 属于橙色区间的逻辑。

首先修复 [flashSaleUtils.js](file:///Users/vincent/GoletaLab/solocoder-react/src/pages/flash-sale/flashSaleUtils.js#L75-L84) 中的 `getStockColor` 函数：



        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: /Users/vincent/GoletaLab/solocoder-react/src/pages/flash-sale/flashSaleUtils.js
          
changes: undefined
          

        
            
toolName: todo_write
            
status: success
          
Todos updated: 3 items
          
现在修正测试文件 [flashSaleUtils.test.js](file:///Users/vincent/GoletaLab/solocoder-react/src/pages/__tests__/flash-sale/flashSaleUtils.test.js#L198-L214)：




        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: /Users/vincent/GoletaLab/solocoder-react/src/pages/__tests__/flash-sale/flashSaleUtils.test.js
          
changes: undefined
          

        
            
toolName: todo_write
            
status: success
          
Todos updated: 3 items
          
现在运行测试和 lint：






        
            
toolName: run_command
            
status: success
          
command: pnpm run test -- src/pages/__tests__/flash-sale/ undefined
          

        
            
toolName: run_command
            
status: success
          
command: pnpm exec eslint src/pages/flash-sale/ undefined
          
ESLint 检查通过！现在让我只运行我们 flash-sale 相关的测试来确认：








        
            
toolName: run_command
            
status: success
          
command: pnpm exec vitest run src/pages/__tests__/flash-sale/flashSaleUtils.test.js undefined
          

        
            
toolName: todo_write
            
status: success
          
Todos updated: 3 items
          
边界条件修复完成！以下是修改内容：

## 修改的文件

### 1. [flashSaleUtils.js](file:///Users/vincent/GoletaLab/solocoder-react/src/pages/flash-sale/flashSaleUtils.js#L75-L84)
将 `getStockColor` 函数的绿色判定从 `>= 0.5` 改为 `> 0.5`：

```javascript
// 修改前
if (percentage >= STOCK_COLOR_THRESHOLDS.HIGH)  // 50% 会显示绿色

// 修改后
if (percentage > STOCK_COLOR_THRESHOLDS.HIGH)   // 50% 会显示橙色
```

### 2. [flashSaleUtils.test.js](file:///Users/vincent/GoletaLab/solocoder-react/src/pages/__tests__/flash-sale/flashSaleUtils.test.js#L198-L215)
同步修正测试用例的期望值：
- 绿色测试：50 → 51，描述从「>=50%」改为「>50%」
- 橙色测试：新增 `getStockColor(50, 100)` 断言为橙色

## 验证结果
- ✅ **55 个单元测试全部通过**（flash-sale 模块）
- ✅ **ESLint 无报错**（flash-sale 模块）

最终的颜色区间逻辑：
| 库存比例 | 颜色 | 边界说明 |
|---------|------|---------|
| > 50% | 绿色 | 51%~100% |
| 20% ~ 50% | 橙色 | 含 20% 和 50% |
| < 20% | 红色 | 0%~19% |