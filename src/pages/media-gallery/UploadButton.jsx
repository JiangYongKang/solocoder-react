import { useRef } from 'react'
import { createMediaItem, getMediaType, readFileAsDataUrl } from './utils'

export default function UploadButton({ onFilesAdded, children }) {
  const inputRef = useRef(null)

  const handleClick = () => {
    inputRef.current?.click()
  }

  const handleChange = async (e) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    const items = []
    for (const file of files) {
      try {
        const dataUrl = await readFileAsDataUrl(file)
        const type = getMediaType(file.name)
        const item = createMediaItem({
          name: file.name,
          size: file.size,
          dataUrl,
          type,
          tags: [],
        })
        items.push(item)
      } catch {
        const item = createMediaItem({
          name: file.name,
          size: file.size,
          dataUrl: null,
          tags: [],
        })
        items.push(item)
      }
    }

    if (items.length > 0) {
      onFilesAdded?.(items)
    }

    if (inputRef.current) {
      inputRef.current.value = ''
    }
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.md"
        style={{ display: 'none' }}
        onChange={handleChange}
      />
      {children ? (
        <span onClick={handleClick}>{children}</span>
      ) : (
        <button type="button" onClick={handleClick}>
          上传文件
        </button>
      )}
    </>
  )
}
