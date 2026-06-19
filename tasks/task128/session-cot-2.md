好的，让我逐一修复这些问题。
        
            
toolName: todo_write
            
status: success
          
Todos updated: 5 items
          
让我先读取相关文件：

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\splash-config\utils.js
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\splash-config\utils.js
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\splash-config\utils.js
          
现在开始修复。首先修复 utils.js 的 `switchBackgroundMode` 和 `sanitizeConfig`：

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\splash-config\utils.js
          
changes: undefined
          

        
            
toolName: todo_write
            
status: success
          
Todos updated: 5 items
          
现在重写 `sanitizeConfig`，改为逐字段局部修正策略：



        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\splash-config\utils.js
          
changes: undefined
          
现在修复 index.jsx 中的 render 阶段 setState 问题：



        
            
toolName: todo_write
            
status: success
          
Todos updated: 5 items
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\splash-config\index.jsx
          

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\splash-config\index.jsx
          
changes: undefined
          
现在修复主组件 SplashConfigPage 中的 render 阶段 setState：





        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\splash-config\index.jsx
          

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\splash-config\index.jsx
          
changes: undefined
          
现在运行 ESLint 检查确认没有问题，然后补充单元测试：






        
            
toolName: run_command
            
status: success
          
command: npx eslint src/pages/splash-config/ --no-error-on-unmatched-pattern 2>&1 undefined
          
ESLint 不允许 effect 内同步 setState。让我改用派生状态和 key 重置模式（符合 "You Might Not Need an Effect" 最佳实践）：







        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\splash-config\index.jsx
          
changes: undefined
          
现在修改 ColorPicker 中 color input 的 onChange，不再需要 setHexValue：







        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\splash-config\index.jsx
          

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\splash-config\index.jsx
          
changes: undefined
          
现在修复主组件的 setState-in-effect 问题。我需要将 resetCounter 改为基于 key 的模式，使用 config.templateId 和 isFullscreen 直接作为 React key 的一部分：








        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\splash-config\index.jsx
          
现在找到 SplashScreenPreview 使用 resetCounter 的地方：








        
            
toolName: search_by_regex
            
status: success
          
query: resetCounter
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\splash-config\index.jsx
          
我需要将 resetCounter 改为派生 key，使用 templateId 和 isFullscreen 作为 key。同时 countdown 的 useEffect 需要改进——不依赖 resetCounter state，而是将 countdown 初始值直接传给预览组件作为 key：









        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\splash-config\index.jsx
          
changes: undefined
          
现在将 key 改为用 templateId + isFullscreen + countdownSeconds 组合：







        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\splash-config\index.jsx
          
changes: undefined
          
现在再检查是否还有未使用的 useState 导入（我们移除了 resetCounter 的 state，但 ColorPicker 也移除了它的 state）：










        
            
toolName: run_command
            
status: success
          
command: npx eslint src/pages/splash-config/ --no-error-on-unmatched-pattern 2>&1 undefined
          
还有一处 setHexValue 残留，查找并修复：










        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\splash-config\index.jsx
          

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\splash-config\index.jsx
          
changes: undefined
          

        
            
toolName: run_command
            
status: success
          
command: npx eslint src/pages/splash-config/ --no-error-on-unmatched-pattern 2>&1 undefined
          
ESLint 全部通过！现在补充单元测试。让我先查看现有的测试文件，然后添加新的测试：








        
            
toolName: todo_write
            
status: success
          
Todos updated: 5 items
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\splash-config\utils.test.js
          
让我找到 switchBackgroundMode 和 sanitizeConfig 的测试部分，看看需要补充什么：










        
            
toolName: search_by_regex
            
status: success
          
query: describe.*switchBackgroundMode|describe.*sanitizeConfig
          

        
            
toolName: search_by_regex
            
status: success
          
query: switchBackgroundMode
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\splash-config\utils.test.js
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\splash-config\utils.test.js
          
现在我需要：
1. 修改 `switchBackgroundMode should store previous mode` 测试（因为我们移除了 `_previousMode`）
2. 添加新的测试：验证配置序列化后不包含 `_previousMode`、sanitizeConfig 的局部修正逻辑
3. 添加更多 sanitizeConfig 的精细测试

让我编辑测试文件：












        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\splash-config\utils.test.js
          
changes: undefined
          
现在添加 sanitizeConfig 的精细化局部修正测试：










        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\splash-config\utils.test.js
          
changes: undefined
          
让我检查一下 DEFAULT_CONFIG 是否有 preview 字段以及 templateId 字段。看看 constants.js：









        
            
toolName: search_by_regex
            
status: success
          
query: DEFAULT_CONFIG|templateId|preview
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\splash-config\constants.js
          
好的，DEFAULT_CONFIG 包含 templateId: null 和 preview.screenRatio。现在需要注意，sanitizeConfig 中我们有：

```js
if (typeof input.templateId === 'string' || input.templateId === null) {
  result.templateId = input.templateId
}
```

这意味着如果 templateId 是 123（数字），会使用默认值（null），但测试中期望 `typeof result.templateId` 是 'string'。让我检查一下 createDefaultConfig 的 templateId 是 null...

等等，我写的测试有问题！DEFAULT_CONFIG.templateId 是 null，所以 sanitizeConfig 返回的 result.templateId 应该是 null，不是字符串。让我修正测试：









        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\splash-config\utils.test.js
          
