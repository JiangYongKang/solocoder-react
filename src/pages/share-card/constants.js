export const CARD_SIZE_SQUARE = { width: 600, height: 600 }
export const CARD_SIZE_PORTRAIT = { width: 600, height: 1000 }

export const CARD_SIZES = {
  square: CARD_SIZE_SQUARE,
  portrait: CARD_SIZE_PORTRAIT,
}

export const CARD_SIZE_LABELS = {
  square: '方形 (1:1)',
  portrait: '竖版 (3:5)',
}

export const BACKGROUND_MODES = {
  IMAGE: 'image',
  GRADIENT: 'gradient',
  COLOR: 'color',
}

export const GRADIENT_DIRECTIONS = {
  HORIZONTAL: 'horizontal',
  VERTICAL: 'vertical',
  DIAGONAL: 'diagonal',
}

export const GRADIENT_DIRECTION_LABELS = {
  horizontal: '水平',
  vertical: '垂直',
  diagonal: '对角线',
}

export const TEXT_ALIGNMENTS = {
  LEFT: 'left',
  CENTER: 'center',
  RIGHT: 'right',
}

export const TEXT_ALIGNMENT_LABELS = {
  left: '左对齐',
  center: '居中',
  right: '右对齐',
}

export const PRESET_COLORS = [
  '#FFFFFF', '#000000', '#FF6B6B', '#4ECDC4', '#45B7D1',
  '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F',
  '#BB8FCE', '#85C1E9', '#F8B500', '#FF8C00', '#2ECC71',
  '#3498DB', '#9B59B6', '#E74C3C', '#1ABC9C', '#F39C12',
]

export const DEFAULT_CONFIG = {
  templateId: null,
  cardSize: 'square',
  background: {
    mode: BACKGROUND_MODES.COLOR,
    image: null,
    blur: 0,
    overlayColor: 'rgba(0,0,0,0)',
    gradientStart: '#667eea',
    gradientEnd: '#764ba2',
    gradientDirection: GRADIENT_DIRECTIONS.DIAGONAL,
    color: '#667eea',
  },
  title: {
    text: '分享标题',
    fontSize: 36,
    color: '#FFFFFF',
    alignment: TEXT_ALIGNMENTS.CENTER,
    bold: true,
  },
  description: {
    text: '这是一段描述文字，用于展示分享卡片的详细内容。',
    fontSize: 18,
    color: '#FFFFFF',
    alignment: TEXT_ALIGNMENTS.CENTER,
    bold: false,
  },
  logo: {
    enabled: false,
    image: null,
    size: 80,
    position: 'top',
  },
  qrcode: {
    enabled: false,
    content: 'https://example.com',
    size: 120,
    position: 'bottom',
  },
}

