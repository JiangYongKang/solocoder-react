让我先读取当前的 computeDiff 实现和测试，理解算法行为后添加测试：





























        
            
toolName: todo_write
            
status: success
          
Todos updated: 3 items
          
让我先读取相关代码：































        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\regex-tester\regexUtils.js
          
让我先写一个简单的脚本来验证一些多路径 LCS 场景下算法的具体输出，这样我就能写出精确的测试期望值：
































        
            
toolName: Write
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\temp_diff_check.js
          
changes: undefined
          
运行脚本查看多路径 LCS 场景下的算法行为：
































        
            
toolName: run_command
            
status: success
          
command: node temp_diff_check.js undefined
          
现在我清楚了算法行为！让我删除临时文件并添加针对多路径 LCS 场景的测试：



































        
            
toolName: delete_file
            
status: success
          
deleteFilesSingular
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\temp_diff_check.js
          

        
            
toolName: todo_write
            
status: success
          
Todos updated: 3 items
          
现在让我读取测试文件找到 computeDiff 测试的位置，然后添加多路径 LCS 场景的测试：



































        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\regex-tester\regexUtils.test.js
          
现在让我在 computeDiff 测试块末尾添加多路径 LCS 场景的测试：
































        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\regex-tester\regexUtils.test.js
          
changes: undefined
          
现在运行测试：


































        
            
toolName: todo_write
            
status: success
          
Todos updated: 3 items
          

        
            
toolName: run_command
            
status: success
          
command: pnpm run test undefined
          
`git-browser` 的 4 个测试失败是项目其他模块的原有问题，与我们的正则测试器无关。让我单独运行我们的测试确认全部通过：

































        
            
toolName: run_command
            
status: success
          
command: npm test -- src/pages/__tests__/regex-tester/ undefined
          
我们的正则测试器所有 135 个测试全部通过 ✅。`git-browser` 的 4 个失败测试是项目其他模块的原有问题，与本次修改无关。

让我完成任务：



































        
            
toolName: todo_write
            
status: success
          
Todos updated: 3 items
          
所有任务完成！✅

---

## 修复内容总结

### 问题分析
`computeDiff` 的 LCS 回溯算法中，当 `dp[i+1][j] >= dp[i][j+1]` 时优先选择删除。当 DP 表中存在多个等长的最优 LCS 路径时，这种策略选择决定了 diff 的具体操作顺序，但之前的测试没有锁定这些边界场景的具体输出。

### 新增测试
在 [regexUtils.test.js#L815-L903](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/__tests__/regex-tester/regexUtils.test.js#L815-L903) 新增了 `多路径 LCS 场景（锁定操作顺序）` 测试组，共 **9 个测试用例**：

| 测试场景 | 期望值（锁定输出） |
|---|---|
| `'ab' → 'ba'` | `[delete('a'), equal('b'), insert('a')]` |
| `'xy' → 'yx'` | `[delete('x'), equal('y'), insert('x')]` |
| `'12' → '21'` | `[delete('1'), equal('2'), insert('1')]` |
| `'abc' → 'cba'` | `[delete('ab'), equal('c'), insert('ba')]` |
| `'acb' → 'bca'` | `[delete('ac'), equal('b'), insert('ca')]` |
| `'aab' → 'aba'` | `[equal('a'), delete('a'), equal('b'), insert('a')]` |
| `'abba' → 'baab'` | `[delete('a'), equal('b'), delete('b'), equal('a'), insert('ab')]` |
| `'kitten' → 'sitting'` | `[delete('k'), insert('s'), equal('itt'), delete('e'), insert('i'), equal('n'), insert('g')]` |
| 稳定性测试 | 3 次调用 `computeDiff('ab', 'ba')` 结果完全相同，首操作必为 delete |

### 测试结果
```
Test Files  2 passed (2)
     Tests  135 passed (135)
```

所有 135 个正则测试器单元测试全部通过。项目其他模块（git-browser）的 4 个失败测试与本次修改无关，属于原有问题。