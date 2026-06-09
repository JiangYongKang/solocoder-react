我来修复这些问题。首先让我创建一个任务列表来跟踪这些修复工作：
        
            
toolName: todo_write
            
status: success
          
Todos updated: 6 items
          
让我先看看项目根目录的调试临时文件，然后逐一修复问题：

        
            
toolName: file_search
            
status: success
          
file_pattern: debug-*.mjs
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\qrcode\qrcodeDecoder.js
          
好的，我现在看到了 qrcodeDecoder.js 的完整代码。让我先检查项目根目录的调试文件，然后逐一修复问题：



        
            
toolName: view_folder
            
status: success
          
c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\qrcode\qrcodeEncoder.js
          
让我检查调试文件并查看 index.jsx 中是否有导入 applyMask 的地方，以便进行全面的重命名：





        
            
toolName: run_command
            
status: success
          
command: Get-ChildItem -Path "c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react" -Filter "debug-*" -File undefined
          

        
            
toolName: search_by_regex
            
status: success
          
query: applyMask
          
很好，我已经清楚了所有需要修复的问题。调试临时文件看起来已经不存在了。现在开始逐一修复：

首先重命名两个 applyMask 函数并修复所有问题。让我从 qrcodeEncoder.js 开始：






        
            
toolName: todo_write
            
status: success
          
Todos updated: 4 items
          
首先修复 qrcodeEncoder.js，将 applyMask 重命名为 applyDataMask：









        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\qrcode\qrcodeEncoder.js
          
changes: undefined
          
现在修复 qrcodeDecoder.js，需要做多处修改：
1. 导入 MASK_PATTERNS
2. 重命名 applyMask 为 unmaskGrid 并复用 MASK_PATTERNS
3. 修复 decodeData 接受 version 参数
4. 修复 decodeQRImage 中调用这些函数的地方












        
            
toolName: todo_write
            
status: success
          
Todos updated: 4 items
          
现在开始修改 qrcodeDecoder.js。首先修改导入语句，添加 MASK_PATTERNS：













        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\qrcode\qrcodeDecoder.js
          
changes: undefined
          
现在修复 applyMask 函数，重命名为 unmaskGrid 并复用 MASK_PATTERNS：
















        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\qrcode\qrcodeDecoder.js
          
changes: undefined
          
现在修复 decodeData 函数，让它接受 version 参数而不是硬编码：


















        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\qrcode\qrcodeDecoder.js
          
changes: undefined
          
现在修复 decodeQRImage 函数中对 unmaskGrid 和 decodeData 的调用：

















        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\qrcode\qrcodeDecoder.js
          
changes: undefined
          
好的，decoder 文件修复完成。现在更新任务状态并修复测试文件：



















        
            
toolName: todo_write
            
status: success
          
Todos updated: 4 items
          
现在修复 qrcodeDecoder.test.js，需要：
1. 更新导入（applyMask 改为 unmaskGrid，decodeData 需要传入 version）
2. 补充 Alphanumeric 模式的测试
3. 补充高版本 QR 码的测试
















        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\qrcode\qrcodeDecoder.test.js
          
现在修复并更新 qrcodeDecoder.test.js：


















        
            
toolName: Write
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\qrcode\qrcodeDecoder.test.js
          
changes: undefined
          
现在检查 qrcodeEncoder.test.js 是否需要更新（因为我们将 applyMask 重命名为 applyDataMask）：

















        
            
toolName: search_by_regex
            
status: success
          
query: applyMask
          
好的，测试文件中没有引用 applyMask。现在让我检查是否还有调试临时文件，然后运行测试：




















        
            
toolName: todo_write
            
status: success
          
Todos updated: 4 items
          
现在先运行 lint 检查，然后运行测试：



















        
            
toolName: run_command
            
status: success
          
command: cd c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react ; pnpm run lint undefined
          
让我先修复二维码相关文件的 lint 错误，然后再运行测试：


















        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\qrcode\constants.js
          
让我批量修复这些 lint 错误：




















        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\qrcode\constants.js
          
让我修复这些 lint 问题。先处理 constants.js 和读取其他有问题的文件：





















        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\qrcode\constants.js
          
changes: undefined
          
现在读取 qrcodeDecoder.js 的问题位置：

























        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\qrcode\qrcodeDecoder.js
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\qrcode\qrcodeDecoder.js
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\qrcode\qrcodeDecoder.js
          
现在修复 qrcodeDecoder.js 的 lint 错误：



























        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\qrcode\qrcodeDecoder.js
          
