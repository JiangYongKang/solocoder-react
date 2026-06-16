我来修复这些测试断言精度问题。首先让我更精确地分析 `drawQRCode` 的实际绘制调用次数和模式。


        
            
toolName: todo_write
            
status: success
          
Todos updated: 4 items
          
让我先写一个快速诊断脚本来精确统计 drawQRCode 的实际调用次数：







        
            
toolName: Write
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\share-card\_diagnostic.test.js
          
changes: undefined
          

        
            
toolName: run_command
            
status: success
          
command: pnpm test -- src/pages/__tests__/share-card/_diagnostic.test.js 2>&1 | Select-String -Pattern '===|count:|sequence:|fillRect|fillText|moveTo|first|last' -Context 0,0 undefined
          

        
            
toolName: run_command
            
status: success
          
command: pnpm test -- src/pages/__tests__/share-card/_diagnostic.test.js undefined
          
console.log 输出被 vitest 过滤了。让我通过断言来精确验证调用次数，并直接重写测试文件：










        
            
toolName: todo_write
            
status: success
          
Todos updated: 4 items
          
现在我来完全重写 canvasRenderer 测试文件，使用精确的断言：









        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\share-card\canvasRenderer.js
          
现在我完全掌握了绘制逻辑。让我重写测试文件，使用精确的断言：
















        
            
toolName: Write
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\share-card\canvasRenderer.test.js
          
changes: undefined
          
现在删除诊断文件并运行测试：
















        
            
toolName: delete_file
            
status: success
          
deleteFilesSingular
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\share-card\_diagnostic.test.js
          

        
            
toolName: run_command
            
status: success
          
command: cd c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react ; pnpm run test src/pages/__tests__/share-card --reporter=verbose undefined
          
只有 1 个测试失败：lineTo 数量是 12 而不是 9。说明每个 roundRect 有 4 个 lineTo（4 条直边），不是 3 个。修正一下：

















        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\share-card\canvasRenderer.test.js
          

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\share-card\canvasRenderer.test.js
          
changes: undefined
          
再次运行测试验证：


















        
            
toolName: run_command
            
status: success
          
command: cd c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react ; pnpm run test src/pages/__tests__/share-card --reporter=verbose undefined
          
所有 139 个测试通过！让我更新任务状态：
        
            
toolName: todo_write
            
status: success
          
Todos updated: 4 items
          
修复完成！所有测试通过。以下是修复内容总结：

## 修复内容

### 1. QR 码位置测试断言修正
**问题**：原测试错误假设 `roundRect` 产生 8 个 `moveTo` 调用，实际只有 1 个，测试因索引巧合（fillStyle 恰好同色）通过。

**修复**：改用精确的绘制调用计数断言：
- `beginPath` = 3（3 个圆角矩形）
- `closePath` = 3
- `fill` = 3
- `moveTo` = 3（每个 roundRect 1 个）
- `lineTo` = 12（每个 roundRect 4 条直边）
- `quadraticCurveTo` = 12（每个 roundRect 4 个圆角）

同时精确验证第一个 `moveTo` 坐标（QR 背景左上角位置）。

### 2. QR 矩阵 fillRect 验证精度提升
**问题**：原测试 `toBeGreaterThan(100)` 下限过低，仅 3 个定位图案就有约 109 个 fillRect，数据区域即使完全未绘制测试也能通过。

**修复**：多维度精确验证策略：
- **总数范围**：250 ~ 420（25×25 = 625 格，约 40%-67% 填充率）
- **定位图案区**：左上 7×7 区域验证
- **数据区域验证**：右下 13×13 区域有 ≥ 30 个黑格（排除只有定位图案的情况）
- **远超基础量**：超过 `3*33 + 10 + 150 = 259` 个（定位图案 + 时序图案 + 数据区最低量）
- **内容差异性**：不同内容的 fillRect 坐标集合差异 > 20 个
- **cell 尺寸一致性**：所有 fillRect 宽高接近预期 cellSize

## 测试结果

**139 个测试全部通过** ✅
- [utils.test.js](file:///C:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/__tests__/share-card/utils.test.js)：94 个测试
- [canvasRenderer.test.js](file:///C:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/__tests__/share-card/canvasRenderer.test.js)：45 个测试