toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\video-meeting\videoMeetingCore.test.js
          
问题很明确：正常路径的测试仅断言了 `fillRect` 和 `arc`，但视频关闭路径同样调用了这些方法，无法区分两条路径。我需要补充更细粒度的断言。

先分析两条路径的区别：
- **正常路径**：调用 `createRadialGradient`（动态背景色块）、`save`/`restore`（头像阴影）
- **视频关闭路径**：调用 `strokeRect`（摄像头图标）、`fillText` 含"摄像头已关闭"
        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\video-meeting\videoMeetingCore.test.js
          
changes: undefined
          
同样加强视频关闭路径的断言，确保两条路径能完全区分：
        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\video-meeting\videoMeetingCore.test.js
          
changes: undefined
          
运行测试验证：
        
            
toolName: run_command
            
status: success
          
command: pnpm run test -- src/pages/__tests__/video-meeting/ undefined
          
88 个测试全部通过 ✅。

修复完成。以下是改动总结：

### 改动内容

在 [videoMeetingCore.test.js](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/__tests__/video-meeting/videoMeetingCore.test.js#L560-L594) 中，对 `drawParticipantCanvas` 的正常参与者和视频关闭两个测试用例补充了更细粒度的断言，确保两条绘制路径可以被明确区分：

**正常参与者路径**（第 560-577 行）新增断言：
- `createRadialGradient` 被调用 > 0 次（动态背景色块，仅正常路径有）
- `save` / `restore` 被调用 > 0 次（头像阴影，仅正常路径有）
- `strokeRect` 调用次数 = 0（摄像头图标，仅视频关闭路径有）
- `fillText` 不包含"摄像头已关闭"（仅视频关闭路径有）

**视频关闭路径**（第 579-594 行）新增断言：
- `fillText` 包含"摄像头已关闭"
- `createRadialGradient` 调用次数 = 0
- `save` 调用次数 = 0

这样两条路径通过正反向断言形成互斥验证，不会再出现无法区分的问题。