changes: undefined
          

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\qrcode\qrcodeDecoder.js
          
changes: undefined
          

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\qrcode\qrcodeDecoder.js
          
changes: undefined
          
现在修复 qrcodeEncoder.js 和 utils.js 的 lint 错误：


























        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\qrcode\qrcodeEncoder.js
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\qrcode\utils.js
          
让我查看更多内容：


























        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\qrcode\qrcodeEncoder.js
          
让我修复这两个问题：





























        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\qrcode\qrcodeEncoder.js
          
changes: undefined
          

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\qrcode\utils.js
          
changes: undefined
          
现在让我们运行测试，确保所有测试通过：


























        
            
toolName: run_command
            
status: success
          
command: cd c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react ; pnpm run test -- --run src/pages/__tests__/qrcode/ undefined
          

        
            
toolName: run_command
            
status: success
          
command: cd c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react ; pnpm run test src/pages/__tests__/qrcode/ undefined
          
`unmaskGrid` 没有被正确导出。让我检查 qrcodeDecoder.js 的导出情况：




























        
            
toolName: search_by_regex
            
status: success
          
query: ^export function
          
看来 `applyMask` 还没有被重命名为 `unmaskGrid`。让我查看并修复：




























        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\qrcode\qrcodeDecoder.js
          
我看到了！函数仍然是 `applyMask`，让我重命名它并检查所有调用：






























        
            
toolName: search_by_regex
            
status: success
          
query: applyMask
          
让我修复这个函数名和它的调用：




























        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\qrcode\qrcodeDecoder.js
          
changes: undefined
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\qrcode\qrcodeDecoder.js
          

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\qrcode\qrcodeDecoder.js
          
changes: undefined
          
现在让我检查 qrcodeEncoder.js 是否正确重命名了：




























        
            
toolName: search_by_regex
            
status: success
          
query: ^export function (applyMask|applyDataMask)
          
编码器函数已正确重命名。现在先调整测试文件中高版本QR码的测试文本长度（因为200个数字字符只需要版本5），然后重新运行测试：































        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\qrcode\qrcodeDecoder.test.js
          
changes: undefined
          
现在重新运行测试：































        
            
toolName: run_command
            
status: success
          
command: cd c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react ; pnpm run test src/pages/__tests__/qrcode/ undefined
          
所有二维码测试通过！现在运行完整测试套件，并检查项目根目录的临时文件：

































        
            
toolName: file_search
            
status: success
          
file_pattern: debug-*.mjs
          

        
            
toolName: file_search
            
status: success
          
file_pattern: debug-*.js
          

        
            
toolName: file_search
            
status: success
          
file_pattern: debug-*
          
没有找到调试临时文件，说明已经被清理过了。现在运行完整测试套件：




































        
            
toolName: run_command
            
status: success
          
command: cd c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react ; pnpm run test undefined
          
很好！除了一个与我们的二维码工作无关的 fitness-tracker 测试失败外，所有 3202 个测试都通过了。让我更新状态：

































        
            
toolName: todo_write
            
status: success
          
Todos updated: 4 items
          
所有 7 个问题都已成功修复！以下是修复总结：

### ✅ 修复内容

| # | 问题 | 修复方案 |
|---|------|----------|
| 1 | `decodeData` 硬编码 `version = 1` | 修改函数签名为 `decodeData(dataBytes, version)`，从 `decodeQRImage` 传入实际版本号 |
| 2 | 解码器重复定义遮罩模式数组 | 删除本地 patterns 数组，复用从 `constants.js` 导入的 `MASK_PATTERNS` |
| 3 | 两个 `applyMask` 同名冲突 | 编码器 → `applyDataMask`，解码器 → `unmaskGrid`，语义清晰区分 |
| 4 | 测试覆盖不足 | 新增 **Alphanumeric 模式**（5个用例）和 **高版本 QR 码 ≥ v10**（含版本边界 v9/v10）测试 |
| 5 | 调试临时文件 | 已清理（未发现残留） |
| 6 | 单元测试补充 | `src/pages/__tests__/qrcode/` 下 3 个测试文件共 **90 个测试用例** |
| 7 | 测试运行 | 所有二维码测试通过 ✅ |

### 📊 测试结果

```
Test Files:  3 passed (qrcode)
Tests:       90 passed (90)
Project:     3202 passed / 3203 total
```

唯一失败的测试来自 `fitness-tracker/chartUtils.test.js`，与二维码功能完全无关。