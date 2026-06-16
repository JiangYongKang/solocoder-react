我来逐一修复这些问题。首先创建任务列表：




        
            
toolName: todo_write
            
status: success
          
Todos updated: 4 items
          
首先让我读取相关代码，找到 ResponseRuleDialog 和 sendBody 编辑区的位置：







        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\network-interceptor\index.jsx
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\network-interceptor\index.jsx
          
先找到 sendBody 编辑区的代码：









        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\network-interceptor\index.jsx
          
现在开始修改。首先更新 ResponseRuleDialog，使用 JsonEditorWithLineNumbers 并显示错误行号：










        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\network-interceptor\index.jsx
          
changes: undefined
          
现在更新 sendBody 编辑区。先修改 JsonEditorWithLineNumbers 组件，让它支持可选的 height 属性：











        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\network-interceptor\index.jsx
          
changes: undefined
          
现在更新 sendBody 编辑区：













        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\network-interceptor\index.jsx
          
changes: undefined
          
现在先检查一下哪些 CSS 类还在使用中，哪些已经没有被引用：











        
            
toolName: search_by_regex
            
status: success
          
query: ni-json-highlight|ni-send-body-textarea|ni-form-textarea|ni-json-editor
          
让我检查一下日志详情的高亮和 ImportDialog 的 textarea：











        
            
toolName: search_by_regex
            
status: success
          
query: ni-log-detail-body|ni-form-textarea
          
现在清理不再使用的 CSS 类。先看看 CSS 文件中这些类的位置：













        
            
toolName: search_by_regex
            
status: success
          
query: ^\.ni-json-editor$|^\.ni-json-highlight$|^\.ni-send-body-textarea|^\.ni-form-textarea
          
让我读取这些类的上下文，确定要删除的范围：















        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\network-interceptor\network-interceptor.css
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\network-interceptor\network-interceptor.css
          
让我也确认一下 `.ni-json-editor` 类的位置：











        
            
toolName: search_by_regex
            
status: success
          
query: \.ni-json-editor\b
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\network-interceptor\network-interceptor.css
          
好的，现在我来清理不再使用的 CSS 类：删除 `.ni-json-editor`、`.ni-json-highlight`、`.ni-send-body-textarea` 相关样式：















        
            
toolName: todo_write
            
status: success
          
Todos updated: 4 items
          
现在删除不再使用的 CSS 类：















        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\network-interceptor\network-interceptor.css
          
changes: undefined
          
现在删除 `.ni-json-highlight` 类：

















        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\network-interceptor\network-interceptor.css
          

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\network-interceptor\network-interceptor.css
          
changes: undefined
          
现在删除 `.ni-send-body-textarea` 相关类：



















        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\network-interceptor\network-interceptor.css
          

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\network-interceptor\network-interceptor.css
          
changes: undefined
          
现在更新 todo，然后补充 `sortRulesByPriority` 的单元测试：

















        
            
toolName: todo_write
            
status: success
          
Todos updated: 4 items
          
让我找到现有的 `sortRulesByPriority` 测试用例，然后补充更完善的测试：


















        
            
toolName: search_by_regex
            
status: success
          
