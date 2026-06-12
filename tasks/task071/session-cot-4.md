toolName: todo_write
            
status: success
          
Todos updated: 3 items
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\markdown-notes\noteUtils.js
          
现在我清楚了，需要把占位符还原移到所有格式替换（包括列表、表格、图片、链接、内部链接）之后。让我修复：

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\markdown-notes\noteUtils.js
          
changes: undefined
          
现在在内部链接替换之后、段落包裹之前添加占位符还原：


        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\markdown-notes\noteUtils.js
          
changes: undefined
          
现在补充测试用例，覆盖行内代码内的链接、图片、内部链接等语法：

        
            
toolName: todo_write
            
status: success
          
Todos updated: 3 items
          

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\markdown-notes\noteUtils.test.js
          
changes: undefined
          
现在运行测试：


        
            
toolName: todo_write
            
status: success
          
Todos updated: 3 items
          

        
            
toolName: run_command
            
status: success
          
command: pnpm test src/pages/__tests__/markdown-notes/noteUtils.test.js 2>&1 undefined
          
133 个测试全部通过。再运行全量测试确认：




        
            
toolName: run_command
            
status: success
          
command: pnpm test 2>&1 undefined
          

        
            
toolName: todo_write
            
status: success
          
Todos updated: 3 items
          
所有问题已修复，**6663 个测试全部通过**。以下是修复详情：

---

## 修复总结

### 1. 占位符还原位置后移 ✅

**文件**: [noteUtils.js](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/markdown-notes/noteUtils.js#L699-L704)

**问题根因**：占位符还原原位于第 621-623 行（粗体/斜体等格式正则之后，但在列表、表格、图片、链接、内部链接正则之前），导致行内代码中的链接/图片/内部链接语法仍会被后续正则穿透匹配。

**修复方案**：将占位符还原循环从粗体/斜体之后，移至**所有格式替换完成之后**（内部链接正则之后、段落包裹之前）。确保行内代码标签内容不被任何 Markdown 格式正则二次处理。

受保护的格式类型现覆盖全部 9 类：
- 标题（`#`、`##`、`###`）
- 粗体/斜体/粗斜体/删除线
- 有序列表 / 无序列表
- 表格
- 图片（`![alt](url)`）
- 外部链接（`[text](url)`）
- 内部链接（`[[笔记标题]]`）

### 2. 新增 6 个测试用例 ✅

**文件**: [noteUtils.test.js](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/__tests__/markdown-notes/noteUtils.test.js#L687-L723)

新增测试覆盖行内代码中的：
- **外部链接语法**：`` `[example](https://example.com)` `` 不应生成 `<a>` 标签
- **图片语法**：`` `![alt](image.png)` `` 不应生成 `<img>` 标签
- **内部链接语法**：`` `[[笔记1]]` `` 不应生成 `.internal-link` 链接
- **表格语法**：`` `| a | b |` `` 不应生成 `<table>` 标签
- **列表标记**：`` `- not a list` `` 不应生成 `<ul>/<li>` 标签
- **共存场景**：行内代码内的链接语法 + 代码外的真实链接共存

### 3. 测试结果 ✅

```
Test Files  90 passed (90)
     Tests  6663 passed (6663)
```

markdown-notes 模块测试从 127 个增至 **133 个**，全部通过。