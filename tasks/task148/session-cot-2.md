让我先查看相关代码确认问题：

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\terms-generator\index.jsx
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\terms-generator\utils.js
          

        
            
toolName: search_by_regex
            
status: success
          
query: confirmAddCustomTemplate
          
确认了问题。让我规划修复方案：


        
            
toolName: todo_write
            
status: success
          
Todos updated: 4 items
          
在 `utils.js` 中添加一个 `createCustomTemplate` 纯函数，用于生成完整的模板对象（含自动生成的 id）：





        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\terms-generator\utils.js
          

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\terms-generator\utils.js
          
changes: undefined
          

        
            
toolName: todo_write
            
status: success
          
Todos updated: 4 items
          
现在修复 `index.jsx` 中的 `confirmAddCustomTemplate` 函数，使用 `createCustomTemplate` 函数：







        
            
toolName: search_by_regex
            
status: success
          
query: import.*from.*utils
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\terms-generator\index.jsx
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\terms-generator\index.jsx
          

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\terms-generator\index.jsx
          
changes: undefined
          
现在修复 `confirmAddCustomTemplate` 函数：










        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\terms-generator\index.jsx
          
changes: undefined
          
让我也检查一下 `storage.js` 中的 `addCustomTemplate` 函数，避免重复生成 id：











        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\terms-generator\storage.js
          
我发现 `storage.js` 中的 `addCustomTemplate` 也会生成新 id，会覆盖传入的 id。让我改进一下：如果模板已有 id 就使用它，没有才生成：














        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\terms-generator\storage.js
          

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\terms-generator\storage.js
          
changes: undefined
          

        
            
toolName: todo_write
            
status: success
          
Todos updated: 4 items
          
现在补充单元测试。首先在 `utils.test.js` 中添加 `generateTemplateId` 和 `createCustomTemplate` 的测试：













        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\terms-generator\utils.test.js
          

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\terms-generator\utils.test.js
          
changes: undefined
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\terms-generator\utils.test.js
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\terms-generator\utils.test.js
          

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\terms-generator\utils.test.js
          
changes: undefined
          
现在再创建一个 `storage.test.js` 来测试 localStorage 持久化相关的纯函数：
















        
            
toolName: Write
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\terms-generator\storage.test.js
          
changes: undefined
          

        
            
toolName: todo_write
            
status: success
          
Todos updated: 4 items
          
运行所有测试验证：















        
            
toolName: run_command
            
status: success
          
command: npm test -- src/pages/__tests__/terms-generator/ 2>&1 undefined
          
所有 **112 个测试全部通过**！让我再跑一下 lint 检查确保代码质量：

















        
            
toolName: run_command
            
status: success
          
command: npx eslint src/pages/terms-generator/ src/pages/__tests__/terms-generator/ 2>&1 undefined
          
修复 lint 错误：

















        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\terms-generator\utils.test.js
          
changes: undefined
          

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\terms-generator\storage.test.js
          
changes: undefined
          

        
            
toolName: search_by_regex
            
status: success
          
query: r1
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\terms-generator\storage.test.js
          

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\terms-generator\storage.test.js
          
changes: undefined
          
再运行 lint 检查：




















        
            
toolName: run_command
            
status: success
          
command: npx eslint src/pages/terms-generator/ src/pages/__tests__/terms-generator/ 2>&1 undefined
          
Lint 检查零错误！最后再确认一次所有测试都通过：





















        
            
toolName: run_command
            
status: success
          
command: npm test -- src/pages/__tests__/terms-generator/ 2>&1 undefined
          

        
            
toolName: todo_write
            
status: success
          
Todos updated: 4 items
          
Bug 已修复完成。所有 **112 个单元测试全部通过**，ESLint 检查零错误。

## 修复内容

### 问题根因
`confirmAddCustomTemplate` 函数手动构造模板对象时遗漏了 `id` 字段，而 `validateTemplate` 校验函数要求模板必须有字符串类型的 `id`，导致校验永远失败，用户无法创建自定义模板。

### 修复方案

1. **新增 `generateTemplateId` 纯函数** — [utils.js#L351-L353](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/terms-generator/utils.js#L351-L353)
   - 生成格式为 `custom-{timestamp}-{random}` 的唯一 id

2. **新增 `createCustomTemplate` 纯函数** — [utils.js#L355-L365](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/terms-generator/utils.js#L355-L365)
   - 封装完整的自定义模板对象创建逻辑
   - 自动生成 id、设置 `isDefault: false`、`createdAt` 时间戳
   - 提供默认内容和变量数组
   - 创建出的对象可直接通过 `validateTemplate` 校验

3. **修复 `confirmAddCustomTemplate`** — [index.jsx#L333-L349](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/terms-generator/index.jsx#L333-L349)
   - 改为调用 `createCustomTemplate(name, desc)` 创建模板对象
   - 确保模板对象拥有完整字段后再进行校验

4. **改进 `addCustomTemplate`（storage 层）** — [storage.js#L115-L129](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/terms-generator/storage.js#L115-L129)
   - 若传入模板已有 `id` 则保留使用，没有才自动生成
   - 保持 `createdAt` 同理的处理逻辑

### 补充的单元测试

| 测试文件 | 用例数 | 覆盖内容 |
|---------|--------|---------|
| [utils.test.js](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/__tests__/terms-generator/utils.test.js) | 75（新增 12） | `generateTemplateId`、`createCustomTemplate`、模板校验联动 |
| [storage.test.js](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/__tests__/terms-generator/storage.test.js) | 37（新增） | 变量存取、版本增删改查、自定义模板增删、边界情况 |