toolName: todo_write
            
status: success
          
Todos updated: 4 items
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\tts-config\index.jsx
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\tts-config\index.jsx
          
我先在 `ttsConfigCore.js` 中新增 `normalizeHistoryRecord` 纯函数，将历史记录参数规范化并使用默认常量：

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\tts-config\ttsConfigCore.js
          

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\tts-config\ttsConfigCore.js
          
changes: undefined
          

        
            
toolName: todo_write
            
status: success
          
Todos updated: 4 items
          
现在在 `index.jsx` 中使用 `normalizeHistoryRecord` 函数替换硬编码默认值：


        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\tts-config\index.jsx
          
changes: undefined
          
现在替换 `handleHistoryClick` 的实现：


        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\tts-config\index.jsx
          
changes: undefined
          
现在检查是否还需要 `DEFAULT_VOICE_ID` 导入，以及是否有未使用的导入：



        
            
toolName: search_by_regex
            
status: success
          
query: DEFAULT_VOICE_ID
          
`DEFAULT_VOICE_ID` 现在在组件中不再使用，需要从导入中移除：




        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\tts-config\index.jsx
          
changes: undefined
          

        
            
toolName: todo_write
            
status: success
          
Todos updated: 4 items
          
现在为 `normalizeHistoryRecord` 补充单元测试。先读取测试文件末尾：





        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\tts-config\ttsConfigCore.test.js
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\tts-config\ttsConfigCore.test.js
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\tts-config\ttsConfigCore.test.js
          
现在添加 `normalizeHistoryRecord` 的导入和测试：





        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\tts-config\ttsConfigCore.test.js
          
changes: undefined
          

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\tts-config\ttsConfigCore.test.js
          
changes: undefined
          

        
            
toolName: todo_write
            
status: success
          
Todos updated: 4 items
          
运行测试、lint 和构建：




        
            
toolName: run_command
            
status: success
          
command: cd c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react; npx vitest --run src/pages/__tests__/tts-config/ undefined
          
全部 107 个测试通过。现在运行 ESLint 和构建：




        
            
toolName: run_command
            
status: success
          
command: cd c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react; npx eslint src/pages/tts-config/ undefined
          
ESLint 通过！运行构建：






        
            
toolName: run_command
            
status: success
          
command: cd c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react; npx vite build undefined
          
构建成功！


        
            
toolName: todo_write
            
status: success
          
Todos updated: 4 items
          
全部完成。以下是修复总结：

## 修复内容

### 1. 消除硬编码默认值，统一使用模块常量

**问题**：`handleHistoryClick` 中语速、音调、音量的缺省回退使用了 `1.0`、`0`、`80` 三个硬编码数字，而音色使用了 `DEFAULT_VOICE_ID` 常量。

**修复**：
- 在 [ttsConfigCore.js#L230-L247](file:///C:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/tts-config/ttsConfigCore.js#L230-L247) 新增纯 JS 函数 `normalizeHistoryRecord(record)`，将历史记录参数规范化，5 个字段的缺省回退均使用对应的模块常量（`DEFAULT_VOICE_ID`、`DEFAULT_SPEED`、`DEFAULT_PITCH`、`DEFAULT_VOLUME`）
- [index.jsx#L376-L384](file:///C:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/tts-config/index.jsx#L376-L384) 中的 `handleHistoryClick` 改为调用 `normalizeHistoryRecord`，不再出现任何硬编码数字，同时移除了不再需要的 `DEFAULT_VOICE_ID` 导入

### 2. 新增单元测试（9 个用例）

在 [ttsConfigCore.test.js#L628-L719](file:///C:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/__tests__/tts-config/ttsConfigCore.test.js#L628-L719) 中为 `normalizeHistoryRecord` 添加了完整覆盖：

| 测试用例 | 覆盖场景 |
|---|---|
| `null` 输入 | 返回全部默认值 |
| `undefined` 输入 | 返回全部默认值 |
| 非对象输入（字符串/数字/数组）| 返回全部默认值 |
| 完整合法记录 | 保留所有原始值 |
| 空对象 `{}` | 所有字段使用默认 |
| 所有字段类型错误 | 每个字段独立回退默认 |
| 部分有效 + 部分无效混合 | 合法字段保留、非法字段回退 |
| `pitch=0, volume=0` | 0 是合法值，不被误判为缺省 |
| `pitch=-5` | 接受负音调值 |

## 验证结果

- **测试**：98 → **107 全部通过** ✅
- **ESLint**：0 错误 0 警告 ✅
- **Vite 构建**：成功 ✅