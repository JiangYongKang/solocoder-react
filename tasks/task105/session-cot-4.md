toolName: todo_write
            
status: success
          
Todos updated: 2 items
          
让我先读取这两个测试用例的代码：

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\inventory\utils.test.js
          
现在让我将这两个算术表达式断言替换为手工推算的具体数值：


        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\inventory\utils.test.js
          
changes: undefined
          
现在运行测试验证：



        
            
toolName: todo_write
            
status: success
          
Todos updated: 2 items
          

        
            
toolName: run_command
            
status: success
          
command: cd "c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react" ; pnpm run test undefined
          
全部 9669 个测试通过！




        
            
toolName: todo_write
            
status: success
          
Todos updated: 2 items
          
修复完成！以下是修改总结：

## 修复内容

将 [utils.test.js](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/__tests__/inventory/utils.test.js#L714-L738) 中两个测试用例的算术表达式断言替换为手工推算的具体数值：

### 1. `retrogrades multi-day flow correctly`（第723行）

- **修改前**：`expect(day0.totalStock).toBe(180 - 50 + 20 - 10)`
- **修改后**：`expect(day0.totalStock).toBe(140)`

手工推算过程：
- 当前库存 180（batches 快照）
- 3天前入库 +50 → 倒推时减 50
- 2天前调拨入库 +10 → 倒推时减 10
- 昨天出库 -20 → 倒推时加 20
- 最早一天（第0天）库存 = 180 - 50 - 10 + 20 = **140**

### 2. `includes stocktake adjustments in net change`（第737行）

- **修改前**：`expect(yesterday.totalStock).toBe(180 - 5 + 10)`
- **修改后**：`expect(yesterday.totalStock).toBe(185)`

手工推算过程：
- 当前库存 180
- 今天盘点：sku1 +5（盘盈，计入 stocktakeIn），sku2 -10（盘亏，计入 outbound）
- 今天净变化 net = 5 - 10 = -5
- 昨天库存 = 180 - (-5) = **185**

### 测试结果

✅ 全项目 **9669 个测试全部通过**