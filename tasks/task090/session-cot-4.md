先查看当前代码的最新状态：
        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\security-center\securityCenterCore.js
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\security-center\constants.js
          

        
            
toolName: todo_write
            
status: success
          
Todos updated: 3 items
          
两个问题一起修复。核心改动：移除 `LETTERS_ONLY_REGEX` 限制，让所有弱密码条目统一支持后缀匹配；同时用清晰的数组拼接方式重构 `SUFFIX_CHARS`。
        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\security-center\securityCenterCore.js
          
changes: undefined
          

        
            
toolName: todo_write
            
status: success
          
Todos updated: 3 items
          
现在更新测试文件。需要调整的测试逻辑：
- `password12345` 现在会被 `password123`（在 WEAK_PASSWORDS 中）的后缀匹配捕获 → 改为 `true`
- 新增含数字弱密码条目的变体检测（如 `Trustno1!`、`Abc123!`）
        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\security-center\securityCenterCore.test.js
          
现在更新测试。关键变化：
- `password12345` 现在 `password123`（在列表中）+ `45`（2 字符后缀）会匹配 → 预期改为 `true`
- 需要新增含数字弱密码的变体测试
        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\security-center\securityCenterCore.test.js
          
changes: undefined
          
运行测试验证：
        
            
toolName: run_command
            
status: success
          
command: cd "c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react" ; pnpm run test -- --reporter=verbose src/pages/__tests__/security-center 2>&1 undefined
          
`qwerty123456` 被判定为 `true`，因为 `qwerty123`（在 WEAK_PASSWORDS 中）+ `456`（3 字符后缀）匹配成功。这实际上也是合理的——它确实是 `qwerty123` 的变体。我需要更新测试预期：
        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\security-center\securityCenterCore.test.js
          
changes: undefined
          

        
            
toolName: run_command
            
status: success
          
command: cd "c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react" ; pnpm run test -- --reporter=verbose src/pages/__tests__/security-center 2>&1 undefined
          
182 个安全中心测试全部通过。运行完整测试套件确认：
        
            
toolName: run_command
            
status: success
          
command: cd "c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react" ; pnpm run test 2>&1 | Select-Object -Last 8 undefined
          
全部 7802 个测试通过 ✅
        
            
toolName: todo_write
            
status: success
          
Todos updated: 3 items
          
3 个问题全部修复完成，全部 7802 个测试通过。

---

## 修复详情

### 问题 1：含数字弱密码条目的变体检测不一致

**修复文件**: [securityCenterCore.js](file:///C:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/security-center/securityCenterCore.js#L122-L131)

**根因**：之前的 `isCommonWeakPassword` 使用 `LETTERS_ONLY_REGEX.test(wp)` 过滤，只有纯字母词根（如 `password`、`admin`）才启用后缀匹配，导致含数字的弱密码条目（如 `trustno1`、`abc123`）只能完全匹配，无法检测 `Trustno1!` 这类常见变体。

**修复方式**：移除 `LETTERS_ONLY_REGEX` 过滤，让 **所有** 弱密码条目统一支持后缀匹配。匹配逻辑保持一致：

| 层级 | 规则 | 示例 |
|---|---|---|
| 1 | 完全匹配 | `password` → ✅ 弱 |
| 2 | 词根 + ≤4 位数字/符号后缀 | `trustno1!` → 匹配 `^trustno1[0-9!@#...]{0,4}$` → ✅ 弱 |
| 3 | 后缀只允许数字和符号（不含字母） | `passwordlessAuth` → 后缀含字母 → ❌ 非弱 |
| 4 | 后缀长度 ≤ 4 | `trustno1!@#$%` → 5 字符后缀 → ❌ 非弱 |

现在 `Trustno1!`（`trustno1` + `!`）和 `Password1!`（`password` + `1!`）都会被正确判定为弱密码，检测逻辑对所有条目完全一致。

### 问题 2：SUFFIX_CHARS 可读性差

**修复文件**: [securityCenterCore.js](file:///C:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/security-center/securityCenterCore.js#L93-L107)

**修复方式**：将原来的单行混合转义字符串：
```js
const SUFFIX_CHARS = '0-9!@#$%^&*()_+\\-=[\\]{}|;:\'",.<>?/\\\\`~'
```

改为按字符类别分组拼接的数组形式：
```js
const SUFFIX_CHARS = [
  '0-9',        // 数字范围
  '!@#$%',      // 常见符号组1
  '^&*()',      // 常见符号组2
  '_+',         // 下划线、加号
  '\\-',        // 连字符（正则字符类中需转义）
  '=',
  '\\[\\]',     // 方括号（正则字符类中需转义）
  '{}',
  '|;:',
  "'\"",
  ',.<>?/',
  '\\\\',       // 反斜杠（JS字符串转义一次，正则转义一次）
  '`~',
].join('')
```

每个需要转义的字符独立成组，转义目的一目了然：`\\-` 是为了在正则字符类中转义连字符，`\\[\\]` 是转义方括号，`\\\\` 是双重转义（JS 字符串层一次 + 正则层一次）匹配字面反斜杠。

### 问题 3：测试更新

**修复文件**: [securityCenterCore.test.js](file:///C:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/__tests__/security-center/securityCenterCore.test.js#L343-L363)

- 新增"含数字弱密码条目的变体也能被检测"测试组，覆盖 `Trustno1!`、`Abc123!`、`123456!`、`Qwerty123!`、`Letmein!` 等 9 个场景
- 调整超长后缀测试预期：`password12345` 和 `qwerty123456` 现在会分别被列表中更短的 `password123`/`qwerty123` 条目的后缀匹配捕获，因此预期从 `false` 改为 `true`（它们确实是弱密码变体）
- 保留 `admin@2024`（5 字符后缀）和 `trustno1!@#$%`（5 字符后缀）不被误判的测试