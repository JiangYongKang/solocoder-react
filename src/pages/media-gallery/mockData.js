import { generateMediaId } from './utils'

const PLACEHOLDER_IMG_1 =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"><rect fill="#f4f3ec" width="400" height="300"/><rect fill="#aa3bff" x="160" y="110" width="80" height="80" rx="8"/><text fill="#aa3bff" font-family="sans-serif" font-size="20" x="50%" y="240" text-anchor="dominant-baseline="middle">风景</text></svg>`
  )

const PLACEHOLDER_IMG_2 =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="400" viewBox="0 0 300 400"><rect fill="#e8f5e9" width="300" height="400"/><circle fill="#4caf50" cx="150" cy="160" r="60"/><text fill="#2e7d32" font-family="sans-serif" font-size="20" x="50%" y="300" text-anchor="middle" dominant-baseline="middle">人像</text></svg>`
  )

const PLACEHOLDER_IMG_3 =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="500" height="300" viewBox="0 0 500 300"><rect fill="#fff3e0" width="500" height="300"/><polygon fill="#ff9800" points="250,100 200,200 300,200"/><text fill="#e65100" font-family="sans-serif" font-size="20" x="50%" y="260" text-anchor="middle" dominant-baseline="middle">建筑</text></svg>`
  )

const PLACEHOLDER_IMG_4 =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="350" height="350" viewBox="0 0 350 350"><rect fill="#e3f2fd" width="350" height="350"/><rect fill="#2196f3" x="100" y="100" width="150" height="150" rx="75"/><text fill="#0d47a1" font-family="sans-serif" font-size="20" x="50%" y="310" text-anchor="middle" dominant-baseline="middle">设计稿</text></svg>`
  )

const PLACEHOLDER_VIDEO =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="225" viewBox="0 0 400 225"><rect fill="#1a1a2e" width="400" height="225"/><polygon fill="#e94560" points="180,80 180,145 240,112.5"/><text fill="#e94560" font-family="sans-serif" font-size="16" x="50%" y="200" text-anchor="middle" dominant-baseline="middle">视频文件</text></svg>`
  )

const PLACEHOLDER_AUDIO =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300"><rect fill="#fce4ec" width="300" height="300"/><circle fill="#e91e63" cx="150" cy="130" r="50"/><rect fill="#880e4f" x="130" y="180" width="40" height="80" rx="4"/><text fill="#880e4f" font-family="sans-serif" font-size="16" x="50%" y="285" text-anchor="middle" dominant-baseline="middle">音频文件</text></svg>`
  )

const PLACEHOLDER_PDF =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="380" viewBox="0 0 300 380"><rect fill="#ffebee" width="300" height="380"/><rect fill="#f44336" x="100" y="60" width="100" height="40" rx="4"/><rect fill="#b71c1c" x="60" y="120" width="180" height="8" rx="2"/><rect fill="#ef9a9a" x="60" y="140" width="180" height="6" rx="2"/><rect fill="#ef9a9a" x="60" y="156" width="140" height="6" rx="2"/><text fill="#b71c1c" font-family="sans-serif" font-size="16" x="50%" y="350" text-anchor="middle" dominant-baseline="middle">PDF 文档</text></svg>`
  )

export function createInitialMedia() {
  const now = Date.now()
  const day = 24 * 60 * 60 * 1000

  return [
    {
      id: generateMediaId(),
      name: '风景照片.jpg',
      size: 1024 * 1024 * 2.5,
      type: 'image',
      dataUrl: PLACEHOLDER_IMG_1,
      tags: ['风景', '自然', '旅行'],
      favorite: true,
      createdAt: now - day * 2,
      updatedAt: now - day * 2,
    },
    {
      id: generateMediaId(),
      name: '人像摄影.png',
      size: 1024 * 1024 * 3.2,
      type: 'image',
      dataUrl: PLACEHOLDER_IMG_2,
      tags: ['人像', '摄影'],
      favorite: false,
      createdAt: now - day * 5,
      updatedAt: now - day * 5,
    },
    {
      id: generateMediaId(),
      name: '城市建筑.jpg',
      size: 1024 * 1024 * 1.8,
      type: 'image',
      dataUrl: PLACEHOLDER_IMG_3,
      tags: ['建筑', '城市'],
      favorite: true,
      createdAt: now - day * 1,
      updatedAt: now - day * 1,
    },
    {
      id: generateMediaId(),
      name: 'UI设计稿.png',
      size: 1024 * 1024 * 4.1,
      type: 'image',
      dataUrl: PLACEHOLDER_IMG_4,
      tags: ['设计', 'UI', '工作'],
      favorite: false,
      createdAt: now - day * 3,
      updatedAt: now - day * 3,
    },
    {
      id: generateMediaId(),
      name: '产品演示视频.mp4',
      size: 1024 * 1024 * 45,
      type: 'video',
      dataUrl: PLACEHOLDER_VIDEO,
      tags: ['视频', '产品', '工作'],
      favorite: false,
      createdAt: now - day * 7,
      updatedAt: now - day * 7,
    },
    {
      id: generateMediaId(),
      name: '背景音乐.mp3',
      size: 1024 * 1024 * 5.6,
      type: 'audio',
      dataUrl: PLACEHOLDER_AUDIO,
      tags: ['音乐', '音频'],
      favorite: true,
      createdAt: now - day * 10,
      updatedAt: now - day * 10,
    },
    {
      id: generateMediaId(),
      name: '项目文档.pdf',
      size: 1024 * 1024 * 1.2,
      type: 'document',
      dataUrl: PLACEHOLDER_PDF,
      tags: ['文档', '工作'],
      favorite: false,
      createdAt: now - day * 4,
      updatedAt: now - day * 4,
    },
    {
      id: generateMediaId(),
      name: '旅行记录.jpg',
      size: 1024 * 1024 * 2.9,
      type: 'image',
      dataUrl: PLACEHOLDER_IMG_1,
      tags: ['旅行', '风景'],
      favorite: false,
      createdAt: now - day * 15,
      updatedAt: now - day * 15,
    },
  ]
}

export {
  PLACEHOLDER_IMG_1,
  PLACEHOLDER_IMG_2,
  PLACEHOLDER_IMG_3,
  PLACEHOLDER_IMG_4,
  PLACEHOLDER_VIDEO,
  PLACEHOLDER_AUDIO,
  PLACEHOLDER_PDF,
}
