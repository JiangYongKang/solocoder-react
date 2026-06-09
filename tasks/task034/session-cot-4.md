我理解了！这里需要区分"播放列表"（所有媒体）和"播放队列"（实际播放顺序），并且要排除默认示例项。让我先重新梳理一下需求，然后实现：

1. 播放列表存放所有媒体
2. 增加一个独立的播放队列
3. "批量加入队列"按钮将播放列表中用户添加的媒体（排除默认示例）以去重方式追加到播放队列
4. 按钮在无可添加项时置灰

让我开始实现：

        
            
toolName: todo_write
            
status: success
          
Todos updated: 6 items
          
让我先仔细查看相关文件，了解默认示例数据的特征，然后添加工具函数：


        
            
toolName: todo_write
            
status: success
          
Todos updated: 6 items
          
让我先读取 constants.js 看看默认示例的定义：







        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\media-player\constants.js
          
现在我理解了需求。需要区分"播放列表"（所有媒体）和"播放队列"（实际播放列表），并且需要区分默认示例和用户添加的媒体。让我先在常量和工具函数中增加相应的支持：


        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\media-player\constants.js
          
changes: undefined
          
现在添加播放队列相关的纯 JS 工具函数到 mediaPlayerUtils.js：







        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\media-player\mediaPlayerUtils.js
          
现在在 mediaPlayerUtils.js 中添加播放队列相关的纯函数，并更新现有函数支持 source 字段：






        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\media-player\mediaPlayerUtils.js
          
让我先修改导入，然后更新 createMediaItem 和 loadPlaylist，最后添加队列相关函数：









        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\media-player\mediaPlayerUtils.js
          
changes: undefined
          
现在更新 createMediaItem 函数添加 source 字段：









        
            
toolName: search_by_regex
            
status: success
          
query: export function createMediaItem
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\media-player\mediaPlayerUtils.js
          
让我更新 createMediaItem 并在文件末尾添加队列相关函数：











        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\media-player\mediaPlayerUtils.js
          
changes: undefined
          
现在让我查看 generateDefaultPlaylistItems 并更新它，然后在文件末尾添加队列相关函数：











        
            
toolName: search_by_regex
            
status: success
          
query: export function generateDefaultPlaylistItems
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\media-player\mediaPlayerUtils.js
          
现在在文件末尾添加播放队列相关的纯函数：












        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\media-player\mediaPlayerUtils.js
          

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\media-player\mediaPlayerUtils.js
          
changes: undefined
          
工具函数已添加完毕！现在让我更新进度并修改 index.jsx：





        
            
toolName: todo_write
            
status: success
          
Todos updated: 6 items
          
让我先读取 index.jsx 的关键部分：










        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\media-player\index.jsx
          
让我找到 handleAddAllDefaults 的位置：









        
            
toolName: search_by_regex
            
status: success
          
query: handleAddAllDefaults
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\media-player\index.jsx
          
现在让我先看一下播放列表部分的 UI 和按钮位置：










        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\media-player\index.jsx
          
好的，现在我理解了架构。需要将"播放列表"（媒体库）和"播放队列"（实际播放顺序）分离。让我先看看播放相关的逻辑：











        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\media-player\index.jsx
          
让我查看一下 handleAddMedia 函数，确保用户添加的媒体标记为 user 来源：












        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\media-player\index.jsx
          
让我看看 handlePlaylistItemClick 和自动播放下一首等逻辑：















        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\media-player\index.jsx
          
让我看看播放下一首和 ended 事件处理的逻辑：


















        
            
toolName: search_by_regex
            
status: success
          
query: getNextMediaIndex|getPrevMediaIndex|handleNext|handlePrev|ended
          
让我看看 ended 事件处理和更多播放逻辑：























        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\media-player\index.jsx
          
好的，我现在完全理解了。让我来实现：
- `playlist`：媒体库（所有媒体，默认示例 + 用户添加的）
- `queue`：播放队列（实际播放的列表，默认包含所有媒体以保证可用性）
- "全部加入队列"：将 playlist 中用户添加的、且不在 queue 中的媒体去重追加到 queue

