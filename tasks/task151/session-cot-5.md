让我先查看当前的绘制代码和对应测试：


        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\poster-designer\posterDesignerCore.js
          
让我检查完整个 drawPoster 函数中所有的 save/restore 对：



        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\poster-designer\posterDesignerCore.js
          
文字图层的 save/restore 是好的（save 在 try 外面，restore 也在外面），但文字绘制的 try/catch 如果 strokeText/fillText 抛错也不影响 save/restore 平衡。问题只有背景图片那一处。

现在修复：用 `try/finally` 保证 restore 始终被调用：





        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\poster-designer\posterDesignerCore.js
          
changes: undefined
          
现在更新测试：给 mock ctx 增加 save/restore 配对计数，并在异常场景下断言配对。同时更新 createMockCtx 工具函数：







        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\poster-designer\posterDesignerCore.test.js
          
现在修改 createMockCtx，给它添加 save/restore 深度追踪（restore 时深度不能小于 0，否则代表调用不平衡），同时在异常测试中断言配对：








        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\poster-designer\posterDesignerCore.test.js
          
changes: undefined
          
现在读取异常测试的代码，然后增强它：










        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\poster-designer\posterDesignerCore.test.js
          
现在增强异常测试，添加 save/restore 配对校验，并给其他用例也加上平衡校验作为通用断言：













        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\poster-designer\posterDesignerCore.test.js
          
changes: undefined
          
现在运行测试和 lint 验证：






        
            
toolName: run_command
            
status: success
          
command: npx vitest run src/pages/__tests__/poster-designer/ ; npx eslint src/pages/poster-designer/ src/pages/__tests__/poster-designer/ undefined
          
全部 83 个测试通过，ESLint 无错误。

---

## 修复内容

### 1. drawPoster 中 try/catch 的 save/restore 不平衡

**根因**：在 [posterDesignerCore.js](file:///C:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/poster-designer/posterDesignerCore.js#L306-L314) 中，`ctx.save()` 和 `ctx.restore()` 都在 `try` 块内部，如果 `ctx.drawImage()` 抛异常，`ctx.restore()` 就会被跳过，导致 Canvas 上下文栈深度泄漏。

**修复**：将 `ctx.save()` 移到 `try` 之前，把 `ctx.restore()` 放进 `finally` 块。无论 `drawImage` 成功或抛错，`save` / `restore` 始终配对：

```js
if (bg.image && isHTMLImageElement(bg.image)) {
  ctx.save()
  try {
    ctx.globalAlpha = clampBgOpacity(bg.imageOpacity)
    ctx.drawImage(bg.image, 0, 0, canvasWidth, canvasHeight)
  } catch {
    // image draw failed, color fill already in place as fallback
  } finally {
    ctx.restore()
  }
}
```

---

### 2. 测试覆盖增强

在 [posterDesignerCore.test.js](file:///C:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/__tests__/poster-designer/posterDesignerCore.test.js#L731-L882) 的 `drawPoster` 测试组中：

- **Mock Context 增强**：`createMockCtx()` 增加了 `saveDepth` 计数器和 `saveRestoreBalanced` 标志——`restore` 时深度<0 会标记为不平衡，最终断言 `saveRestoreBalanced === true` 即代表 save/restore 完全配对。
- **原异常测试升级**：用例改名为 `should fallback to color fill if drawImage throws and keep save/restore balanced`，新增 3 个断言：`saveCalls.length === restoreCalls.length`、`saveDepth === 0`、`saveRestoreBalanced === true`。
- **所有绘制用例统一校验平衡**：其余 4 个现有绘制用例（正常画图、无图纯颜色、透明度、文字图层在上）均追加 `expect(ctx.saveRestoreBalanced).toBe(true)`，作为通用不变式。
- **新增文字绘制异常场景**：新增用例 `should keep save/restore balanced when strokeText or fillText throw during text rendering`，模拟 `strokeText` 和 `fillText` 同时抛错时，文字图层外层的 `save`/`restore` 仍保持配对。