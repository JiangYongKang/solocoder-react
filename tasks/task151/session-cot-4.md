toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\poster-designer\posterDesignerCore.test.js
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\poster-designer\posterDesignerCore.js
          
现在补充两类回归测试：
        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\poster-designer\posterDesignerCore.test.js
          
changes: undefined
          
运行测试和 lint 验证：
        
            
toolName: run_command
            
status: success
          
command: npx vitest run src/pages/__tests__/poster-designer/ ; npx eslint src/pages/poster-designer/ src/pages/__tests__/poster-designer/ undefined
          
需要将 `drawPoster` 加入测试文件的 import，并移除未使用的 `fillStyleCalls` 变量：
        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\poster-designer\posterDesignerCore.test.js
          
changes: undefined
          
现在移除未使用的 `fillStyleCalls` 变量：
        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\poster-designer\posterDesignerCore.test.js
          
changes: undefined
          

        
            
toolName: run_command
            
status: success
          
command: npx vitest run src/pages/__tests__/poster-designer/ ; npx eslint src/pages/poster-designer/ src/pages/__tests__/poster-designer/ undefined
          
全部 82 个测试通过，ESLint 无错误。

---

## 补充的回归测试

### 1. 背景色修改不误删图片（3 个用例）

在 [posterDesignerCore.test.js](file:///C:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/__tests__/poster-designer/posterDesignerCore.test.js#L678-L727) 新增 `regression: background color change must not clear image` 测试组：

- **`updateLayer` 只改颜色不改图片** — 给 bg 层设置 `image` + `imageSrc` + `imageOpacity` 后调 `updateLayer(bg, { color })`，断言 `image`、`imageSrc`、`imageOpacity` 全部原样保留
- **多次改颜色后图片仍在** — 连续 4 次 `updateLayer` 改颜色，断言 `image` 和 `imageSrc` 不变
- **任意属性更新不影响其他字段** — 改 `imageOpacity` 后断言 `image`、`imageSrc`、`color` 均不受影响

### 2. 先填底色再叠图片的绘制逻辑（5 个用例）

在 [posterDesignerCore.test.js](file:///C:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/__tests__/poster-designer/posterDesignerCore.test.js#L730-L844) 新增 `drawPoster: fill-then-overlay rendering` 测试组，使用 mock Canvas context 记录调用顺序和参数：

- **先填色再画图** — 有图片时 `fillRect` 调用序号 < `drawImage` 调用序号，验证叠绘顺序
- **无图片只填色** — 无图片时 `drawImage` 不被调用，`fillRect` 正常执行
- **透明度透传** — `imageOpacity: 0.35` 被正确设为 `globalAlpha`
- **图片绘制异常不崩溃** — `drawImage` 抛错时不影响已绘制的颜色底色
- **文字在图片之上** — 有背景色 + 图片 + 文字时，`fillText` 调用序号 > `drawImage` 调用序号