现在我开始修改 index.jsx：
































        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\media-player\index.jsx
          
changes: undefined
          
现在增加 queue 状态并修改相关逻辑：
































        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\media-player\index.jsx
          
changes: undefined
          
现在修改 currentMedia 从 queue 获取，并添加 queue 的保存 useEffect：

































        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\media-player\index.jsx
          
changes: undefined
          
现在修改 handleEnded、handleNext、handlePrev 使用 queue：




































        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\media-player\index.jsx
          
changes: undefined
          

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\media-player\index.jsx
          
changes: undefined
          
现在修改 handleAddAllDefaults 为 handleAddAllToQueue，并更新 handlePlaylistItemClick：





































        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\media-player\index.jsx
          
changes: undefined
          
现在更新 handleClearPlaylist，同时我需要保留"添加示例媒体"功能，添加一个新的按钮。让我先更新 handleClearPlaylist：





































        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\media-player\index.jsx
          

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\media-player\index.jsx
          
changes: undefined
          
现在修改播放列表的 UI 部分。先找到 handlePlaylistItemClick 的调用处：










































        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\media-player\index.jsx
          
现在修改按钮区域和播放列表项的高亮逻辑（根据 item.id 判断当前播放项）：












































        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\media-player\index.jsx
          
现在修改按钮区域，同时修改播放列表项：















































        
            
toolName: todo_write
            
status: success
          
Todos updated: 6 items
          
现在修改按钮区域和播放列表项。我用 useMemo 计算按钮的 disabled 状态：













































        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\media-player\index.jsx
          
changes: undefined
          
现在修改按钮区域 UI：













































        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\media-player\index.jsx
          
changes: undefined
          
现在修改播放列表项的点击和高亮逻辑：















































        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\media-player\index.jsx
          
changes: undefined
          
现在让我添加 .primary 按钮样式到 CSS，然后检查拖拽排序逻辑：
















































        
            
toolName: todo_write
            
status: success
          
Todos updated: 6 items
          
让我先看一下 CSS 中播放列表按钮的样式：


















































        
            
toolName: search_by_regex
            
status: success
          
query: playlist-action-btn
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\media-player\media-player.css
          
现在添加 primary 和 disabled 按钮样式：




















































        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\media-player\media-player.css
          
changes: undefined
          
现在让我完成 CSS 样式，然后补充单元测试：





















































        
            
toolName: todo_write
            
status: success
          
Todos updated: 6 items
          
让我先读取测试文件的末尾，看看现有结构：





















































        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\media-player\mediaPlayerUtils.test.js
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\media-player\mediaPlayerUtils.test.js
          
让我先看看测试文件开头的导入，然后添加新测试：






















































        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\media-player\mediaPlayerUtils.test.js
          
先更新测试文件的导入：




















































        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\media-player\mediaPlayerUtils.test.js
          
现在更新测试文件的导入：























































        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\media-player\mediaPlayerUtils.test.js
          
changes: undefined
          
现在在测试文件末尾添加播放队列相关的单元测试：

























































        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\media-player\mediaPlayerUtils.test.js
          
changes: undefined
          
测试已添加！现在让我运行测试确保全部通过：




















































        
            
toolName: todo_write
            
status: success
          
Todos updated: 6 items
          

        
            
toolName: run_command
            
status: success
          
command: pnpm run test undefined
          
测试发现一个问题：`isUserMedia({})` 返回了 `true`，因为空对象的 `source` 是 `undefined`，`undefined !== 'default'` 为 `true`。让我修复这个逻辑——应该要求有效的媒体项（至少有 id）：


















































        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\media-player\mediaPlayerUtils.js
          
changes: undefined
          
现在重新运行测试：




















































        
            
toolName: run_command
            
status: success
          
command: pnpm run test undefined
          
所有 3267 个测试全部通过！现在启动 dev 服务器：





















































        
            
