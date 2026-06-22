我理解了，测试名称和测试体验证的行为确实矛盾——测试名说"getNode 不应修改文件系统"，但测试体在验证的是"返回引用可修改原对象"。让我修复这个语义不一致的问题。

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\terminal-simulator\terminalCore.test.js
          

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\terminal-simulator\terminalCore.test.js
          
changes: undefined
          

        
            
toolName: run_command
            
status: success
          
command: cd c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react ; npx vitest run src/pages/__tests__/terminal-simulator/terminalCore.test.js 2>&1 undefined
          
已修复。88 个测试全部通过。

## 修复说明

**文件**：[terminalCore.test.js](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/__tests__/terminal-simulator/terminalCore.test.js#L150-L158)

**问题**：测试名 `should not mutate filesystem when accessing nodes`（getNode 不应修改文件系统），但测试体是在调用 getNode 后**主动修改**返回引用并断言原 fs 被改变——验证的是「返回引用可改变原对象」，与测试名称完全矛盾。

**修复**：改为真正验证「getNode 读取操作本身不会修改文件系统」——用 `JSON.stringify` 记录调用前快照，多次调用 getNode（包含目录、文件、不存在的路径）后再对比，确认调用前后文件系统内容完全一致。