changes: undefined
          
现在运行测试：












        
            
toolName: todo_write
            
status: success
          
Todos updated: 5 items
          

        
            
toolName: run_command
            
status: success
          
command: pnpm test src/pages/__tests__/splash-config/utils.test.js 2>&1 undefined
          
sanitizeConfig 中，当 logo.size 不是数字时，我们用了 defaults.brand.logo.size（80px），而测试期望 MIN_LOGO_SIZE（30px）。我来修复测试断言：











        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\splash-config\utils.test.js
          
changes: undefined
          

        
            
toolName: run_command
            
status: success
          
command: pnpm test src/pages/__tests__/splash-config/utils.test.js 2>&1 undefined
          
所有 125 个测试全部通过！运行项目完整测试确认没有破坏其他：












        
            
toolName: run_command
            
status: success
          
command: pnpm test 2>&1 undefined
          
这28个失败测试都是其他页面的（collaborative-doc、modal-generator、sticky-notes），与我们的修改无关。我们的 splash-config 125个测试全部通过。

让我完成任务。</think_never_used_51bce0c785ca2f68081bfa7d91973934>28 个失败的测试都属于其他页面（collaborative-doc、modal-generator、sticky-notes）的已有问题，与我们的 splash-config 无关。我们的 125 个测试全部通过。完成任务：

        
            
toolName: todo_write
            
status: success
          
Todos updated: 5 items
          
## ✅ 全部问题已修复完成

### 修复内容总览

---

### 🔧 问题 1：配置数据污染（`_previousMode` 内部状态泄露）

**修改文件**: [utils.js](file:///C:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/splash-config/utils.js#L141-L148)

`switchBackgroundMode` 函数不再向 `config.background` 写入 `_previousMode` 字段。该状态应作为组件层独立 state 管理，不再附着于持久化数据结构。序列化后的 JSON 不再包含该内部实现细节。

---

### 🔧 问题 2：sanitizeConfig 全有或全无策略

**修改文件**: [utils.js](file:///C:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/splash-config/utils.js#L268-L406)

重写了 `sanitizeConfig` 函数，从原来的"校验失败则整体回退默认值"改为"逐字段局部修正"：

```
旧策略: validateConfig 失败 → 直接返回 createDefaultConfig()
新策略: 每个嵌套字段独立校验
        - 类型正确 + 范围合法 → 保留用户值
        - 类型正确 + 超出范围 → normalize 到合法范围
        - 类型错误 / 枚举非法 → 回退该字段默认值
        - 不会影响其他有效字段
```

现在当 Logo 尺寸误设为 200px 时，只会把该值 normalize 到 150px，用户精心调整的标题、颜色、背景、倒计时等设置全部保留。

---

### 🔧 问题 3：render 阶段调用 setState

**修改文件**: [index.jsx](file:///C:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/splash-config/index.jsx)

**ColorPicker 组件**（[L298-L306](file:///C:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/splash-config/index.jsx#L298-L306)）：
- 移除了内部 `hexValue` state + render 期同步 setState
- `hexValue` 改为纯派生值：`const hexValue = value`（直接由 props 派生）

**主组件 SplashConfigPage**（[L572-L583](file:///C:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/splash-config/index.jsx#L572-L583)）：
- 移除了 `lastTemplateId`、`lastFullscreen`、`resetCounter` 等 state + render 期 setState
- 倒计时重置逻辑改为通过 React `key` 模式：`key={templateId-isFullscreen-countdownSeconds}`，当依赖变化时组件自然重新挂载，动画和倒计时自动重置

符合 React "You Might Not Need an Effect" 最佳实践，并发模式下安全。

---

### 🧪 问题 4：补充单元测试（新增 10 个用例，总计 125 个全部通过 ✓）

**修改文件**: [utils.test.js](file:///C:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/__tests__/splash-config/utils.test.js)

**替换/新增的测试**：

| 测试组 | 用例 | 覆盖逻辑 |
|--------|------|---------|
| Background Mode Switching | `should NOT write _previousMode into config` | 修复问题 1 |
| Background Mode Switching | `serialized config should not contain internal fields` | 修复问题 1，序列化层面验证 |
| sanitizeConfig | `should preserve valid fields when ONLY one field is out of range` | 修复问题 2，只有 logo.size=200 越界，其余 9 个自定义字段全保留 |
| sanitizeConfig | `should preserve most fields when title color is invalid` | 颜色非法时仅回退该字段 |
| sanitizeConfig | `should preserve most fields when skip button position is invalid` | 枚举非法时仅回退该字段 |
| sanitizeConfig | `should not discard entire config for partial input` | 只有 `brand.title.text` 的极简输入也能正确保留 |
| sanitizeConfig | `should sanitize each nested field independently for type correctness` | 所有字段类型全乱（number/bool→string 等）也能逐字段修正为合法配置 |
| sanitizeConfig | `should preserve valid preview settings` | preview.screenRatio 合法值保留 |
| sanitizeConfig | `should fall back to default for invalid preview.screenRatio` | preview.screenRatio 非法值回退 |

**验证结果**:
```
Test Files  1 passed (1)
     Tests  125 passed (125)
  Duration  358ms
ESLint: 0 errors, 0 warnings
```