toolName: todo_write
            
status: success
          
Todos updated: 6 items
          

        
            
toolName: run_command
            
status: running
          
command: pnpm run dev undefined
          
Dev 服务器已启动！让我打开预览：




















































        
            
toolName: open_preview
            
status: success
          
预览
          
这个错误来自其他模块（social-feed），与我们的音视频播放器无关，不影响功能验证。让我完成所有任务：






















































        
            
toolName: todo_write
            
status: success
          
Todos updated: 6 items
          
所有问题已修复完成！以下是详细总结：

## 修复内容

### 1. 核心架构调整：分离播放列表（媒体库）与播放队列

**文件**：[constants.js](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/media-player/constants.js)
- 新增 `STORAGE_KEY_QUEUE` 常量（播放队列 localStorage 存储键）
- 新增 `MEDIA_SOURCES` 枚举（`DEFAULT` / `USER`），用于区分默认示例和用户添加的媒体
- `DEFAULT_PLAYLIST` 中的示例项增加 `source: 'default'` 标记

### 2. 新增 10 个纯 JS 工具函数

**文件**：[mediaPlayerUtils.js](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/media-player/mediaPlayerUtils.js)
| 函数 | 功能 |
|---|---|
| `isDefaultMedia(item)` | 判断是否为默认示例媒体 |
| `isUserMedia(item)` | 判断是否为用户添加的媒体 |
| `filterUserMediaItems(playlist)` | 过滤出用户添加的媒体 |
| `filterDefaultMediaItems(playlist)` | 过滤出默认示例媒体 |
| `saveQueue(queue)` | 保存播放队列到 localStorage |
| `loadQueue()` | 从 localStorage 加载播放队列 |
| `appendToQueue(existingQueue, newItems)` | 去重追加媒体到队列尾部 |
| `getQueueableUserItems(playlist, queue)` | 获取可加入队列的用户媒体（排除已在队列中的） |
| `hasQueueableUserItems(playlist, queue)` | 判断是否有可加入队列的用户媒体 |
| `createMediaItem(title, url, type, source)` | 支持 `source` 参数，默认 `'user'` |

### 3. 主组件功能实现

**文件**：[index.jsx](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/media-player/index.jsx)
- 新增 `queue` 状态（独立于 `playlist`），自动持久化到 localStorage
- **"全部加入队列"按钮**：点击后将播放列表中所有 `source !== 'default'` 的用户媒体以 ID 去重追加到播放队列尾部
- **按钮置灰逻辑**：当播放列表中没有可加入队列的用户媒体时（没有用户媒体 / 所有用户媒体已在队列中）自动 disabled
- **"+ 添加示例"按钮**：保留此功能，添加示例媒体到播放列表和播放队列
- 播放、上一首/下一首、自动播放下一首、删除、清空等操作均基于 `queue` 而非 `playlist`
- 点击播放列表项时，若该项不在队列中会自动追加到队列再播放

### 4. CSS 样式补充

**文件**：[media-player.css](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/media-player/media-player.css)
- `.playlist-action-btn.primary`：主按钮高亮样式（蓝色背景）
- `.playlist-action-btn:disabled`：置灰样式（opacity 0.4 + cursor not-allowed）

### 5. 单元测试

**文件**：[mediaPlayerUtils.test.js](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/__tests__/media-player/mediaPlayerUtils.test.js)
- 新增 32 个测试用例，覆盖全部新增纯函数

## 验证结果

✅ **3267/3267 单元测试全部通过**  
✅ **Dev 服务器已启动**：http://localhost:5174/

你可以进入首页点击"音视频播放器"任务卡片，手动验证：
- 初次进入时，"全部加入队列"按钮为置灰状态（只有默认示例媒体）
- 通过"添加到播放列表"按钮添加 1-2 个自定义媒体后，按钮变为可点击状态
- 点击"全部加入队列"后，用户添加的媒体被追加到播放队列（重复点击不会重复添加）