export const TEMPLATES = [
  {
    id: 'tech-gradient',
    name: '科技渐变',
    thumbnail: null,
    config: {
      cardSize: 'square',
      background: {
        ...DEFAULT_CONFIG.background,
        mode: BACKGROUND_MODES.GRADIENT,
        gradientStart: '#667eea',
        gradientEnd: '#764ba2',
        gradientDirection: GRADIENT_DIRECTIONS.DIAGONAL,
      },
      title: {
        ...DEFAULT_CONFIG.title,
        text: '技术分享',
        fontSize: 40,
        color: '#FFFFFF',
        alignment: TEXT_ALIGNMENTS.CENTER,
        bold: true,
      },
      description: {
        ...DEFAULT_CONFIG.description,
        text: '探索前沿技术，分享开发经验',
        fontSize: 20,
        color: 'rgba(255,255,255,0.85)',
        alignment: TEXT_ALIGNMENTS.CENTER,
      },
      logo: { ...DEFAULT_CONFIG.logo, position: 'top' },
      qrcode: { ...DEFAULT_CONFIG.qrcode, position: 'bottom' },
    },
  },
  {
    id: 'warm-sunset',
    name: '温暖日落',
    thumbnail: null,
    config: {
      cardSize: 'square',
      background: {
        ...DEFAULT_CONFIG.background,
        mode: BACKGROUND_MODES.GRADIENT,
        gradientStart: '#f093fb',
        gradientEnd: '#f5576c',
        gradientDirection: GRADIENT_DIRECTIONS.VERTICAL,
      },
      title: {
        ...DEFAULT_CONFIG.title,
        text: '美好时光',
        fontSize: 42,
        color: '#FFFFFF',
        bold: true,
      },
      description: {
        ...DEFAULT_CONFIG.description,
        text: '记录生活中的每一个温暖瞬间',
        fontSize: 18,
        color: 'rgba(255,255,255,0.9)',
      },
      logo: { ...DEFAULT_CONFIG.logo, position: 'top' },
      qrcode: { ...DEFAULT_CONFIG.qrcode, position: 'bottom' },
    },
  },
  {
    id: 'ocean-blue',
    name: '深海蓝',
    thumbnail: null,
    config: {
      cardSize: 'portrait',
      background: {
        ...DEFAULT_CONFIG.background,
        mode: BACKGROUND_MODES.GRADIENT,
        gradientStart: '#2193b0',
        gradientEnd: '#6dd5ed',
        gradientDirection: GRADIENT_DIRECTIONS.HORIZONTAL,
      },
      title: {
        ...DEFAULT_CONFIG.title,
        text: '海洋之心',
        fontSize: 44,
        color: '#FFFFFF',
        bold: true,
      },
      description: {
        ...DEFAULT_CONFIG.description,
        text: '深邃而宁静，包容万物的蓝色世界',
        fontSize: 20,
        color: 'rgba(255,255,255,0.9)',
      },
      logo: { ...DEFAULT_CONFIG.logo, position: 'top' },
      qrcode: { ...DEFAULT_CONFIG.qrcode, position: 'bottom' },
    },
  },
  {
    id: 'forest-green',
    name: '森林绿',
    thumbnail: null,
    config: {
      cardSize: 'square',
      background: {
        ...DEFAULT_CONFIG.background,
        mode: BACKGROUND_MODES.GRADIENT,
        gradientStart: '#134e5e',
        gradientEnd: '#71b280',
        gradientDirection: GRADIENT_DIRECTIONS.DIAGONAL,
      },
      title: {
        ...DEFAULT_CONFIG.title,
        text: '自然之声',
        fontSize: 38,
        color: '#FFFFFF',
        bold: true,
      },
      description: {
        ...DEFAULT_CONFIG.description,
        text: '回归自然，聆听森林的低语',
        fontSize: 18,
        color: 'rgba(255,255,255,0.88)',
      },
      logo: { ...DEFAULT_CONFIG.logo, position: 'top' },
      qrcode: { ...DEFAULT_CONFIG.qrcode, position: 'bottom' },
    },
  },
  {
    id: 'pure-white',
    name: '简约纯白',
    thumbnail: null,
    config: {
      cardSize: 'square',
      background: {
        ...DEFAULT_CONFIG.background,
        mode: BACKGROUND_MODES.COLOR,
        color: '#FFFFFF',
      },
      title: {
        ...DEFAULT_CONFIG.title,
        text: '极简设计',
        fontSize: 40,
        color: '#1a1a1a',
        bold: true,
      },
      description: {
        ...DEFAULT_CONFIG.description,
        text: 'Less is more，简约而不简单',
        fontSize: 18,
        color: '#666666',
      },
      logo: { ...DEFAULT_CONFIG.logo, position: 'top' },
      qrcode: { ...DEFAULT_CONFIG.qrcode, position: 'bottom' },
    },
  },
  {
    id: 'dark-mode',
    name: '暗夜模式',
    thumbnail: null,
    config: {
      cardSize: 'portrait',
      background: {
        ...DEFAULT_CONFIG.background,
        mode: BACKGROUND_MODES.GRADIENT,
        gradientStart: '#232526',
        gradientEnd: '#414345',
        gradientDirection: GRADIENT_DIRECTIONS.VERTICAL,
      },
      title: {
        ...DEFAULT_CONFIG.title,
        text: '暗夜降临',
        fontSize: 42,
        color: '#F5F5F5',
        bold: true,
      },
      description: {
        ...DEFAULT_CONFIG.description,
        text: '在黑暗中寻找光明的方向',
        fontSize: 18,
        color: 'rgba(245,245,245,0.75)',
      },
      logo: { ...DEFAULT_CONFIG.logo, position: 'top' },
      qrcode: { ...DEFAULT_CONFIG.qrcode, position: 'bottom' },
    },
  },
]

export const STORAGE_KEY_CONFIGS = 'share-card-configs'
export const STORAGE_KEY_LAST = 'share-card-last-config'

export const LAYOUT = {
  square: {
    logo: {
      top: { x: 300, y: 80 },
      bottom: { x: 300, y: 520 },
    },
    title: { x: 300, y: 220, maxWidth: 500 },
    description: { x: 300, y: 320, maxWidth: 500, lineHeight: 1.6 },
    qrcode: {
      top: { x: 300, y: 80 },
      bottom: { x: 300, y: 500 },
    },
    padding: 50,
  },
  portrait: {
    logo: {
      top: { x: 300, y: 100 },
      bottom: { x: 300, y: 900 },
    },
    title: { x: 300, y: 280, maxWidth: 500 },
    description: { x: 300, y: 400, maxWidth: 500, lineHeight: 1.6 },
    qrcode: {
      top: { x: 300, y: 100 },
      bottom: { x: 300, y: 860 },
    },
    padding: 50,
  },
}
