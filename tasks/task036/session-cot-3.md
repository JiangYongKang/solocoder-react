让我检查 qrcodeDecoder.js 是否存在别名导出：
        
            
toolName: search_by_regex
            
status: success
          
query: export
          
找到了！第 223 行确实有别名导出。让我删除它：

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\qrcode\qrcodeDecoder.js
          

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\qrcode\qrcodeDecoder.js
          
changes: undefined
          
现在让我检查整个代码库是否有任何地方仍在使用 `applyMask` 导入：

        
            
toolName: search_by_regex
            
status: success
          
query: applyMask
          
很好，没有任何地方再使用 `applyMask` 了。现在运行测试：


        
            
toolName: run_command
            
status: success
          
command: cd c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react ; pnpm run test src/pages/__tests__/qrcode/ undefined
          
所有二维码测试通过！再运行完整测试套件确认：



        
            
toolName: run_command
            
status: success
          
command: cd c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react ; pnpm run test undefined
          
全部修复完成！所有 3206 个测试都通过了 ✅

### 修复内容

**问题**：[qrcodeDecoder.js](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/qrcode/qrcodeDecoder.js#L223) 第 223 行保留了 `export { unmaskGrid as applyMask }` 别名导出，导致编码器和解码器的同名函数冲突未彻底解决。

**修复**：删除了该别名导出，确保：
- 编码器仅导出 [applyDataMask](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/qrcode/qrcodeEncoder.js#L338)
- 解码器仅导出 [unmaskGrid](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/qrcode/qrcodeDecoder.js#L201)

两个函数语义完全区分，不会产生导入歧义。

### 测试结果

```
Test Files:  47 passed (47)
Tests:       3206 passed (3206)
```

所有测试全部通过，无任何失败。