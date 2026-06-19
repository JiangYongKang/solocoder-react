toolName: todo_write
            
status: success
          
Todos updated: 3 items
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\loading-animation\loadingAnimationCore.js
          

        
            
toolName: todo_write
            
status: success
          
Todos updated: 2 items
          
现在修复这两个问题。核心思路：对 wave 组使用**组级别的命名策略**——每组分配一个 groupIndex，第 0 组全部保留原名，第 N 组全部加 `-N` 后缀，组内命名统一，同时删除死代码。


        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\loading-animation\loadingAnimationCore.js
          
changes: undefined
          
现在运行测试验证修复：




        
            
toolName: run_command
            
status: success
          
command: npm test -- src/pages/__tests__/loading-animation/ undefined
          
测试失败是因为测试预期的旧后缀（`wave-0-5`）与新的组级统一命名（`wave-0-1`）不一致。新的命名策略更清晰：第 0 组保留原名，第 1 组统一加 `-1` 后缀。需要更新测试用例：





        
            
toolName: todo_write
            
status: success
          
Todos updated: 2 items
          

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\loading-animation\loadingAnimationCore.test.js
          
changes: undefined
          
现在运行测试：





        
            
toolName: run_command
            
status: success
          
command: npm test -- src/pages/__tests__/loading-animation/ undefined
          
测试假设错误——第一个 wave 组（groupIndex=0）无论前面有没有其他类型 keyframe，都会保留原名，因为组内编号独立。这是正确的行为（wave 和非 wave 名称不冲突）。需要修正测试，验证"组内命名统一"而非假设具体后缀：







        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\loading-animation\loadingAnimationCore.test.js
          
changes: undefined
          
现在运行测试：







        
            
toolName: run_command
            
status: success
          
command: npm test -- src/pages/__tests__/loading-animation/ undefined
          
所有 100 个测试通过！现在运行 lint 检查：









        
            
toolName: run_command
            
status: success
          
command: npx eslint src/pages/loading-animation/ src/pages/__tests__/loading-animation/ undefined
          

        
            
toolName: todo_write
            
status: success
          
Todos updated: 2 items
          
全部修复完成！

## 修复总结

### 修复 1：删除 deduplicateKeyframes 第 555 行死代码
**文件**：[loadingAnimationCore.js](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/loading-animation/loadingAnimationCore.js#L524-L603)

原代码第 555 行：
```javascript
seen.set(`${genName}::${configSignature(config)}`, seen.get(genSig) || genName)
```
是完全冗余的死代码——`genSig` 变量在 544 行定义为同一 key，该 key 已在 546/549 行通过条件分支写入 `seen`，第 555 行只是用同一 key 读出来再写回去，`|| genName` 的回退分支永远不可能触发。已直接删除。

### 修复 2：统一 wave 组内 keyframe 命名策略
**文件**：[loadingAnimationCore.js](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/loading-animation/loadingAnimationCore.js#L524-L603)

**问题**：原逻辑 `seen.size === 0 && idx === 0` 只保护了第一个名称，导致同一 wave 组的 5 个 bar 出现混合命名（`wave-0` 保留原名，`wave-1` 到 `wave-4` 变成 `wave-1-1` 到 `wave-4-4`）。

**修复方案**：引入组级别 `groupIndex` 计数器（`nextGroupIndex`），同一 wave 组的所有 bar 共享同一个 groupIndex：
- 第 0 组 wave：5 个 bar **全部保留原名**（`wave-0` ~ `wave-4`）
- 第 N 组 wave：5 个 bar **全部统一加 `-N` 后缀**（如 `wave-0-1` ~ `wave-4-1`）

组内命名完全一致，CSS 可读性显著提升。

### 修复 3：修正并补充单元测试
**文件**：[loadingAnimationCore.test.js](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/__tests__/loading-animation/loadingAnimationCore.test.js#L578-L620)

- 修正 `should generate unique wave keyframes for different wave configs` 测试的预期值
- 新增 `should use uniform naming within the same wave group (no mixed naming)` 测试，用正则分类验证第 0 组和第 1 组各有 5 个命名，且第 1 组的 5 个名称后缀完全一致

### 验证结果
- ✅ 100 个单元测试全部通过
- ✅ Lint 检查通过