toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\security-center\securityCenterCore.js
          
核心问题是：当前方案仍然把 JS 字符串转义（`\\`）和正则字符类转义（`\-`、`\[`）混叠在同一个引号字符串里。根本解决方案是：用单字符数组定义所有后缀字符（消除 JS 字符串转义），再用函数统一做正则转义（消除手动正则转义）。
        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\security-center\securityCenterCore.js
          
changes: undefined
          
运行测试验证：
        
            
toolName: run_command
            
status: success
          
command: cd "c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react" ; pnpm run test -- --reporter=verbose src/pages/__tests__/security-center 2>&1 undefined
          
182 个测试全部通过。再跑完整测试套件确认：
        
            
toolName: run_command
            
status: success
          
command: cd "c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react" ; pnpm run test 2>&1 | Select-Object -Last 8 undefined
          
全部 7806 个测试通过 ✅

---

## 修复详情

**修复文件**: [securityCenterCore.js](file:///C:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/security-center/securityCenterCore.js#L90-L104)

**核心改动**：将 `SUFFIX_CHARS` 的构造从"混合转义字符串拼接"改为"单字符数组 + 编程式正则转义"，彻底消除 JS 字符串转义与正则字符类转义混叠的问题。

**之前**（转义混叠）：
```js
const SUFFIX_CHARS = [
  '0-9', '!@#$%', '^&*()', '_+',
  '\\-',        // JS转义 + 正则转义混在一起
  '=', '\\[\\]',  // 同上
  '{}', '|;:', "'\"",
  ',.<>?/', '\\\\',  // 双重转义：JS层\\ → 字符串\ → 正则层匹配字面\
  '`~',
].join('')
```

**之后**（转义分离）：
```js
const SUFFIX_SPECIAL_CHARS = [
  '!', '@', '#', '$', '%', '^', '&', '*', '(', ')',
  '_', '+', '-', '=', '[', ']', '{', '}', '|', ';',
  ':', "'", '"', ',', '.', '<', '>', '?', '/', '`', '~', '\\',
]

function escapeForRegexCharClass(ch) {
  if (ch === '\\' || ch === ']' || ch === '-' || ch === '^') return '\\' + ch
  return ch
}

const SUFFIX_CHARS = '0-9' + SUFFIX_SPECIAL_CHARS.map(escapeForRegexCharClass).join('')
```

**改进要点**：

1. **`SUFFIX_SPECIAL_CHARS` 数组中每个元素是单字符字面量**，数组里只存在 JS 字符串层面的表示，不涉及任何正则转义。唯一需要 JS 层面转义的反斜杠 `'\\'` 单独占据一个元素，含义清晰——它就是字面反斜杠字符。

2. **正则转义由 `escapeForRegexCharClass` 函数统一处理**，逻辑集中在一处：在正则字符类 `[...]` 中，只有 `\`、`]`、`-`、`^` 四个字符需要加 `\` 前缀转义。这比在字符串字面量中手写 `\\-`、`\\[\\]`、`\\\\` 更不容易出错，也更容易审查。

3. **数字范围 `0-9` 保持简写**，因为它是正则字符类中广为人知的范围语法，不需要拆成单字符。