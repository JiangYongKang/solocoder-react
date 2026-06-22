让我定位并修复这个回归问题。问题在于背景色修改函数中连带设置了 `image: null`。

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\poster-designer\index.jsx
          
找到问题了。三个处理函数都错误地设置了 `image: null`。同时需要修复预设色块点击的处理（在 JSX 部分）。让我一并修复：



        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\poster-designer\index.jsx
          
changes: undefined
          
现在还需要检查 `drawPoster` 中背景色和图片的关系。当前逻辑是：如果有 image 就画图片，否则画颜色。但用户应该能够同时设置颜色和图片，颜色作为图片透明区域的兜底背景。让我检查并修正绘制逻辑：




        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\poster-designer\posterDesignerCore.js
          
当前逻辑是：有 image 就只画图片，没 image 才画颜色。这意味着当有图片但用户改颜色时，颜色确实显示不出来。更合理的行为是：**先画纯色作为兜底，再在上面画（带透明度的）背景图片**。这样颜色和图片可以并存，图片透明区域会透出底下的颜色。

让我修改绘制逻辑：






        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\poster-designer\posterDesignerCore.js
          
changes: undefined
          
现在运行测试和 lint 验证修复：






        
            
toolName: run_command
            
status: success
          
command: npx eslint src/pages/poster-designer/ src/pages/__tests__/poster-designer/ ; npx vitest run src/pages/__tests__/poster-designer/ undefined
          
所有 74 个测试通过，ESLint 无错误。修复完成！

---

## 修复内容

### 回归问题：修改背景色误清除背景图片

**根因**：三个背景色处理函数（`handleBgColorTextChange`、`handleBgColorTextCommit`、`handleBgColorPickerChange`）在更新 `color` 时都错误地设置了 `image: null`，导致每次改颜色都会把背景图片一并删掉。

### 修复

**1. 移除连带清除图片的逻辑** — 在 [index.jsx](file:///C:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/poster-designer/index.jsx#L299-L327) 的三个颜色处理函数中，不再向 `updateLayer` 传入 `image: null`，只更新 `color` 字段。

**2. 优化背景绘制逻辑** — 在 [posterDesignerCore.js](file:///C:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/poster-designer/posterDesignerCore.js#L300-L315) 的 `drawPoster` 中，改为**先画纯色底色，再在上面叠画背景图片**。这样：
- 颜色和图片成为完全独立的两个属性，互不影响
- 图片的透明区域会透出下方的背景色，行为更合理
- 图片加载失败时，已经画好的颜色自然兜底