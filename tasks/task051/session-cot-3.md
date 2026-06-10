好的，让我逐一修复这些问题。
        
            
toolName: todo_write
            
status: success
          
Todos updated: 4 items
          
先读取当前的 logisticsUtils.js 和测试文件：





        
            
toolName: view_files
            
status: success
          
            
filePath: /Users/vincent/GoletaLab/solocoder-react/src/pages/logistics-tracker/logisticsUtils.js
          

        
            
toolName: view_files
            
status: success
          
            
filePath: /Users/vincent/GoletaLab/solocoder-react/src/pages/__tests__/logistics-tracker/logisticsUtils.test.js
          
现在我来修复这些问题。首先修复 extractRoutePoints 的同城覆盖 BUG：





        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: /Users/vincent/GoletaLab/solocoder-react/src/pages/logistics-tracker/logisticsUtils.js
          
changes: undefined
          
现在更新测试文件，修复同城测试用例并补充缺失的测试：








        
            
toolName: todo_write
            
status: success
          
Todos updated: 4 items
          
现在修改测试文件。先修改同城测试用例：







        
            
toolName: view_files
            
status: success
          
            
filePath: /Users/vincent/GoletaLab/solocoder-react/src/pages/__tests__/logistics-tracker/logisticsUtils.test.js
          
现在修改测试文件：更新同城测试用例 + 补充缺失的所有测试用例：







        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: /Users/vincent/GoletaLab/solocoder-react/src/pages/__tests__/logistics-tracker/logisticsUtils.test.js
          
changes: undefined
          
现在补充 mapSfOpcode default 分支测试和四种快递未签收边界测试：







        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: /Users/vincent/GoletaLab/solocoder-react/src/pages/__tests__/logistics-tracker/logisticsUtils.test.js
          
changes: undefined
          
现在补充四种快递的未签收边界场景测试。先读取 YT 测试的位置：








        
            
toolName: view_files
            
status: success
          
            
filePath: /Users/vincent/GoletaLab/solocoder-react/src/pages/__tests__/logistics-tracker/logisticsUtils.test.js
          
现在为四种快递添加未签收边界测试用例：










        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: /Users/vincent/GoletaLab/solocoder-react/src/pages/__tests__/logistics-tracker/logisticsUtils.test.js
          
changes: undefined
          
现在添加 YD、JD、EMS 的未签收边界测试：












        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: /Users/vincent/GoletaLab/solocoder-react/src/pages/__tests__/logistics-tracker/logisticsUtils.test.js
          
changes: undefined
          
现在添加 EMS 未签收边界测试：















        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: /Users/vincent/GoletaLab/solocoder-react/src/pages/__tests__/logistics-tracker/logisticsUtils.test.js
          
changes: undefined
          
现在更新 todo 并运行所有测试：













        
            
toolName: todo_write
            
status: success
          
Todos updated: 4 items
          
现在运行测试：



















        
            
toolName: run_command
            
status: success
          
command: cd /Users/vincent/GoletaLab/solocoder-react && pnpm run test 2>&1 | tail -80 undefined
          
所有 4736 个测试全部通过！现在标记任务完成：
















        
            
toolName: todo_write
            
status: success
          
Todos updated: 4 items
          
所有 4 个问题已修复完成，**4736 个测试全部通过**。以下是修复内容总结：

---

### 修复 1：`extractRoutePoints` 同城覆盖 BUG

**文件**：[logisticsUtils.js](file:///Users/vincent/GoletaLab/solocoder-react/src/pages/logistics-tracker/logisticsUtils.js#L424-L490)

**根因**：当 `origin === destination` 时，Map 的 `pointMap.set(city, { type: 'destination' })` 会覆盖之前写入的 `{ type: 'origin' }`，导致最终只有一个 `type='destination'` 的点。

**修复方案**：新增 `isSameCity` 标志检测，同城场景不走 Map 去重流程，而是直接向 result 数组分别压入两个同坐标、不同 type 的点：

```javascript
const isSameCity = parsedData.origin && parsedData.destination && parsedData.origin === parsedData.destination

if (isSameCity) {
  const coord = CITY_COORDINATES[parsedData.origin]
  if (coord) {
    result.push({ city: parsedData.origin, x: coord.x, y: coord.y, type: 'origin' })
    result.push({ city: parsedData.destination, x: coord.x, y: coord.y, type: 'destination' })
    return result
  }
}
```

---

### 修复 2：`mapSfOpcode` default 分支测试覆盖

**文件**：[logisticsUtils.test.js](file:///Users/vincent/GoletaLab/solocoder-react/src/pages/__tests__/logistics-tracker/logisticsUtils.test.js#L245-L295)

新增 2 个测试用例覆盖 default 分支：
- `opcode='999'`（非标准）+ `hasException=true` → 判定为 `EXCEPTION`
- `opcode='999'`（非标准）+ `hasException=false` → 判定为 `IN_TRANSIT`

这两组测试确保即使 remark 文本包含/不包含"异常"字样，判断逻辑也严格基于 `hasOrderException` 标志位。

---

### 修复 3：四种快递未签收边界场景测试

**文件**：[logisticsUtils.test.js](file:///Users/vincent/GoletaLab/solocoder-react/src/pages/__tests__/logistics-tracker/logisticsUtils.test.js#L311-L503)

补全了 4 个边界测试，验证未签收时 `signer` 为 `null` 的行为：

| 快递公司 | 测试函数 | 触发条件 | 验证点 |
|---------|---------|---------|-------|
| 圆通 YT | `parseYtOrder` | `statusCode !== 'SIGNED'` | `isSigned=false, signer=null, signTime=null` |
| 韵达 YD | `parseYdOrder` | `signStatus !== '1'` | `isSigned=false, signer=null, signTime=null` |
| 京东 JD | `parseJdOrder` | `finished=false` | `isSigned=false, signer=null, signTime=null` |
| EMS | `parseEmsOrder` | `deliveryStatus !== 'delivered'` | `isSigned=false, hasException=false, signer=null, signTime=null` |

---

### 测试结果

```
Test Files  67 passed (67)
     Tests  4736 passed (4736)
  Duration  2.25s
```