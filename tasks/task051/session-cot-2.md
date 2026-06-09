好的，我来逐一修复这些问题。让我先查看相关代码和数据结构。

        
            
toolName: todo_write
            
status: success
          
Todos updated: 5 items
          
先读取 mockData.js 和 logisticsUtils.js 来了解数据结构：



        
            
toolName: view_files
            
status: success
          
            
filePath: /Users/vincent/GoletaLab/solocoder-react/src/pages/logistics-tracker/mockData.js
          

        
            
toolName: view_files
            
status: success
          
            
filePath: /Users/vincent/GoletaLab/solocoder-react/src/pages/logistics-tracker/logisticsUtils.js
          
让我读取测试文件了解如何修改：



        
            
toolName: view_files
            
status: success
          
            
filePath: /Users/vincent/GoletaLab/solocoder-react/src/pages/__tests__/logistics-tracker/logisticsUtils.test.js
          
现在我了解了所有数据结构。让我逐一修复这些问题。首先修改 logisticsUtils.js：






        
            
toolName: todo_write
            
status: success
          
Todos updated: 5 items
          
让我先修改 mockData.js，为各快递公司补充签收人相关字段，然后修复 logisticsUtils.js：








        
            
toolName: Write
            
status: success
          
            
filePath: /Users/vincent/GoletaLab/solocoder-react/src/pages/logistics-tracker/mockData.js
          
changes: undefined
          
现在重写 logisticsUtils.js，修复所有问题：








        
            
toolName: Write
            
status: success
          
            
filePath: /Users/vincent/GoletaLab/solocoder-react/src/pages/logistics-tracker/logisticsUtils.js
          
changes: undefined
          
现在更新 todo 并修改测试文件，使其通过 mock 全局 localStorage 来测试：










        
            
toolName: todo_write
            
status: success
          
Todos updated: 5 items
          
现在重写测试文件：










        
            
toolName: Write
            
status: success
          
            
filePath: /Users/vincent/GoletaLab/solocoder-react/src/pages/__tests__/logistics-tracker/logisticsUtils.test.js
          
changes: undefined
          
现在运行测试：











        
            
toolName: todo_write
            
status: success
          
Todos updated: 5 items
          

        
            
toolName: run_command
            
status: success
          
command: cd /Users/vincent/GoletaLab/solocoder-react && npx vitest run src/pages/__tests__/logistics-tracker/logisticsUtils.test.js 2>&1 undefined
          
需要从 vitest 导入 `afterEach`：










        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: /Users/vincent/GoletaLab/solocoder-react/src/pages/__tests__/logistics-tracker/logisticsUtils.test.js
          
changes: undefined
          

        
            
toolName: run_command
            
status: success
          
command: cd /Users/vincent/GoletaLab/solocoder-react && npx vitest run src/pages/__tests__/logistics-tracker/logisticsUtils.test.js 2>&1 undefined
          
问题是 mock 挂在 `global.localStorage` 上，但生产代码用的是 `window.localStorage`。让我修复测试的 mock 方式：










        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: /Users/vincent/GoletaLab/solocoder-react/src/pages/__tests__/logistics-tracker/logisticsUtils.test.js
          
changes: undefined
          

        
            
toolName: run_command
            
status: success
          
command: cd /Users/vincent/GoletaLab/solocoder-react && npx vitest run src/pages/__tests__/logistics-tracker/logisticsUtils.test.js 2>&1 undefined
          
所有 54 个测试都通过了！现在运行 lint 检查：









        
            
toolName: run_command
            
status: success
          
command: cd /Users/vincent/GoletaLab/solocoder-react && npx eslint src/pages/logistics-tracker/ src/pages/__tests__/logistics-tracker/ 2>&1 undefined
          
有 3 个 `global` 未定义的 lint 错误。让我用 `globalThis` 替代：









        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: /Users/vincent/GoletaLab/solocoder-react/src/pages/__tests__/logistics-tracker/logisticsUtils.test.js
          
changes: undefined
          

        
            
toolName: run_command
            
status: success
          
command: cd /Users/vincent/GoletaLab/solocoder-react && npx eslint src/pages/logistics-tracker/ src/pages/__tests__/logistics-tracker/ 2>&1 && echo "--- LINT PASSED ---" && npx vitest run src/pages/__tests__/logistics-tracker/logisticsUtils.test.js 2>&1 undefined
          

        
            
toolName: todo_write
            
status: success
          
Todos updated: 5 items
          
所有 5 个问题已全部修复完成！✅ Lint 通过，54 个单元测试全部通过。

## 修复内容总结

### 1. 签收人信息提取 ✅
修改了 [mockData.js](file:///Users/vincent/GoletaLab/solocoder-react/src/pages/logistics-tracker/mockData.js) 和 [logisticsUtils.js](file:///Users/vincent/GoletaLab/solocoder-react/src/pages/logistics-tracker/logisticsUtils.js)：
- **圆通(YT)**: 新增 `signerName`、`signTime` 字段，解析函数从订单级字段或签收节点 `operator` 提取
- **中通(ZT)**: 新增已签收订单 `ZT111222333444`，解析函数从 `signedName`/`signTime` 字段提取
- **韵达(YD)**: 新增 `signer`、`signTimestamp` 字段，解析函数正确提取
- **京东(JD)**: 新增 `receiver`、`receivedTime` 字段，解析函数正确提取
- **EMS**: 新增 `signedBy`、`signedAt` 字段，解析函数正确提取

### 2. 地图终点渲染 BUG ✅
重写了 [extractRoutePoints](file:///Users/vincent/GoletaLab/solocoder-react/src/pages/logistics-tracker/logisticsUtils.js#L424-L472) 函数：
- 使用 `Map` 存储城市→点映射，**最后写入 destination 覆盖 route 类型**
- 输出顺序确保：起点 → 途经点 → 终点，终点始终在列表末尾且 `type: 'destination'`

### 3. 顺丰异常状态判断 ✅
修改了 [mapSfOpcode](file:///Users/vincent/GoletaLab/solocoder-react/src/pages/logistics-tracker/logisticsUtils.js#L65-L77) 函数：
- 移除了 default 分支中 `remark.includes('异常')` 的文本匹配
- 改为基于 `opcode === '99'` 或订单级 `hasException` 标志判断
- 新增测试覆盖：remark 文本写着"一切正常"但 opcode=99 且 hasException=true 时仍正确识别异常

### 4. 工具函数接口恢复 ✅
修改了 [logisticsUtils.js](file:///Users/vincent/GoletaLab/solocoder-react/src/pages/logistics-tracker/logisticsUtils.js) 中的 localStorage 相关函数：
- 移除 `loadQueryHistory`、`saveQueryHistory`、`addQueryRecord`、`clearQueryHistory` 的 `storage` 参数
- 新增内部 `getStorage()` 辅助函数直接访问 `window.localStorage`
- 测试侧通过 `mockWindowLocalStorage()` mock `globalThis.window.localStorage`

### 验证结果
- **54 个测试全部通过**
- **ESLint 0 错误**