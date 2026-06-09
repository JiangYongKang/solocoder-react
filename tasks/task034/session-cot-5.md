好的，让我先读取当前这两个函数的实现，然后修复 stale closure 问题：


        
            
toolName: todo_write
            
status: success
          
Todos updated: 4 items
          

        
            
toolName: todo_write
            
status: success
          
Todos updated: 4 items
          
让我先读取这两个函数的当前实现：








        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\media-player\index.jsx
          
好的，我看到了问题。让我修复这两个函数，使用函数式 setState 处理所有依赖最新的 queue 状态：
























        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\media-player\index.jsx
          
changes: undefined
          
等等，我发现有两个问题：
1. `handlePlaylistItemClick` 中漏掉了已在队列中但非当前项的切换播放逻辑
2. 第 435 行有语法错误：`if (mediaRef.current?.play().catch(() => {})` 缺少右括号

让我修复：



























        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\media-player\index.jsx
          
changes: undefined
          
现在让我运行测试确保没有问题：



























        
            
toolName: todo_write
            
status: success
          
Todos updated: 4 items
          

        
            
toolName: run_command
            
status: success
          
command: pnpm run test undefined
          
看起来只运行了部分测试，让我运行完整的测试套件：




























        
            
toolName: run_command
            
status: success
          
command: pnpm run test --run undefined
          

        
            
toolName: run_command
            
status: success
          
command: pnpm run test undefined
          
所有 3267 个测试全部通过！现在启动 dev 服务器：





























        
            
toolName: todo_write
            
status: success
          
Todos updated: 4 items
          

        
            
toolName: run_command
            
status: running
          
command: pnpm run dev undefined
          

        
            
toolName: open_preview
            
status: success
          
预览
          
同样，这个错误来自其他模块（social-feed），与我们的音视频播放器无关。让我完成所有任务：































        
            
toolName: todo_write
            
status: success
          
Todos updated: 4 items
          
所有问题已修复完成！以下是详细总结：

## 修复内容

### 1. `handleDeleteMedia` 的 stale closure 修复

**文件**：[index.jsx](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/media-player/index.jsx#L383-L416)

**问题**：使用闭包中的旧 `queue.length` 做条件判断。当删除队列中唯一项目时，旧 `queue.length = 1`，`queue.length > 1` 为 `false`，导致跳过索引修正。

**修复方案**：
```javascript
setQueue((prevQueue) => {
  const newQueue = prevQueue.filter((item) => item.id !== id)
  if (oldQueueIdx === currentIndex) {
    shouldStop = true
    shouldResetTime = true
    // 使用过滤后的新数组长度判断，而非闭包中的旧值
    if (newQueue.length > 0) {
      newIndexAfterDelete = oldQueueIdx === newQueue.length ? oldQueueIdx - 1 : oldQueueIdx
    }
  } else if (oldQueueIdx < currentIndex) {
    newIndexAfterDelete = currentIndex - 1
  }
  return newQueue
})
```

### 2. `handlePlaylistItemClick` 的 stale closure 修复

**文件**：[index.jsx](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/media-player/index.jsx#L418-L440)

**问题**：`targetQueueIndex = queue.length` 使用闭包中的旧值假定新位置，同时之前还漏掉了已存在项的切换播放逻辑，并有语法错误。

**修复方案**：
```javascript
if (needsAppend) {
  setQueue((prevQueue) => {
    // 在函数式更新器内部用 prevQueue.length 获取准确的新索引
    targetQueueIndex = prevQueue.length
    return [...prevQueue, item]
  })
}

// 已在队列中且是当前项 → 切换播放；否则切换到目标项播放
if (targetQueueIndex === currentIndex && !needsAppend) {
  togglePlay()
} else {
  setCurrentIndex(targetQueueIndex)
  setCurrentTime(0)
  // ... 自动播放
}
```

## 验证结果

✅ **3267/3267 单元测试全部通过**  
✅ **Dev 服务器已启动**：http://localhost:5175/

你可以手动验证：
- 删除队列中唯一正在播放的项：播放停止、时间重置为 0
- 点击不在队列中的播放列表项：该项被追加到队列末尾并自动播放
- 点击已在队列中且正在播放的项：切换暂停/播放
- 点击已在队列中非当前项：切换到该项并播放