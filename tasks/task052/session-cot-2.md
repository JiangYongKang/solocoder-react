我来分析并修复这两个问题。首先让我读取相关文件的代码。




        
            
toolName: todo_write
            
status: success
          
Todos updated: 3 items
          

        
            
toolName: view_files
            
status: success
          
            
filePath: /Users/vincent/GoletaLab/solocoder-react/src/pages/pivot-table/pivotCore.js
          

        
            
toolName: view_files
            
status: success
          
            
filePath: /Users/vincent/GoletaLab/solocoder-react/src/pages/pivot-table/pivotCore.js
          

        
            
toolName: view_files
            
status: success
          
            
filePath: /Users/vincent/GoletaLab/solocoder-react/src/pages/pivot-table/pivotCore.js
          

        
            
toolName: view_files
            
status: success
          
            
filePath: /Users/vincent/GoletaLab/solocoder-react/src/pages/pivot-table/pivotCore.js
          
现在我理解了两个问题。让我逐一修复：

**问题 1**：当 `colFields` 为空时，`colKeys = ['__all__']`，导致总计行中 `colTotals['__all__']` 和 `grandTotal` 相同值输出两次。

**问题 2**：`aggregate` 函数的 `if` 条件覆盖了所有 5 种聚合类型，`return null` 永远不可达。





        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: /Users/vincent/GoletaLab/solocoder-react/src/pages/pivot-table/pivotCore.js
          
changes: undefined
          
现在修复 pivotTableToCSV 函数中列字段为空时的冗余合计问题。需要同时修复表头、数据行和合计行三部分逻辑：







        
            
toolName: todo_write
            
status: success
          
Todos updated: 3 items
          

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: /Users/vincent/GoletaLab/solocoder-react/src/pages/pivot-table/pivotCore.js
          
changes: undefined
          
现在需要更新测试，适配 `aggregate` 函数的改动（空数组/非数组对所有聚合类型都返回 0），同时添加 CSV 冗余合计的测试：









        
            
toolName: todo_write
            
status: success
          
Todos updated: 3 items
          

        
            
toolName: view_files
            
status: success
          
            
filePath: /Users/vincent/GoletaLab/solocoder-react/src/pages/__tests__/pivot-table/pivotCore.test.js
          
现在更新测试文件：修正 aggregate 相关的测试，添加 CSV 冗余合计的验证测试。







        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: /Users/vincent/GoletaLab/solocoder-react/src/pages/__tests__/pivot-table/pivotCore.test.js
          
changes: undefined
          
现在添加 CSV 冗余合计的测试：








        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: /Users/vincent/GoletaLab/solocoder-react/src/pages/__tests__/pivot-table/pivotCore.test.js
          
changes: undefined
          
现在运行测试：










        
            
toolName: run_command
            
status: success
          
command: cd /Users/vincent/GoletaLab/solocoder-react && npm test -- src/pages/__tests__/pivot-table/pivotCore.test.js 2>&1 undefined
          
CSV 数字包含逗号，被正确转义了，所以简单的 split(',') 无法解析。让我修正测试：










        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: /Users/vincent/GoletaLab/solocoder-react/src/pages/__tests__/pivot-table/pivotCore.test.js
          
changes: undefined
          

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: /Users/vincent/GoletaLab/solocoder-react/src/pages/__tests__/pivot-table/pivotCore.test.js
          
changes: undefined
          
再次运行测试：











        
            
toolName: run_command
            
status: success
          
command: cd /Users/vincent/GoletaLab/solocoder-react && npm test -- src/pages/__tests__/pivot-table/pivotCore.test.js 2>&1 undefined
          
所有 76 个测试全部通过。让我标记任务完成：










        
            
toolName: todo_write
            
status: success
          
Todos updated: 3 items
          
全部修复完成！✅ 以下是修改内容：

## 🔧 修复内容

### 1. CSV 导出冗余合计行问题
**文件**: [pivotCore.js](file:///Users/vincent/GoletaLab/solocoder-react/src/pages/pivot-table/pivotCore.js#L294-L373)

当 `colFields` 为空时，`getAllKeys` 返回 `['__all__']`，原来的逻辑会同时输出 `colTotals['__all__']` 和 `grandTotal`，导致同一个合计值重复。

修复方式：将表头、数据行、合计行三段逻辑都按 `hasColFields` 分支处理：
- **无列字段**：只输出 `rowTotals`（行聚合值）和 `grandTotal`（总计），不再遍历 colKeys
- **有列字段**：保持原逻辑不变，输出列维度的交叉值 + 列合计 + 总计

### 2. aggregate 函数死代码清理
**文件**: [pivotCore.js](file:///Users/vincent/GoletaLab/solocoder-react/src/pages/pivot-table/pivotCore.js#L26-L29)

原代码在 `values` 为空时，`if` 条件枚举了全部 5 种聚合类型都 `return 0`，导致最后的 `return null` 永远不可达。

修复方式：直接简化为 `return 0`，因为所有合法聚合类型在空数据时都返回 0，非法聚合类型也统一返回 0（避免了永远不可达的分支）。非空数据时的非法聚合类型仍通过 switch 的 default 返回 null。

### 3. 单元测试更新
**文件**: [pivotCore.test.js](file:///Users/vincent/GoletaLab/solocoder-react/src/pages/__tests__/pivot-table/pivotCore.test.js)

- 更新 `aggregate` 相关测试：空数据/非法聚合返回 0
- 新增 2 个 CSV 导出测试：验证无列字段时不会产生冗余合计列、表头正确

## ✅ 测试结果
全部 **76 个测试通过** ✓