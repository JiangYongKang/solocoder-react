我来逐一修复这些问题。先检查相关文件的代码。
        
            
toolName: todo_write
            
status: success
          
Todos updated: 4 items
          
让我先检查相关代码：

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\inventory\utils.js
          
让我检查 StockChart.jsx 和 SkuFlowLogs.jsx 的当前实现：



        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\inventory\StockChart.jsx
          
让我检查 index.jsx 中流水日志的生成逻辑：





        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\inventory\index.jsx
          
让我检查一下 constants.js 中的默认数据，以及测试文件：






        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\inventory\constants.js
          
让我检查 SkuFlowLogs.jsx 中的 CSS 类名问题：







        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\inventory\SkuFlowLogs.jsx
          
让我检查 CSS 文件中是否有 transfer 样式：






        
            
toolName: search_by_regex
            
status: success
          
query: flow-icon|transfer|\.inbound|\.outbound
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\inventory\inventory.css
          
让我先运行测试，看看有哪些失败了：




        
            
toolName: todo_write
            
status: success
          
Todos updated: 4 items
          

        
            
toolName: run_command
            
status: success
          
command: cd "c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react" ; pnpm test -- src/pages/__tests__/inventory/ --reporter=verbose undefined
          
让我仔细检查 `buildStockHistory` 函数的逻辑。我注意到它依赖 flowLogs 的顺序，可能存在问题。让我检查并修复：



        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\inventory\utils.js
          
我发现了几个问题。让我逐一修复：

**问题1**：`buildStockHistory` 函数中取 SKU 最后一条流水的方式有问题（依赖 flowLogs 顺序），且应该明确使用 `balanceAfterTotal` 表示全仓总库存。

**问题2**：`applyStocktake` 中创建的流水没有设置 `balanceAfterTotal`。

**问题3**：需要确认 `buildStockHistoryByWarehouse` 和 `buildStockHistoryBySku` 正确基于 flowLogs 计算。

让我开始修复：




        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\inventory\utils.js
          
让我先修复 `applyStocktake` 中缺少 `balanceAfterTotal` 的问题，然后修复 `buildStockHistory` 函数：




        
            
toolName: edit_file_search_replace
            
status: interrupted
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3
          
          
让我修复这些问题。首先修复 `applyStocktake` 中缺少 `balanceAfterTotal` 的问题，然后修复 `buildStockHistory` 函数的逻辑：





        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\inventory\utils.js
          
changes: undefined
          
现在让我修复 `buildStockHistory` 函数，确保它正确使用 `balanceAfterTotal` 并且不依赖 flowLogs 的传入顺序：




        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\inventory\utils.js
          
changes: undefined
          
让我读取 `buildStockHistoryBySku` 函数的完整实现：






        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\inventory\utils.js
          
现在让我确认一下 SkuFlowLogs 中的 CSS 类名问题。虽然我看到代码中已经返回 'transfer'，但让我再仔细检查一下，确保调拨操作使用独立的样式：







        
            
toolName: todo_write
            
status: success
          
Todos updated: 4 items
          
我发现了一个关键问题：`buildStockHistory` 函数在 flowLogs 为空时总库存为 0，而应该基于当前批次倒推（和另外两个函数保持一致）。让我重写它使用统一的倒推法：







        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\inventory\utils.js
          
changes: undefined
          
让我清理一下 `buildStockHistory` 函数，它的签名应该和其他两个函数一致，接收 batches 参数。然后更新 StockChart.jsx 中的调用：







        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\inventory\utils.js
          
changes: undefined
          
现在让我更新 StockChart.jsx 中的调用，因为 `buildStockHistory` 的签名改变了（用 batches 替代了 skus）：









        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\inventory\StockChart.jsx
          
changes: undefined
          
现在让我检查一下测试文件，看看 `buildStockHistory` 的测试用例是否需要更新：










        
            
