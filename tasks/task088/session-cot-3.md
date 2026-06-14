让我先读取当前的代码，了解最新的实现情况。



        
            
toolName: todo_write
            
status: success
          
Todos updated: 4 items
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\danmaku-player\index.jsx
          
现在我清楚了两个问题。让我逐一修复。

**问题1**：第 176-179 行的旧守卫 `if (!isPlaying && lastFrameTimeRef.current === 0)` 中，`lastFrameTimeRef` 从未被修改为非零值，暂停态下该守卫恒为真，导致后续的 renderSignature 跳过逻辑成为死代码。需要移除这个旧守卫。

**问题2**：`requestFullscreen` 的 Promise 被拒绝时，catch 回调中没有调用 `setIsFullscreen(false)` 回退 UI 状态，同时 `nativeFullscreenRef` 也应该设为 false。




        
            
toolName: todo_write
            
status: success
          
Todos updated: 4 items
          
修复问题1和问题2：





        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\danmaku-player\index.jsx
          
changes: undefined
          
现在修复问题2 - toggleFullscreen 中 Promise 被拒绝时回退 UI 状态：







        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\danmaku-player\index.jsx
          
changes: undefined
          
现在运行测试：









        
            
toolName: todo_write
            
status: success
          
Todos updated: 4 items
          

        
            
toolName: run_command
            
status: success
          
command: pnpm run test -- danmaku-player undefined
          
所有测试都通过了！让我更新 todo 状态。










        
            
toolName: todo_write
            
status: success
          
Todos updated: 4 items
          
两个问题均已修复完成，所有测试通过（**146 passed**）。

---

### 修复总结

**修复1：清理 renderFrame 死守卫（[index.jsx L175-L187](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/danmaku-player/index.jsx#L175-L187)）**

- 删除了入口处的旧守卫 `if (!isPlaying && lastFrameTimeRef.current === 0)`，该守卫中 `lastFrameTimeRef` 从未被赋值为非零值，导致暂停态下 renderSignature 跳过逻辑永远无法被执行
- 优化了 renderSignature 的组成：将弹幕状态标识扩展为包含 `opacity`，将暂停态的时间戳统一用字符串 `"paused"` 代替，确保暂停态下 renderSignature 与上一帧完全一致，从而命中跳过条件

**修复2：toggleFullscreen 请求失败时回退 UI 状态（[index.jsx L421-L443](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/danmaku-player/index.jsx#L421-L443)）**

- `requestFullscreen.call(container).catch(...)` 中，将 `nativeFullscreenRef.current` 设为 `false` 并调用 `setIsFullscreen(false)` 回退 UI 状态，避免按钮文案显示"退出全屏"但实际并未进入全屏
- `try { ... } catch (_)` 同步异常分支同样回退
- 增加 else 分支：若浏览器不支持 `requestFullscreen` API，则 `nativeFullscreenRef` 保持为 `false`
- 同步 `exitFullscreen` 调用也加上了 `.catch(() => {})`，防止退出失败时 Promise 未处理