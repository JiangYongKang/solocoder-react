export const BACKGROUND_MODES = {
  COLOR: 'color',
  IMAGE: 'image',
  GRADIENT: 'gradient',
}

export const BACKGROUND_MODE_LABELS = {
  color: '纯色',
  image: '背景图片',
  gradient: '渐变背景',
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

export const IMAGE_FIT_MODES = {
  COVER: 'cover',
  CONTAIN: 'contain',
  STRETCH: 'stretch',
}

export const IMAGE_FIT_MODE_LABELS = {
  cover: '填充',
  contain: '适应',
  stretch: '拉伸',
}

export const SKIP_BUTTON_POSITIONS = {
  TOP_RIGHT: 'top-right',
  BOTTOM_RIGHT: 'bottom-right',
  BOTTOM_CENTER: 'bottom-center',
}

export const SKIP_BUTTON_POSITION_LABELS = {
  'top-right': '右上角',
  'bottom-right': '右下角',
  'bottom-center': '底部居中',
}

export const PRESET_COLORS = [
  '#FFFFFF', '#000000', '#FF6B6B', '#4ECDC4', '#45B7D1',
  '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F',
  '#BB8FCE', '#85C1E9', '#F8B500', '#FF8C00', '#2ECC71',
  '#3498DB', '#9B59B6', '#E74C3C', '#1ABC9C', '#F39C12',
  '#1a1a2e', '#16213e', '#0f3460', '#e94560', '#f5f5f5',
  '#2c3e50', '#34495e', '#7f8c8d', '#ecf0f1', '#f1c40f',
]

export const PRESET_SCREEN_RATIOS = {
  IPHONE_X: { width: 375, height: 812, label: 'iPhone X (375×812)' },
  ANDROID: { width: 360, height: 640, label: 'Android (360×640)' },
}

export const MIN_LOGO_SIZE = 30
export const MAX_LOGO_SIZE = 150
export const DEFAULT_LOGO_SIZE = 80

export const MIN_FONT_SIZE = 12
export const MAX_FONT_SIZE = 60
export const DEFAULT_TITLE_FONT_SIZE = 28
export const DEFAULT_SUBTITLE_FONT_SIZE = 16

export const MIN_COUNTDOWN_SECONDS = 1
export const MAX_COUNTDOWN_SECONDS = 10
export const DEFAULT_COUNTDOWN_SECONDS = 3

export const MAX_LOGO_FILE_SIZE = 1 * 1024 * 1024
export const ALLOWED_LOGO_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml']

export const STORAGE_KEY_CONFIGS = 'splash-config-list'
export const STORAGE_KEY_LAST = 'splash-config-last'

export const DEFAULT_CONFIG = {
  templateId: null,
  brand: {
    logo: {
      image: null,
      size: DEFAULT_LOGO_SIZE,
    },
    title: {
      text: '我的应用',
      fontSize: DEFAULT_TITLE_FONT_SIZE,
      color: '#1a1a1a',
      bold: true,
    },
    subtitle: {
      text: '让生活更美好',
      fontSize: DEFAULT_SUBTITLE_FONT_SIZE,
      color: '#666666',
      bold: false,
    },
  },
  background: {
    mode: BACKGROUND_MODES.COLOR,
    color: '#FFFFFF',
    image: null,
    imageFit: IMAGE_FIT_MODES.COVER,
    gradientStart: '#667eea',
    gradientEnd: '#764ba2',
    gradientDirection: GRADIENT_DIRECTIONS.DIAGONAL,
  },
  interaction: {
    countdown: {
      enabled: true,
      seconds: DEFAULT_COUNTDOWN_SECONDS,
      format: '跳过 {n}s',
    },
    skipButton: {
      enabled: true,
      text: '跳过',
      position: SKIP_BUTTON_POSITIONS.TOP_RIGHT,
      color: '#333333',
      backgroundColor: 'rgba(255,255,255,0.8)',
    },
  },
  preview: {
    screenRatio: 'IPHONE_X',
  },
}

export const TEMPLATES = [
  {
    id: 'minimal-white',
    name: '极简白底',
    thumbnail: {
      bg: '#FFFFFF',
      logoColor: '#1a1a1a',
      layout: 'center',
    },
    config: {
      brand: {
        logo: {
          image: null,
          size: 100,
        },
        title: {
          text: '极简应用',
          fontSize: 32,
          color: '#1a1a1a',
          bold: true,
        },
        subtitle: {
          text: '简约而不简单',
          fontSize: 16,
          color: '#999999',
          bold: false,
        },
      },
      background: {
        mode: BACKGROUND_MODES.COLOR,
        color: '#FFFFFF',
        image: null,
        imageFit: IMAGE_FIT_MODES.COVER,
        gradientStart: '#667eea',
        gradientEnd: '#764ba2',
        gradientDirection: GRADIENT_DIRECTIONS.DIAGONAL,
      },
      interaction: {
        countdown: {
          enabled: true,
          seconds: 3,
          format: '跳过 {n}s',
        },
        skipButton: {
          enabled: true,
          text: '跳过',
          position: SKIP_BUTTON_POSITIONS.TOP_RIGHT,
          color: '#666666',
          backgroundColor: 'rgba(0,0,0,0.05)',
        },
      },
    },
  },
  {
    id: 'tech-dark',
    name: '科技深色',
    thumbnail: {
      bg: '#0f0f23',
      logoColor: '#00d4ff',
      layout: 'center',
    },
    config: {
      brand: {
        logo: {
          image: null,
          size: 90,
        },
        title: {
          text: 'TechApp',
          fontSize: 30,
          color: '#00d4ff',
          bold: true,
        },
        subtitle: {
          text: '未来科技 触手可及',
          fontSize: 15,
          color: 'rgba(255,255,255,0.7)',
          bold: false,
        },
      },
      background: {
        mode: BACKGROUND_MODES.GRADIENT,
        color: '#0f0f23',
        image: null,
        imageFit: IMAGE_FIT_MODES.COVER,
        gradientStart: '#0f0f23',
        gradientEnd: '#1a1a3e',
        gradientDirection: GRADIENT_DIRECTIONS.DIAGONAL,
      },
      interaction: {
        countdown: {
          enabled: true,
          seconds: 5,
          format: '跳过 {n}s',
        },
        skipButton: {
          enabled: true,
          text: '跳过',
          position: SKIP_BUTTON_POSITIONS.TOP_RIGHT,
          color: '#ffffff',
          backgroundColor: 'rgba(0,212,255,0.2)',
        },
      },
    },
  },
  {
    id: 'business-top',
    name: '商务风',
    thumbnail: {
      bg: '#2c3e50',
      logoColor: '#ecf0f1',
      layout: 'top',
    },
    config: {
      brand: {
        logo: {
          image: null,
          size: 70,
        },
        title: {
          text: '商务办公',
          fontSize: 26,
          color: '#ffffff',
          bold: true,
        },
        subtitle: {
          text: '高效办公 专业之选',
          fontSize: 14,
          color: 'rgba(255,255,255,0.8)',
          bold: false,
        },
      },
      background: {
        mode: BACKGROUND_MODES.GRADIENT,
        color: '#2c3e50',
        image: null,
        imageFit: IMAGE_FIT_MODES.COVER,
        gradientStart: '#2c3e50',
        gradientEnd: '#34495e',
        gradientDirection: GRADIENT_DIRECTIONS.VERTICAL,
      },
      interaction: {
        countdown: {
          enabled: true,
          seconds: 4,
          format: '{n}s 后进入',
        },
        skipButton: {
          enabled: true,
          text: '立即进入',
          position: SKIP_BUTTON_POSITIONS.BOTTOM_CENTER,
          color: '#2c3e50',
          backgroundColor: '#ffffff',
        },
      },
    },
  },
  {
    id: 'playful-gradient',
    name: '活泼多彩',
    thumbnail: {
      bg: 'linear-gradient(135deg, #ff6b6b, #feca57)',
      logoColor: '#ffffff',
      layout: 'center',
    },
    config: {
      brand: {
        logo: {
          image: null,
          size: 95,
        },
        title: {
          text: '乐享生活',
          fontSize: 30,
          color: '#ffffff',
          bold: true,
        },
        subtitle: {
          text: '发现生活中的小确幸',
          fontSize: 16,
          color: 'rgba(255,255,255,0.95)',
          bold: false,
        },
      },
      background: {
        mode: BACKGROUND_MODES.GRADIENT,
        color: '#ff6b6b',
        image: null,
        imageFit: IMAGE_FIT_MODES.COVER,
        gradientStart: '#ff6b6b',
        gradientEnd: '#feca57',
        gradientDirection: GRADIENT_DIRECTIONS.DIAGONAL,
      },
      interaction: {
        countdown: {
          enabled: true,
          seconds: 3,
          format: '跳过 {n}',
        },
        skipButton: {
          enabled: true,
          text: '跳过',
          position: SKIP_BUTTON_POSITIONS.TOP_RIGHT,
          color: '#ff6b6b',
          backgroundColor: '#ffffff',
        },
      },
    },
  },
  {
    id: 'elegant-purple',
    name: '优雅紫色',
    thumbnail: {
      bg: 'linear-gradient(135deg, #667eea, #764ba2)',
      logoColor: '#ffffff',
      layout: 'center',
    },
    config: {
      brand: {
        logo: {
          image: null,
          size: 85,
        },
        title: {
          text: '紫韵',
          fontSize: 28,
          color: '#ffffff',
          bold: true,
        },
        subtitle: {
          text: '优雅气质 与众不同',
          fontSize: 15,
          color: 'rgba(255,255,255,0.85)',
          bold: false,
        },
      },
      background: {
        mode: BACKGROUND_MODES.GRADIENT,
        color: '#667eea',
        image: null,
        imageFit: IMAGE_FIT_MODES.COVER,
        gradientStart: '#667eea',
        gradientEnd: '#764ba2',
        gradientDirection: GRADIENT_DIRECTIONS.DIAGONAL,
      },
      interaction: {
        countdown: {
          enabled: false,
          seconds: 3,
          format: '跳过 {n}s',
        },
        skipButton: {
          enabled: true,
          text: '进入',
          position: SKIP_BUTTON_POSITIONS.BOTTOM_RIGHT,
          color: '#764ba2',
          backgroundColor: '#ffffff',
        },
      },
    },
  },
  {
    id: 'fresh-green',
    name: '清新绿色',
    thumbnail: {
      bg: 'linear-gradient(135deg, #11998e, #38ef7d)',
      logoColor: '#ffffff',
      layout: 'center',
    },
    config: {
      brand: {
        logo: {
          image: null,
          size: 88,
        },
        title: {
          text: '清新生活',
          fontSize: 29,
          color: '#ffffff',
          bold: true,
        },
        subtitle: {
          text: '回归自然 感受清新',
          fontSize: 15,
          color: 'rgba(255,255,255,0.9)',
          bold: false,
        },
      },
      background: {
        mode: BACKGROUND_MODES.GRADIENT,
        color: '#11998e',
        image: null,
        imageFit: IMAGE_FIT_MODES.COVER,
        gradientStart: '#11998e',
        gradientEnd: '#38ef7d',
        gradientDirection: GRADIENT_DIRECTIONS.HORIZONTAL,
      },
      interaction: {
        countdown: {
          enabled: true,
          seconds: 4,
          format: '跳过 {n}s',
        },
        skipButton: {
          enabled: true,
          text: '跳过',
          position: SKIP_BUTTON_POSITIONS.TOP_RIGHT,
          color: '#11998e',
          backgroundColor: 'rgba(255,255,255,0.9)',
        },
      },
    },
  },
]
