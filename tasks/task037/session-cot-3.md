你说得对，我来修复这个问题，让测试使用统一的常量。

        
            
toolName: todo_write
            
status: success
          
Todos updated: 2 items
          
让我先读取测试文件中的导入部分和测试用例：



        
            
toolName: search_by_regex
            
status: success
          
query: from '@/pages/social-feed/constants'
          

        
            
toolName: search_by_regex
            
status: success
          
query: const MAX_DEPTH = 3
          
让我读取导入部分和第二个测试用例的完整内容：







        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\social-feed\utils.test.js
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\social-feed\utils.test.js
          
现在修复这三处：导入常量、替换硬编码的 3 和 2：









        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\social-feed\utils.test.js
          
changes: undefined
          

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\social-feed\utils.test.js
          
changes: undefined
          

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\social-feed\utils.test.js
          
changes: undefined
          
所有硬编码已替换为统一常量。现在运行测试验证：


















        
            
toolName: todo_write
            
status: success
          
Todos updated: 2 items
          

        
            
toolName: run_command
            
status: success
          
command: cd c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react ; pnpm test -- --reporter=verbose src/pages/__tests__/social-feed/utils.test.js undefined
          
所有 79 个测试全部通过！标记任务完成：





















        
            
toolName: todo_write
            
status: success
          
Todos updated: 2 items
          
修复完成！以下是本次改动总结：

## ✅ 修复内容

### [utils.test.js](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/__tests__/social-feed/utils.test.js)

**1. 导入统一常量**（第 37 行）
```js
import { MAX_COMMENT_DEPTH } from '@/pages/social-feed/constants'
```

**2. 移除硬编码，改用常量**
- 删除了测试函数内部的 `const MAX_DEPTH = 3`
- 将超限测试中的 `commentCount: MAX_DEPTH` 和 `buildNestedComments(MAX_DEPTH)` 改为使用 `MAX_COMMENT_DEPTH`
- 将边界测试中的 `commentCount: 2` 和 `buildNestedComments(2)` 改为使用 `MAX_COMMENT_DEPTH - 1`

这样将来如果修改 `MAX_COMMENT_DEPTH` 的值，测试会自动适配，不会因为硬编码而失准。

## 🧪 测试结果
- **79 passed**：所有单元测试全部通过