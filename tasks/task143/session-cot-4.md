toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\cloud-monitor\utils.test.js
          
问题很明确：两个测试都从函数输出中计算平均值，然后与函数输出进行比较——这是同义反复。修复方法是模拟 `randomInRange` 以消除随机抖动，这样我们就可以直接从**输入指标**（而非输出点）独立计算预期平均值。
        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\cloud-monitor\utils.test.js
          
changes: undefined
          
现在让我运行测试，以验证使用模拟随机数时，预期值是否确实正确：
        
            
toolName: run_command
            
status: success
          
command: cd c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react ; npx vitest run src/pages/__tests__/cloud-monitor/ undefined
          
103 个测试全部通过。现在让我来验证一下，如果 `all` 的聚合逻辑出现错误，测试是否真的能捕捉到。让我通过暂时修改函数使其出错来做一个快速健全性检查：
        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\cloud-monitor\utils.js
          

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\cloud-monitor\utils.js
          
changes: undefined
          

        
            
toolName: run_command
            
status: success
          
command: cd c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react ; npx vitest run src/pages/__tests__/cloud-monitor/ -t "all 数据点是各地域的平均值" undefined
          
测试正确地捕获了 bug：预期平均值约为 32，但错误代码（省略了 `/ count`）产生了 100（钳位总和）。现在让我恢复正确的代码：
        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\cloud-monitor\utils.js
          
changes: undefined
          

        
            
toolName: run_command
            
status: success
          
command: cd c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react ; npx vitest run src/pages/__tests__/cloud-monitor/ undefined
          
103 项测试通过，修复后的测试现在真正能独立验证聚合逻辑。

---

**问题根因**：原测试从函数输出中取出各地域 point 值重新算平均，再与 `all` 输出 point 比较——断言两端来自同一输出，无论聚合逻辑对错测试都会通过。

**修复方案**：在 [utils.test.js#L594-L623](file:///C:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/__tests__/cloud-monitor/utils.test.js#L594-L623) 中：

1. 使用 `vi.spyOn(Math, 'random').mockReturnValue(0.5)` 固定随机噪声，使 `buildTrendPoint` 的输出值与输入指标之间有确定性关系
2. 从**输入** `allMetrics` 中独立计算期望平均值：`expectedAvgCpu = (20+40+60+10+30)/5 = 32`，而非从输出 point 反算
3. 对 `cpu`、`memory`、`disk` 三个指标都做断言，覆盖完整
4. 测试结束调用 `vi.restoreAllMocks()` 清理

验证：故意将 `/count` 去掉使聚合逻辑出错后，测试正确报错（`expected 100 to be close to 32`），确认测试能独立捕获聚合逻辑缺陷。