toolName: todo_write
            
status: success
          
Todos updated: 5 items
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\coverage-dashboard\utils.js
          

        
            
toolName: todo_write
            
status: success
          
Todos updated: 6 items
          
Now let me implement the fixes. I'll add a weighted average function and rewrite the directory coverage builder to use a single post-order traversal.




        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\coverage-dashboard\utils.js
          
changes: undefined
          

        
            
toolName: todo_write
            
status: success
          
Todos updated: 6 items
          
Now let me rewrite `buildDirectoryCoverage` to use a single post-order traversal, accumulating data from children without re-traversing:






        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\coverage-dashboard\utils.js
          
changes: undefined
          

        
            
toolName: todo_write
            
status: success
          
Todos updated: 6 items
          
Now let me update `calculateOverallCoverage` to also use the line-weighted average for consistency:







        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\coverage-dashboard\utils.js
          
changes: undefined
          
Now let me update the test file:

        
            
toolName: todo_write
            
status: success
          
Todos updated: 6 items
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\coverage-dashboard\utils.test.js
          

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\coverage-dashboard\utils.test.js
          
changes: undefined
          
Now let me find and update the existing `buildDirectoryCoverage` tests and add new ones for the weighted average:


        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\coverage-dashboard\utils.test.js
          
Now I need to update the tests to account for line-count weighting. The first test needs line data for each file, and I need to add a new test for `calculateWeightedAverageCoverage`. Let me also update the existing `buildDirectoryCoverage` tests:






        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\coverage-dashboard\utils.test.js
          
changes: undefined
          
Now I also need to update the `calculateOverallCoverage` tests since it now uses weighted average. Let me check:





        
            
toolName: search_by_regex
            
status: success
          
query: calculateOverallCoverage
          
The `calculateOverallCoverage` test uses files without `lines` data, so they'll have weight 0 now. Let me fix those tests to include line data:







        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\coverage-dashboard\utils.test.js
          
changes: undefined
          
Now let me run the tests:





        
            
toolName: todo_write
            
status: success
          
Todos updated: 6 items
          

        
            
toolName: run_command
            
status: success
          
command: npm run test -- src/pages/__tests__/coverage-dashboard/utils.test.js undefined
          
All 84 tests pass. Let me also run the linter:







        
            
toolName: run_command
            
status: success
          
command: npx eslint src/pages/coverage-dashboard/utils.js src/pages/__tests__/coverage-dashboard/utils.test.js src/pages/coverage-dashboard/index.jsx undefined
          

        
            
toolName: todo_write
            
status: success
          
Todos updated: 6 items
          
两个问题均已修复完成：

---

## 问题 1：按代码行数加权平均

**新增函数**：[calculateWeightedAverageCoverage](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/coverage-dashboard/utils.js#L62-L93)

按每个文件的实际代码行数作为权重计算加权平均值：
```
加权平均 = Σ(覆盖率ᵢ × 行数ᵢ) / Σ(行数ᵢ)
```

**修复前（简单算术平均）**：
- 1000行 @ 0% + 1行 @ 100% = (0 + 100) / 2 = **50%** ❌

**修复后（行数加权平均）**：
- 1000行 @ 0% + 1行 @ 100% = (1000×0 + 1×100) / 1001 ≈ **0.1%** ✅

---

## 问题 2：消除重复遍历（O(n²) → O(n)）

**重写函数**：[buildDirectoryCoverage](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/coverage-dashboard/utils.js#L111-L175)

**修复前**：每个目录节点都调用 `flattenFileTree(node)` 重新遍历整个子树收集文件 → 深度嵌套时同一文件被反复访问，时间复杂度 **O(n²)**。

**修复后**：使用单次后序遍历（post-order DFS），每个文件仅被访问一次：
- 文件节点返回自身 + 累积数据（`fileCount`、`totalLines`、`weightedItems`）
- 目录节点直接汇总子节点返回的累积数据，无需再次遍历
- 时间复杂度降为 **O(n)**

---

## 同步更新

- [calculateOverallCoverage](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/coverage-dashboard/utils.js#L240-L253)：改为使用行数加权平均，与目录聚合逻辑保持一致

---

## 验证结果

- ✅ **84 个单元测试全部通过**（从 73 个增至 84 个，新增 11 个加权平均相关测试）
- ✅ ESLint 检查无错误
- ✅ 新增测试覆盖：行数权重主导、大文件+小文件极端场景、深层嵌套结构验证、零权重边界情况