让我先创建任务列表，然后逐一修复这些问题。



        
            
toolName: todo_write
            
status: success
          
Todos updated: 4 items
          
让我先查看当前的 `gitUtils.js` 中的相关实现：









        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\git-browser\gitUtils.js
          
好的，现在我需要修复两个问题：
1. 替换硬编码注释为自然代码行
2. 改进标识符替换逻辑，避免匹配字符串和 import 路径

让我重写 `applyLineTransformations` 及相关辅助函数：





        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\git-browser\gitUtils.js
          
changes: undefined
          
好的，现在让我更新任务进度并更新测试来覆盖新逻辑：












        
            
toolName: todo_write
            
status: success
          
Todos updated: 4 items
          
现在让我查看并更新测试文件，添加对新逻辑的测试：

















        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\git-browser\gitUtils.test.js
          
现在让我在测试文件末尾追加对新逻辑的测试：


















        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\git-browser\gitUtils.test.js
          
changes: undefined
          
我发现测试中使用了 `applyLineTransformations.__testApply`，但这个函数是内部未导出的。让我同时去掉 `buildNaturalCodeLine` 中的空行选项，并修改测试通过已导出函数间接测试：

















        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\git-browser\gitUtils.js
          
changes: undefined
          
现在修改测试，使用已导出的 `transformContentForCommit` 和 `generateOriginalContent` 来间接测试：




















        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\git-browser\gitUtils.test.js
          
changes: undefined
          
现在让我更新任务进度并运行测试：



















        
            
toolName: todo_write
            
status: success
          
Todos updated: 4 items
          

        
            
toolName: run_command
            
status: success
          
command: pnpm exec vitest run src/pages/__tests__/git-browser/ undefined
          
我发现了几个问题：
1. `const`、`function`、`return` 等 JavaScript 关键字被错误替换了
2. original 模式删除行时把包含测试断言的行删掉了

让我修复 `replaceIdentifierInCode`，排除 JavaScript 关键字，并改进行删除逻辑：


















        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\git-browser\gitUtils.js
          
changes: undefined
          
现在更新删除逻辑，使用 `isSafeLineForDeletion` 来避免删除包含关键字/字符串的行：





















        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\git-browser\gitUtils.js
          
changes: undefined
          
现在重新运行测试：

























        
            
toolName: run_command
            
status: success
          
command: pnpm exec vitest run src/pages/__tests__/git-browser/ undefined
          
很好！109 个通过，1 个失败。问题是包含行尾注释的行也被删除了。让我修改 `isSafeLineForDeletion` 排除包含注释的行：</think_never_used_51bce0c785ca2f68081bfa7d91973934>只差一个测试！让我修复 `isSafeLineForDeletion`，避免删除包含注释的行：


















        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\git-browser\gitUtils.js
          
changes: undefined
          
现在重新运行测试：




























        
            
toolName: run_command
            
status: success
          
command: pnpm exec vitest run src/pages/__tests__/git-browser/ undefined
          
太棒了！所有 110 个测试全部通过。让我再运行 lint 检查确保代码规范：





























        
            
toolName: run_command
            
status: success
          
command: pnpm exec eslint src/pages/git-browser/ src/pages/__tests__/git-browser/ undefined
          
完美！测试和 Lint 全部通过。让我标记任务完成：



























        
            
toolName: todo_write
            
status: success
          
Todos updated: 4 items
          
所有修复已完成！以下是本轮修复的详细内容：

## 修复总结

### 1. ✅ 移除硬编码注释占位，改用自然代码行
在 [gitUtils.js](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/git-browser/gitUtils.js#L351-L374) 中重构 `buildNaturalCodeLine`：
- 移除了 `"// TODO: handle edge case"`、`"/* istanbul ignore next */"`、`"logger.debug(...)"` 等与语义无关的注释占位
- 改用 **17 条真实自然的代码行**，涵盖：
  - 变量声明：`const normalizedInput = input?.toString().trim() ?? ''`
  - 条件判断：`if (!data || Object.keys(data).length === 0) {` / `return []` / `}`
  - 异步调用：`const result = await fetchData({ limit: 100, offset: 0 })`
  - 数组方法：`filter/map/reduce/sort`
  - try/catch 块：完整的 `try { ... } catch (err) { ... }`
  - return 语句、对象合并、权限判断等

### 2. ✅ 标识符替换正则改进，避免误替换
完全重写标识符替换逻辑，在 [gitUtils.js](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/git-browser/gitUtils.js#L247-L349) 中实现：

- **`JS_KEYWORDS` 集合**：收录 40+ JavaScript 关键字（`const`、`let`、`function`、`return`、`import`、`export`、`if`、`for`、`async`、`await` 等），避免被错误替换
- **`replaceIdentifierInCode` 逐字符状态机**：跟踪四种作用域状态：
  - `inSingleQuote` / `inDoubleQuote` / `inBacktick`：字符串字面量内的字符原封不动保留
  - `inLineComment`：行尾注释内的内容不处理
  - 仅在代码区域且非关键字时才应用标识符变换
- **`isSafeLineForReplacement`**：排除 `import/export/require` 行、纯注释行、`console.` 调用行

### 3. ✅ 行删除逻辑改进
新增 `isSafeLineForDeletion` 并改进删除算法：
- 排除包含 `//`、`/*`、`*/` 的注释行
- 排除 `import/export/function/class/return/console.` 行
- 排除包含任何 `'"`` 字符串引号的行
- 删除按索引倒序执行，避免索引错位

### 4. ✅ 测试覆盖
测试从 104 个增至 **110 个全部通过**，新增覆盖：
- 30 个 seed × 验证不包含 TODO/istanbul/logger 等注释
- import 路径内单词保护（`"./Header"`、`"react"` 保持不变）
- 单双引号字符串字面量保护
- 自然代码比例断言（注释行 ≤ 15%）
- 行尾注释内容保护
- 模板字符串（反引号）内容保护

### 最终验证
- **Tests：110 passed**（2 个测试文件）
- **Lint：0 errors, 0 warnings**