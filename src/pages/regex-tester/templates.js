export const REGEX_TEMPLATES = [
  {
    category: '数字相关',
    items: [
      {
        name: '整数',
        pattern: '^-?\\d+$',
        description: '匹配正负整数',
      },
      {
        name: '正整数',
        pattern: '^[1-9]\\d*$',
        description: '匹配大于 0 的整数',
      },
      {
        name: '负整数',
        pattern: '^-[1-9]\\d*$',
        description: '匹配小于 0 的整数',
      },
      {
        name: '非负整数',
        pattern: '^\\d+$',
        description: '匹配 0 和正整数',
      },
      {
        name: '浮点数',
        pattern: '^-?\\d+\\.\\d+$',
        description: '匹配标准小数',
      },
      {
        name: '金额（两位小数）',
        pattern: '^\\d+(\\.\\d{1,2})?$',
        description: '匹配金额，最多两位小数',
      },
      {
        name: '百分比',
        pattern: '^(100|[1-9]?\\d)(\\.\\d+)?%$',
        description: '匹配 0-100 的百分比',
      },
      {
        name: '十六进制数',
        pattern: '^0[xX][0-9a-fA-F]+$',
        description: '匹配十六进制数',
      },
    ],
  },
  {
    category: '字符串相关',
    items: [
      {
        name: '中文',
        pattern: '^[\\u4e00-\\u9fa5]+$',
        description: '只匹配中文字符',
      },
      {
        name: '英文',
        pattern: '^[A-Za-z]+$',
        description: '只匹配英文字母',
      },
      {
        name: '英文数字',
        pattern: '^[A-Za-z0-9]+$',
        description: '只匹配字母和数字',
      },
      {
        name: '用户名',
        pattern: '^[A-Za-z][A-Za-z0-9_]{3,15}$',
        description: '字母开头，4-16 位字母数字下划线',
      },
      {
        name: '强密码',
        pattern: '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$',
        description: '至少8位，包含大小写字母、数字和特殊字符',
      },
      {
        name: '空行',
        pattern: '^\\s*$',
        description: '匹配空白行',
      },
      {
        name: '首尾空白',
        pattern: '^\\s+|\\s+$',
        description: '匹配首尾空白字符（用于trim）',
      },
    ],
  },
  {
    category: '网络相关',
    items: [
      {
        name: 'URL',
        pattern: '^https?:\\/\\/[\\w\\-]+(\\.[\\w\\-]+)+([\\w\\-.,@?^=%&:/~+#]*[\\w\\-@?^=%&/~+#])?$',
        description: '匹配 http/https URL',
      },
      {
        name: 'IP 地址 (IPv4)',
        pattern: '^((25[0-5]|2[0-4]\\d|[01]?\\d\\d?)\\.){3}(25[0-5]|2[0-4]\\d|[01]?\\d\\d?)$',
        description: '匹配 IPv4 地址',
      },
      {
        name: '域名',
        pattern: '^[a-zA-Z0-9]([a-zA-Z0-9\\-]{0,61}[a-zA-Z0-9])?(\\.[a-zA-Z0-9]([a-zA-Z0-9\\-]{0,61}[a-zA-Z0-9])?)*\\.[a-zA-Z]{2,}$',
        description: '匹配标准域名',
      },
      {
        name: '邮箱',
        pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$',
        description: '匹配电子邮箱地址',
      },
      {
        name: 'MAC 地址',
        pattern: '^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$',
        description: '匹配 MAC 地址',
      },
    ],
  },
  {
    category: '日期时间',
    items: [
      {
        name: '日期 YYYY-MM-DD',
        pattern: '^\\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\\d|3[01])$',
        description: '匹配标准日期格式',
      },
      {
        name: '日期 YYYY/MM/DD',
        pattern: '^\\d{4}\\/(0[1-9]|1[0-2])\\/(0[1-9]|[12]\\d|3[01])$',
        description: '匹配斜杠分隔日期',
      },
      {
        name: '时间 HH:mm:ss',
        pattern: '^([01]\\d|2[0-3]):([0-5]\\d):([0-5]\\d)$',
        description: '匹配 24 小时制时间',
      },
      {
        name: '日期时间',
        pattern: '^\\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\\d|3[01]) ([01]\\d|2[0-3]):([0-5]\\d):([0-5]\\d)$',
        description: '匹配 YYYY-MM-DD HH:mm:ss',
      },
      {
        name: 'ISO 日期',
        pattern: '^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}(\\.\\d+)?(Z|[+-]\\d{2}:?\\d{2})?$',
        description: '匹配 ISO 8601 日期格式',
      },
    ],
  },
  {
    category: '表单校验',
    items: [
      {
        name: '手机号 (中国)',
        pattern: '^1[3-9]\\d{9}$',
        description: '匹配中国大陆手机号',
      },
      {
        name: '座机号码',
        pattern: '^0\\d{2,3}-?\\d{7,8}$',
        description: '匹配中国座机号码',
      },
      {
        name: '身份证号',
        pattern: '^[1-9]\\d{5}(18|19|20)\\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\\d|3[01])\\d{3}[\\dXx]$',
        description: '匹配 18 位身份证号',
      },
      {
        name: '邮政编码',
        pattern: '^[1-9]\\d{5}$',
        description: '匹配中国邮政编码',
      },
      {
        name: '银行卡号',
        pattern: '^\\d{16,19}$',
        description: '匹配 16-19 位银行卡号',
      },
      {
        name: '车牌号',
        pattern: '^[京津沪渝冀豫云辽黑湘皖鲁新苏浙赣鄂桂甘晋蒙陕吉闽贵粤青藏川宁琼使领][A-Z][A-Z0-9]{5,6}$',
        description: '匹配中国车牌号',
      },
    ],
  },
  {
    category: '编程常用',
    items: [
      {
        name: 'HTML 标签',
        pattern: '<([a-zA-Z][a-zA-Z0-9]*)\\b[^>]*>(.*?)<\\/\\1>',
        description: '匹配成对的 HTML 标签',
      },
      {
        name: '十六进制颜色',
        pattern: '^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$',
        description: '匹配 #RGB / #RRGGBB / #RRGGBBAA',
      },
      {
        name: '变量名 (JS)',
        pattern: '^[a-zA-Z_$][a-zA-Z0-9_$]*$',
        description: '匹配合法的 JS 变量名',
      },
      {
        name: '注释（单行）',
        pattern: '\\/\\/.*$',
        description: '匹配 JS/TS 单行注释',
      },
      {
        name: '注释（多行）',
        pattern: '\\/\\*[\\s\\S]*?\\*\\/',
        description: '匹配 C 风格多行注释',
      },
      {
        name: 'Base64 字符串',
        pattern: '^[A-Za-z0-9+/]+=*$',
        description: '匹配 Base64 编码字符串',
      },
    ],
  },
]
