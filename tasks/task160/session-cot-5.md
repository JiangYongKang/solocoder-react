toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\task-dag\taskDagCore.js
          

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\task-dag\taskDagCore.js
          
changes: undefined
          
现在更新对应的单元测试：
        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\task-dag\taskDagCore.test.js
          

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\task-dag\taskDagCore.test.js
          
changes: undefined
          

        
            
toolName: run_command
            
status: success
          
command: npx eslint src/pages/task-dag/ src/pages/__tests__/task-dag/ ; npm test -- src/pages/__tests__/task-dag/taskDagCore.test.js undefined
          
Lint 通过，69 个测试全部通过。

## 问题已修复

### 问题分析

`loadFromStorage` 函数在各异常分支中将 JavaScript 原生异常消息（如 `parseErr.message`）直接拼入了返回给 UI 层的 error 字符串，例如：

```
数据解析失败: Unexpected token o in JSON at position 1
读取本地存储失败: Quota exceeded
数据格式错误: 不是有效对象
```

这类底层技术错误信息对普通用户毫无帮助，还暴露了内部实现细节。

### 修复方案

将所有 error 信息替换为**用户友好的提示文案**，不再拼接原生异常消息：

| 错误场景 | 修复前 | 修复后 |
|---------|-------|-------|
| JSON 解析失败 | `数据解析失败: Unexpected token...` | `存储数据已损坏，已重置为空图` |
| 数据不是有效对象 | `数据格式错误: 不是有效对象` | `存储数据格式无效，已重置为空图` |
| 缺少 nodes/edges | `数据格式错误: 缺少 nodes 或 edges 数组` | `存储数据格式无效，已重置为空图` |
| localStorage 异常 | `读取本地存储失败: Quota exceeded` | `读取本地存储失败，已重置为空图` |

同时移除了 catch 子句中未使用的异常参数（如 `catch (parseErr)` → `catch`），避免 lint 警告。

### 修改文件

- [`taskDagCore.js`](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/task-dag/taskDagCore.js#L433-L455) — 重写 `loadFromStorage` 的错误信息
- [`taskDagCore.test.js`](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/__tests__/task-dag/taskDagCore.test.js#L658-L703) — 更新测试断言为精确匹配用户友好文案

### 验证结果

- ✅ ESLint：0 错误
- ✅ 单元测试：69 个测试全部通过