toolName: search_by_regex
            
status: success
          
query: buildStockHistory
          
测试中没有 `buildStockHistory` 的用例。现在让我确认问题3 - 虽然代码看起来已经正确，但让我再仔细检查 SkuFlowLogs.jsx，确保调拨操作确实使用 transfer 样式：










        
            
toolName: todo_write
            
status: success
          
Todos updated: 4 items
          
让我再确认一下 SkuFlowLogs.jsx 的内容，确保我没有看错：








        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\inventory\SkuFlowLogs.jsx
          
我看到 SkuFlowLogs.jsx 中的 `getFlowIconClass` 函数已经返回 'transfer' 了。让我检查一下 index.jsx 中是否也有类似的映射需要修复：









        
            
toolName: search_by_regex
            
status: success
          
query: flow-icon|getFlowIcon|transfer
          
好的，SkuFlowLogs.jsx 中的 `getFlowIconClass` 已经正确返回 'transfer' 了。现在让我运行测试，看看我的修改是否通过：










        
            
toolName: todo_write
            
status: success
          
Todos updated: 4 items
          

        
            
toolName: run_command
            
status: success
          
command: cd "c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react" ; pnpm test -- src/pages/__tests__/inventory/ undefined
          
所有73个测试都通过了。现在让我运行构建验证，确保代码能正常编译：












        
            
toolName: run_command
            
status: success
          
command: cd "c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react" ; pnpm build undefined
          
构建成功！让我更新任务状态并总结修复内容：











        
            
toolName: todo_write
            
status: success
          
Todos updated: 4 items
          
所有问题已修复完成！以下是修复总结：

## 修复内容

### 1. 修复 `applyStocktake` 缺少 `balanceAfterTotal` 字段
**文件**: [utils.js](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/inventory/utils.js#L316-L330)

盘点调整产生的流水日志现在会正确设置 `balanceAfterTotal`（全仓总库存），与入库、出库、调拨操作保持一致。

### 2. 重构 `buildStockHistory` 函数，统一使用倒推法
**文件**: [utils.js](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/inventory/utils.js#L380-L434)

- **之前**：基于 `balanceAfter`/`balanceAfterTotal` 字段聚合，存在依赖 flowLogs 顺序、flowLogs 为空时总库存为 0 等问题
- **现在**：与 `buildStockHistoryByWarehouse` 和 `buildStockHistoryBySku` 统一使用**倒推法**
  - 从当前批次（batches）快照计算当前库存作为基准
  - 基于 flowLogs 按天计算净变化量（入库、出库、调拨、盘点调整）
  - 从今天往回倒推，逐天重建历史库存量
  - 即使 flowLogs 为空，也能正确显示当前库存水平线（而非 0）

函数签名从 `buildStockHistory(flowLogs, skus, days)` 改为 `buildStockHistory(flowLogs, batches, days)`，与另外两个函数保持一致。

### 3. 更新 StockChart.jsx 调用
**文件**: [StockChart.jsx](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/inventory/StockChart.jsx#L21-L63)

同步更新了总览、按仓库全部、按 SKU 全部三种视图下的 `buildStockHistory` 调用，传入 `batches` 参数。

### 4. 确认调拨操作 CSS 类名
**文件**: [SkuFlowLogs.jsx](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/inventory/SkuFlowLogs.jsx#L44-L50)

经确认，`getFlowIconClass` 函数已正确将 `transfer_in` 和 `transfer_out` 映射为 `'transfer'` 类名，与 CSS 中的 `.flow-icon.transfer` 蓝色样式匹配。

## 验证结果

- ✅ **73个单元测试**全部通过
- ✅ **生产构建**成功
- ✅ 三个库存历史计算函数（总览、按仓库、按 SKU）使用统一的倒推法算法
- ✅ 所有流水记录均包含 `balanceAfter`（单仓）和 `balanceAfterTotal`（全仓）两个字段