query: describe\('sortRulesByPriority'
          
现在补充更完善的 `sortRulesByPriority` 测试用例：





















        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\network-interceptor\networkInterceptorUtils.test.js
          
changes: undefined
          
现在运行测试，确保所有测试通过：























        
            
toolName: todo_write
            
status: success
          
Todos updated: 4 items
          

        
            
toolName: run_command
            
status: success
          
command: cd "c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react" ; pnpm test -- src/pages/__tests__/network-interceptor/ ; pnpm eslint src/pages/network-interceptor/ src/pages/__tests__/network-interceptor/ undefined
          
测试失败是 `funnel-analysis` 的测试，与我们修改的 `network-interceptor` 无关。让我只运行 `network-interceptor` 的测试和 lint：


























        
            
toolName: run_command
            
status: success
          
command: cd "c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react" ; pnpm test -- src/pages/__tests__/network-interceptor/ --run ; pnpm eslint src/pages/network-interceptor/ src/pages/__tests__/network-interceptor/ undefined
          
让我分开运行测试和 lint：


























        
            
toolName: run_command
            
status: success
          
command: cd "c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react" ; pnpm test -- src/pages/__tests__/network-interceptor/ undefined
          
测试失败了。问题是当部分规则有 priority 部分没有时，排序逻辑没有处理好。让我修改 `sortRulesByPriority` 函数，让有 priority 的排在没有的前面：



























        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\network-interceptor\networkInterceptorUtils.js
          
changes: undefined
          
现在再次运行测试：



























        
            
toolName: run_command
            
status: success
          
command: cd "c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react" ; pnpm test -- src/pages/__tests__/network-interceptor/ undefined
          
太好了！所有 103 个测试通过了。现在运行 lint 检查：





























        
            
toolName: run_command
            
status: success
          
command: cd "c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react" ; pnpm eslint src/pages/network-interceptor/ src/pages/__tests__/network-interceptor/ undefined
          
完美！所有检查都通过了。让我更新 todo 列表：





























        
            
toolName: todo_write
            
status: success
          
Todos updated: 4 items
          
所有问题修复完成！以下是本次修复的内容总结：

---

## 🔧 修复总结

### 问题 1：JSON 错误行号定位和高亮扩展到所有 JSON 编辑区
**修改文件**:
- [index.jsx](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/network-interceptor/index.jsx)
- [networkInterceptorUtils.js](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/network-interceptor/networkInterceptorUtils.js)
- [network-interceptor.css](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/network-interceptor/network-interceptor.css)

**修改内容**：

1. **增强 `getJsonErrorLine` 函数**：支持 `line N`（Firefox）和 `position N`（V8/Chrome）两种错误格式，对 position 格式会反推行号。

2. **扩展 `JsonEditorWithLineNumbers` 组件**：
   - 左侧行号栏：`minHeight` 属性支持设置最小高度
   - 显示行号（最少15行），行号栏随内容行数动态增长
   - 错误时三重提示：
     - 🔴 **行号红色背景高亮`（`.ni-json-line-number.is-error-line`）
     - 🔴 **编辑区红色背景条**（`.ni-json-error-highlight`）
     - 🔴 **工具栏错误消息**显示"JSON 错误（第 N 行）`

3. **统一三处 JSON 编辑区都使用 JsonEditorWithLineNumbers**：
   - ✅ Mock 数据编辑器 - 原始响应数据（左侧）
   - ✅ Mock 数据编辑器 - Mock 替换数据（右侧）
   - ✅ ResponseRuleDialog - Mock 响应体
   - ✅ sendBody - 请求体（POST/PUT）

---

### 问题 2：清理死代码 CSS 类
**修改文件**: [network-interceptor.css](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/network-interceptor/network-interceptor.css)

**删除的类**：

| 类名 | 状态 |
|------|------|
| `.ni-json-editor` | ✅ 已删除 |
| `.ni-json-highlight` | ✅ 已删除 |
| `.ni-send-body-textarea`（含 `:focus`、`:has-error`）| ✅ 已删除 |

**保留的类**（仍在使用）：
- `.ni-form-textarea` - 仍在 ImportDialog 中使用
- `.ni-json-key`, `.ni-json-string`, `.ni-json-number`, `.ni-json-boolean`, `.ni-json-null` - 仍由 `highlightJson` 函数生成
- `.ni-json-textarea` 基础样式 - 仍在使用

---

### 问题 3：完善 `sortRulesByPriority` 排序逻辑和测试

**修改文件**:
- [networkInterceptorUtils.js](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/network-interceptor/networkInterceptorUtils.js#L137-L156)
- [networkInterceptorUtils.test.js](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/__tests__/network-interceptor/networkInterceptorUtils.test.js#L247-L344)

**完善的排序逻辑**（按优先级从高到低）：

1. **启用状态**：`enabled: true` 排在 `enabled: false` 之前
2. **priority 数值**：数值越小越靠前
3. **有 priority 的排在没有的前面
4. **稳定排序**：同等条件保持原相对顺序

**新增的测试用例**（从 3 个增加到 9 个）：

| 测试用例 | 验证内容 |
|---------|----------|
| 返回规则数组的副本 | 不修改原数组 |
| 空输入返回空数组 | 边界条件 |
| 启用的规则排在禁用规则前面 | enabled 优先 |
| 按 priority 数值从小到大排序 | priority 排序 |
| 优先按 enabled 排序，同组内按 priority | 组合排序 |
| 没有 priority 字段保持相对顺序 | 稳定排序 |
| 部分有 priority 部分没有时，有 priority 的在前 | 缺失值处理 |
| 不修改原数组 | 纯函数特性 |

---

### 问题 4：验证结果 ✅

```
Test Files  1 passed (1)
Tests       103 passed (103)
ESLint      0 errors
```

测试数量从原来的 97 个增加到 **103 个（新增 6 个 sortRulesByPriority 测试）。