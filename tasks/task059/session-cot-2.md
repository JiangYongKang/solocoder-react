我来修复这三个问题。首先查看相关代码。
        
            
toolName: view_files
            
status: success
          
            
filePath: /Users/vincent/GoletaLab/solocoder-react/src/pages/comment-review/index.jsx
          
现在修复这两个问题。首先修复 `index.jsx` 中的硬编码 `20`，然后修复测试文件的笔误。

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: /Users/vincent/GoletaLab/solocoder-react/src/pages/comment-review/index.jsx
          
changes: undefined
          

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: /Users/vincent/GoletaLab/solocoder-react/src/pages/comment-review/index.jsx
          
changes: undefined
          
现在修复测试文件的笔误：


        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: /Users/vincent/GoletaLab/solocoder-react/src/pages/__tests__/comment-review/utils.test.js
          
changes: undefined
          
现在运行测试确认所有测试通过：




        
            
toolName: run_command
            
status: success
          
command: cd /Users/vincent/GoletaLab/solocoder-react && pnpm test -- src/pages/__tests__/comment-review/utils.test.js --reporter=verbose 2>&1 | tail -30 undefined
          
失败的测试都在其他模块（pivot-table 和 sticky-wall），与评论审核系统无关。让我单独运行评论审核的测试：





        
            
toolName: run_command
            
status: success
          
command: cd /Users/vincent/GoletaLab/solocoder-react && pnpm vitest run src/pages/__tests__/comment-review/utils.test.js --reporter=verbose 2>&1 | tail -30 undefined
          
所有评论审核系统的 83 个单元测试全部通过。修复完成！

## ✅ 修复内容

### 1. 全选逻辑使用 PAGE_SIZE 常量
- 文件：[index.jsx](file:///Users/vincent/GoletaLab/solocoder-react/src/pages/comment-review/index.jsx#L9-L9)
- 修改了 import，引入 `PAGE_SIZE` 常量
- 在 [handleSelectAll](file:///Users/vincent/GoletaLab/solocoder-react/src/pages/comment-review/index.jsx#L129-L139) 函数中，将硬编码的 `20` 替换为 `PAGE_SIZE` 常量，确保分页与全选范围始终一致

### 2. 测试描述笔误修复
- 文件：[utils.test.js](file:///Users/vincent/GoletaLab/solocoder-react/src/pages/__tests__/comment-review/utils.test.js#L639-L639)
- 将 `"fails when word exists (case insensitive"` 修复为 `"fails when word exists (case insensitive)"`，补上缺失的右括号

### 3. 测试验证结果
- ✅ **评论审核系统 83 个单元测试全部通过**
- 其他模块（pivot-table、sticky-wall）的失败测试与本次修复无关，属于项目中已存在的问题